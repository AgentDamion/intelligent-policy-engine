import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // GET /platform-manager?organization_id=xxx - List configurations
    if (method === 'GET') {
      const organizationId = url.searchParams.get('organization_id');
      
      if (!organizationId) {
        throw new Error('organization_id is required');
      }

      const { data: configs, error } = await supabase
        .from('platform_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ items: configs || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Handle both create and test
    if (method === 'POST') {
      const body = await req.json();
      const { action, config_id } = body;

      // POST /platform-manager/:id/test - Test connection
      if (action === 'test' && config_id) {
        console.log(`Testing connection for config ${config_id}`);

        const { data: config, error: configError } = await supabase
          .from('platform_configurations')
          .select('*')
          .eq('id', config_id)
          .single();

        if (configError || !config) {
          throw new Error('Configuration not found');
        }

        let testResult = { success: false, message: '' };

        // Test connection based on platform type
        switch (config.platform_type) {
          case 'veeva_vault':
            testResult = await testVeevaConnection(config);
            break;
          case 'salesforce':
            testResult = await testSalesforceConnection(config);
            break;
          case 'sharepoint':
            testResult = await testSharePointConnection(config);
            break;
          default:
            testResult = {
              success: false,
              message: `Unsupported platform type: ${config.platform_type}`
            };
        }

        // Update last connection test
        await supabase
          .from('platform_configurations')
          .update({
            last_connection_test: new Date().toISOString(),
            status: testResult.success ? 'active' : 'error'
          })
          .eq('id', config_id);

        // Log the test
        await supabase
          .from('platform_integration_logs')
          .insert({
            platform_config_id: config_id,
            operation_type: 'test',
            status: testResult.success ? 'success' : 'error',
            platform_type: config.platform_type,
            error_message: testResult.success ? null : testResult.message,
            metadata: { message: testResult.message }
          });

        console.log(`Connection test result: ${testResult.success ? 'SUCCESS' : 'FAILED'}`);

        return new Response(
          JSON.stringify(testResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Invalid request');
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('Error in platform-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Platform-specific connection testers
async function testVeevaConnection(config: any) {
  try {
    const { base_url, credentials } = config;
    
    // Veeva Vault API authentication
    const authUrl = `${base_url}/api/v23.1/auth`;
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: credentials.username,
        password: credentials.password
      })
    });

    const data = await response.json();
    
    if (data.responseStatus === 'SUCCESS') {
      return { success: true, message: 'Successfully connected to Veeva Vault' };
    } else {
      return { success: false, message: data.errors?.[0]?.message || 'Failed to authenticate' };
    }
  } catch (error) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}

async function testSalesforceConnection(config: any) {
  try {
    const { base_url, credentials } = config;
    
    // Salesforce OAuth authentication
    const authUrl = `${base_url}/services/oauth2/token`;
    const response = await fetch(authUrl, {
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

    const data = await response.json();
    
    if (data.access_token) {
      return { success: true, message: 'Successfully connected to Salesforce' };
    } else {
      return { success: false, message: data.error_description || 'Failed to authenticate' };
    }
  } catch (error) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}

async function testSharePointConnection(config: any) {
  try {
    const { base_url, credentials } = config;
    
    // SharePoint REST API authentication via Microsoft Graph
    const authUrl = 'https://login.microsoftonline.com/' + credentials.tenant_id + '/oauth2/v2.0/token';
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        scope: 'https://graph.microsoft.com/.default'
      })
    });

    const data = await response.json();
    
    if (data.access_token) {
      return { success: true, message: 'Successfully connected to SharePoint' };
    } else {
      return { success: false, message: data.error_description || 'Failed to authenticate' };
    }
  } catch (error) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}
