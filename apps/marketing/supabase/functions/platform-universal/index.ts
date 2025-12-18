import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  config_id: string;
  sync_type?: 'full' | 'incremental';
  submission_ids?: string[];
  policy_ids?: string[];
  include_audit?: boolean;
  data_filter?: {
    workspace_id?: string;
    enterprise_id?: string;
    date_from?: string;
    date_to?: string;
  };
}

interface ComplianceData {
  submissions: any[];
  policies: any[];
  scores: any[];
  audit_events: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { 
      config_id, 
      sync_type = 'incremental', 
      submission_ids = [],
      policy_ids = [],
      include_audit = false,
      data_filter = {} 
    }: SyncRequest = await req.json();

    console.log(`Starting ${sync_type} sync for config: ${config_id}`);

    // Fetch platform configuration
    const { data: config, error: configError } = await supabase
      .from('platform_configurations')
      .select('*')
      .eq('id', config_id)
      .single();

    if (configError || !config) {
      throw new Error(`Configuration not found: ${configError?.message}`);
    }

    if (!config.is_active) {
      throw new Error('Configuration is not active');
    }

    // Fetch compliance data to sync
    const complianceData = await fetchComplianceData(
      supabase, 
      data_filter, 
      submission_ids, 
      policy_ids,
      include_audit
    );

    // Transform and sync based on platform type
    let syncResult;
    switch (config.platform_type) {
      case 'veeva_vault':
        syncResult = await syncToVeeva(config, complianceData);
        break;
      case 'salesforce_health_cloud':
        syncResult = await syncToSalesforce(config, complianceData);
        break;
      case 'sharepoint':
        syncResult = await syncToSharePoint(config, complianceData);
        break;
      default:
        throw new Error(`Unsupported platform type: ${config.platform_type}`);
    }

    // Update last sync time
    await supabase
      .from('platform_configurations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', config_id);

    // Log sync result
    await supabase
      .from('platform_integration_logs')
      .insert({
        platform_config_id: config_id,
        operation_type: 'sync',
        status: syncResult.success ? 'success' : 'error',
        platform_type: config.platform_type,
        error_message: syncResult.error,
        files_processed: syncResult.records_synced,
        duration_ms: syncResult.duration_ms,
        metadata: {
          sync_type,
          submission_ids,
          policy_ids,
          include_audit,
          data_filter
        },
        enterprise_id: config.enterprise_id
      });

    return new Response(
      JSON.stringify({
        success: syncResult.success,
        message: syncResult.message,
        records_synced: syncResult.records_synced,
        duration_ms: syncResult.duration_ms
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function fetchComplianceData(
  supabase: any, 
  filter: any,
  submission_ids: string[] = [],
  policy_ids: string[] = [],
  include_audit: boolean = false
): Promise<ComplianceData> {
  const startTime = Date.now();
  
  // Build query filters
  let submissionsQuery = supabase.from('submissions').select('*');
  let policiesQuery = supabase.from('policies').select('*');
  let scoresQuery = supabase.from('scores').select('*');
  let auditQuery = include_audit ? supabase.from('audit_events').select('*') : null;

  // Filter by specific IDs if provided
  if (submission_ids.length > 0) {
    submissionsQuery = submissionsQuery.in('id', submission_ids);
  }
  
  if (policy_ids.length > 0) {
    policiesQuery = policiesQuery.in('id', policy_ids);
  }

  // Apply general filters
  if (filter.workspace_id) {
    submissionsQuery = submissionsQuery.eq('workspace_id', filter.workspace_id);
    if (auditQuery) auditQuery = auditQuery.eq('workspace_id', filter.workspace_id);
  }

  if (filter.enterprise_id) {
    policiesQuery = policiesQuery.eq('enterprise_id', filter.enterprise_id);
    if (auditQuery) auditQuery = auditQuery.eq('enterprise_id', filter.enterprise_id);
  }

  if (filter.date_from) {
    submissionsQuery = submissionsQuery.gte('created_at', filter.date_from);
    if (auditQuery) auditQuery = auditQuery.gte('created_at', filter.date_from);
  }

  if (filter.date_to) {
    submissionsQuery = submissionsQuery.lte('created_at', filter.date_to);
    if (auditQuery) auditQuery = auditQuery.lte('created_at', filter.date_to);
  }

  const queries = [submissionsQuery, policiesQuery, scoresQuery];
  if (auditQuery) queries.push(auditQuery);

  const results = await Promise.all(queries);

  console.log(`Fetched compliance data in ${Date.now() - startTime}ms`);

  return {
    submissions: results[0].data || [],
    policies: results[1].data || [],
    scores: results[2].data || [],
    audit_events: results[3]?.data || []
  };
}

async function syncToVeeva(config: any, data: ComplianceData) {
  const startTime = Date.now();
  const credentials = config.credentials;

  try {
    // Authenticate with Veeva Vault
    const authResponse = await fetch(`${credentials.vault_dns}/api/v24.1/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: credentials.username,
        password: credentials.password
      })
    });

    const authData = await authResponse.json();
    if (authData.responseStatus !== 'SUCCESS') {
      throw new Error(`Veeva auth failed: ${authData.errors?.[0]?.message}`);
    }

    const sessionId = authData.sessionId;
    let recordsSynced = 0;

    // Transform and upload compliance documents
    for (const submission of data.submissions) {
      const veevaDoc = transformToVeevaDocument(submission, data.scores);
      
      const uploadResponse = await fetch(`${credentials.vault_dns}/api/v24.1/objects/documents`, {
        method: 'POST',
        headers: {
          'Authorization': sessionId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(veevaDoc)
      });

      const uploadResult = await uploadResponse.json();
      if (uploadResult.responseStatus === 'SUCCESS') {
        recordsSynced++;
      }
    }

    return {
      success: true,
      message: `Successfully synced ${recordsSynced} records to Veeva Vault`,
      records_synced: recordsSynced,
      duration_ms: Date.now() - startTime
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'Veeva sync failed',
      error: error.message,
      records_synced: 0,
      duration_ms: Date.now() - startTime
    };
  }
}

async function syncToSalesforce(config: any, data: ComplianceData) {
  const startTime = Date.now();
  const credentials = config.credentials;

  try {
    // Authenticate with Salesforce
    const authResponse = await fetch(`${credentials.instance_url}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        username: credentials.username,
        password: credentials.password
      })
    });

    const authData = await authResponse.json();
    if (!authData.access_token) {
      throw new Error('Salesforce authentication failed');
    }

    let recordsSynced = 0;

    // Create compliance records in Salesforce
    for (const submission of data.submissions) {
      const sfRecord = transformToSalesforceRecord(submission, data.scores);
      
      const createResponse = await fetch(
        `${credentials.instance_url}/services/data/v58.0/sobjects/Compliance_Record__c`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sfRecord)
        }
      );

      const result = await createResponse.json();
      if (result.success) {
        recordsSynced++;
      }
    }

    return {
      success: true,
      message: `Successfully synced ${recordsSynced} records to Salesforce`,
      records_synced: recordsSynced,
      duration_ms: Date.now() - startTime
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'Salesforce sync failed',
      error: error.message,
      records_synced: 0,
      duration_ms: Date.now() - startTime
    };
  }
}

async function syncToSharePoint(config: any, data: ComplianceData) {
  const startTime = Date.now();
  const credentials = config.credentials;

  try {
    // Authenticate with SharePoint using Microsoft Graph
    const authResponse = await fetch(
      `https://login.microsoftonline.com/${credentials.tenant_id}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        })
      }
    );

    const authData = await authResponse.json();
    if (!authData.access_token) {
      throw new Error('SharePoint authentication failed');
    }

    let recordsSynced = 0;

    // Upload compliance reports to SharePoint
    for (const submission of data.submissions) {
      const reportContent = generateComplianceReport(submission, data.scores);
      const fileName = `compliance_${submission.id}_${Date.now()}.json`;
      
      const uploadResponse = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${credentials.site_id}/drive/root:/${fileName}:/content`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authData.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reportContent)
        }
      );

      if (uploadResponse.ok) {
        recordsSynced++;
      }
    }

    return {
      success: true,
      message: `Successfully synced ${recordsSynced} records to SharePoint`,
      records_synced: recordsSynced,
      duration_ms: Date.now() - startTime
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'SharePoint sync failed',
      error: error.message,
      records_synced: 0,
      duration_ms: Date.now() - startTime
    };
  }
}

function transformToVeevaDocument(submission: any, scores: any[]) {
  const score = scores.find(s => s.submission_id === submission.id);
  
  return {
    name__v: `Compliance Submission ${submission.id}`,
    type__v: 'Compliance Document',
    subtype__v: 'AI Compliance Report',
    classification__v: 'Regulatory',
    lifecycle__v: 'Compliance Doc Lifecycle',
    status__v: 'Draft',
    compliance_score__c: score?.overall_score || 0,
    submission_date__c: submission.created_at,
    approval_status__c: submission.status,
    metadata__c: JSON.stringify({
      workspace_id: submission.workspace_id,
      submission_type: submission.submission_type
    })
  };
}

function transformToSalesforceRecord(submission: any, scores: any[]) {
  const score = scores.find(s => s.submission_id === submission.id);
  
  return {
    Name: `Compliance Submission ${submission.id}`,
    Submission_Date__c: submission.created_at,
    Status__c: submission.status,
    Compliance_Score__c: score?.overall_score || 0,
    Submission_Type__c: submission.submission_type,
    Workspace_ID__c: submission.workspace_id,
    Metadata__c: JSON.stringify({
      policy_version_id: submission.policy_version_id,
      submitted_at: submission.submitted_at
    })
  };
}

function generateComplianceReport(submission: any, scores: any[]) {
  const score = scores.find(s => s.submission_id === submission.id);
  
  return {
    submissionId: submission.id,
    submissionDate: submission.created_at,
    status: submission.status,
    complianceScore: score?.overall_score || 0,
    submissionType: submission.submission_type,
    workspaceId: submission.workspace_id,
    policyVersionId: submission.policy_version_id,
    submittedAt: submission.submitted_at,
    generatedAt: new Date().toISOString()
  };
}
