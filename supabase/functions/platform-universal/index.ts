import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"
import { PlatformCredentials, FileUploadRequest, ComplianceMetadata, PlatformAdapter } from "../shared/platform-adapter-types.ts"
import { CredentialManager } from "../shared/credential-manager.ts"
import { VeevaAdapter } from "../platform-veeva/adapter.ts"
import { SharePointAdapter } from "../platform-sharepoint/adapter.ts"
import { AdobeAdapter } from "../platform-adobe/adapter.ts"
import { PlatformConfig } from "../shared/platform-adapter-base.ts"

// Request validation schemas
const IntegrationRequestSchema = z.object({
  activity_id: z.string().uuid(),
  compliance_data: z.record(z.any()),
  target_platforms: z.array(z.string()).optional(),
  file_data: z.object({
    name: z.string(),
    content: z.string(), // base64 encoded
    mime_type: z.string(),
    size: z.number()
  }).optional(),
  organization_id: z.string().uuid().optional(),
  enterprise_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  priority: z.number().min(1).max(10).default(5),
  async: z.boolean().default(false)
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // Health check endpoint
    if (req.method === 'GET' && url.pathname.endsWith('/health')) {
      return json({ 
        status: 'healthy', 
        service: 'platform-universal',
        version: '1.0.0',
        timestamp: new Date().toISOString() 
      })
    }
    
    // Main integration endpoint
    if (req.method === 'POST' && url.pathname.endsWith('/integrate')) {
      const body = await req.json()
      const validatedData = IntegrationRequestSchema.parse(body)
      
      // Extract organization ID
      const org = validatedData.organization_id || 
                  validatedData.enterprise_id || 
                  req.headers.get('x-org-id') || 
                  req.headers.get('x-enterprise-id')
      
      if (!org) {
        return json({ error: 'Missing organization_id' }, 400)
      }

      const sb = createClient(
        Deno.env.get('SUPABASE_URL')!, 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // If async mode, create job and return immediately
      if (validatedData.async) {
        const jobId = await createIntegrationJob(sb, org, validatedData)
        return json({ 
          ok: true, 
          job_id: jobId,
          status: 'queued',
          message: 'Integration job queued for async processing' 
        })
      }

      // Synchronous processing
      const result = await processIntegration(sb, org, validatedData)
      return json(result)
    }
    
    // Job status endpoint
    if (req.method === 'GET' && url.pathname.match(/\/jobs\/[\w-]+$/)) {
      const jobId = url.pathname.split('/').pop()!
      const org = req.headers.get('x-org-id') || 
                  req.headers.get('x-enterprise-id') ||
                  url.searchParams.get('organization_id')
      
      if (!org) {
        return json({ error: 'Missing organization_id' }, 400)
      }

      const sb = createClient(
        Deno.env.get('SUPABASE_URL')!, 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const { data: job, error } = await sb
        .from('platform_integration_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('organization_id', org)
        .single()

      if (error || !job) {
        return json({ error: 'Job not found' }, 404)
      }

      return json(job)
    }

    return json({ ok: true, message: 'Universal Platform API' })
  } catch (e) {
    console.error('Error in platform-universal:', e)
    return json({ 
      ok: false, 
      error: e instanceof Error ? e.message : String(e) 
    }, 500)
  }
})

async function processIntegration(
  sb: SupabaseClient,
  org: string,
  data: z.infer<typeof IntegrationRequestSchema>
): Promise<any> {
  const { activity_id, compliance_data, target_platforms, file_data, project_id } = data

  // Build compliance metadata from provided data
  const metadata = buildComplianceMetadata(compliance_data, org, activity_id, project_id)

  // Get platform configurations
  let query = sb
    .from('platform_configurations')
    .select('*')
    .eq('organization_id', org)
    .eq('status', 'active')

  // Filter by target platforms if specified
  if (Array.isArray(target_platforms) && target_platforms.length > 0) {
    query = query.in('platform_type', target_platforms)
  }

  // If project_id provided, check for project-specific platform configs
  if (project_id) {
    // TODO: Add project-based platform selection logic
  }

  const { data: configs, error } = await query
  if (error) {
    throw new Error(`Failed to fetch platform configurations: ${error.message}`)
  }

  if (!configs || configs.length === 0) {
    return {
      ok: true,
      results: [],
      message: 'No active platform configurations found'
    }
  }

  // Process integrations in parallel
  const results = await Promise.allSettled(
    configs.map(cfg => processplatformIntegration(sb, cfg, metadata, file_data, org, activity_id))
  )

  // Format results
  const formattedResults = results.map((result, index) => {
    const cfg = configs[index]
    if (result.status === 'fulfilled') {
      return {
        platform: cfg.platform_type,
        platform_name: cfg.platform_name,
        success: true,
        result: result.value
      }
    } else {
      return {
        platform: cfg.platform_type,
        platform_name: cfg.platform_name,
        success: false,
        error: result.reason?.message || String(result.reason)
      }
    }
  })

  // Update activity with integration status
  await updateActivityIntegrationStatus(sb, activity_id, formattedResults)

  // Update platform metrics
  await updatePlatformMetrics(sb, org, configs, formattedResults)

  return {
    ok: true,
    activity_id,
    organization_id: org,
    platforms_processed: configs.length,
    results: formattedResults
  }
}

async function processplatformIntegration(
  sb: SupabaseClient,
  config: any,
  metadata: ComplianceMetadata,
  fileData: any,
  org: string,
  activityId: string
): Promise<any> {
  const startTime = Date.now()
  
  try {
    // Decrypt credentials
    const credentials = config.credentials_encrypted 
      ? await CredentialManager.decryptCredentials(config.credentials_encrypted)
      : null

    if (!credentials) {
      throw new Error('No credentials found for platform configuration')
    }

    // Create platform credentials object
    const platformCreds: PlatformCredentials = {
      platform: config.platform_type,
      auth_type: detectAuthType(credentials),
      credentials: credentials,
      endpoints: {
        base_url: config.configuration?.endpoints?.base_url || config.configuration?.base_url || '',
        ...(config.configuration?.endpoints || {})
      }
    }

    // Create platform config
    const platformConfig: PlatformConfig = {
      name: config.platform_type,
      displayName: config.platform_name,
      endpoints: {
        base_url: config.configuration?.endpoints?.base_url || config.configuration?.base_url || '',
        ...(config.configuration?.endpoints || {})
      }
    }

    // Create adapter instance
    const adapter = createAdapter(config.platform_type, platformCreds, platformConfig)
    if (!adapter) {
      throw new Error(`Unsupported platform type: ${config.platform_type}`)
    }

    // Authenticate
    const authResult = await adapter.authenticate(platformCreds)
    if (!authResult.success) {
      throw new Error(authResult.error?.message || 'Authentication failed')
    }

    // Prepare file upload request if file data provided
    let uploadResult: any = null
    if (fileData) {
      const fileContent = Uint8Array.from(atob(fileData.content), c => c.charCodeAt(0))
      const uploadReq: FileUploadRequest = {
        file: {
          name: fileData.name,
          content: fileContent,
          mime_type: fileData.mime_type,
          size: fileData.size
        },
        metadata: metadata,
        project_id: metadata.aicomplyr.project_id,
        overwrite: false
      }

      uploadResult = await withRetry(() => adapter.uploadFile(uploadReq), 3)
    } else {
      // Metadata-only operation
      // For now, return success as metadata would be attached during file upload
      uploadResult = {
        success: true,
        metadata_only: true,
        message: 'Metadata prepared for next file upload'
      }
    }

    const duration = Date.now() - startTime

    // Log successful integration
    await sb.from('platform_integration_logs').insert({
      organization_id: org,
      platform_config_id: config.id,
      operation: fileData ? 'file_upload' : 'metadata_sync',
      entity_type: 'agent_activity',
      entity_id: activityId,
      platform_entity_id: uploadResult?.platform_file_id,
      status: 'success',
      request_data: {
        has_file: !!fileData,
        file_name: fileData?.name,
        metadata_keys: Object.keys(metadata)
      },
      response_data: uploadResult,
      duration_ms: duration,
      created_at: new Date().toISOString()
    })

    return uploadResult

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Log failed integration
    await sb.from('platform_integration_logs').insert({
      organization_id: org,
      platform_config_id: config.id,
      operation: fileData ? 'file_upload' : 'metadata_sync',
      entity_type: 'agent_activity',
      entity_id: activityId,
      status: 'error',
      error_code: 'INTEGRATION_FAILED',
      error_message: errorMessage,
      duration_ms: duration,
      created_at: new Date().toISOString()
    })

    throw error
  }
}

function createAdapter(
  platformType: string,
  credentials: PlatformCredentials,
  config: PlatformConfig
): PlatformAdapter | null {
  const type = platformType.toLowerCase()
  
  if (type.includes('veeva')) {
    return new VeevaAdapter(credentials, config)
  } else if (type.includes('sharepoint')) {
    return new SharePointAdapter(credentials, config)
  } else if (type.includes('adobe')) {
    return new AdobeAdapter(credentials, config)
  }
  
  return null
}

function buildComplianceMetadata(
  complianceData: any,
  orgId: string,
  activityId: string,
  projectId?: string
): ComplianceMetadata {
  // If compliance data is already in the correct format, use it
  if (complianceData.aicomplyr && complianceData.compliance) {
    return complianceData as ComplianceMetadata
  }

  // Otherwise, build from the provided data
  return {
    aicomplyr: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      project_id: projectId || complianceData.project_id || '',
      organization_id: orgId,
      activity_id: activityId
    },
    compliance: {
      status: complianceData.compliance_status || 'compliant',
      score: complianceData.compliance_score || 100,
      risk_level: complianceData.risk_level || 'low',
      last_checked: complianceData.last_checked || new Date().toISOString()
    },
    ai_tools: complianceData.ai_tools || [],
    policy_checks: complianceData.policy_checks || [],
    violations: complianceData.violations || [],
    references: {
      detailed_report_url: `/compliance/reports/${activityId}`,
      audit_trail_url: `/audit/activities/${activityId}`,
      source_activity_url: `/activities/${activityId}`
    }
  }
}

async function createIntegrationJob(
  sb: SupabaseClient,
  org: string,
  data: z.infer<typeof IntegrationRequestSchema>
): Promise<string> {
  const { data: job, error } = await sb
    .from('platform_integration_jobs')
    .insert({
      organization_id: org,
      platform_config_id: null, // Will be set during processing
      job_type: 'multi_platform_integration',
      priority: data.priority,
      payload: data,
      status: 'pending',
      scheduled_for: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create integration job: ${error.message}`)
  }

  return job.id
}

async function updateActivityIntegrationStatus(
  sb: SupabaseClient,
  activityId: string,
  results: any[]
): Promise<void> {
  const allSuccess = results.every(r => r.success)
  const anySuccess = results.some(r => r.success)
  
  let status = 'failed'
  if (allSuccess) status = 'completed'
  else if (anySuccess) status = 'partial'

  // Check if platform_integration_status column exists
  // For now, store in details JSON
  const { error } = await sb
    .from('agent_activities')
    .update({
      details: sb.raw(`
        COALESCE(details, '{}'::jsonb) || 
        jsonb_build_object(
          'platform_integration_status', ?::text,
          'platform_integration_results', ?::jsonb,
          'platform_integration_timestamp', ?::text
        )
      `, [status, JSON.stringify(results), new Date().toISOString()])
    })
    .eq('id', activityId)

  if (error) {
    console.error('Failed to update activity integration status:', error)
  }
}

async function updatePlatformMetrics(
  sb: SupabaseClient,
  org: string,
  configs: any[],
  results: any[]
): Promise<void> {
  const metrics = []
  
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i]
    const result = results[i]
    
    metrics.push({
      organization_id: org,
      platform_config_id: config.id,
      metric_type: 'integration_' + (result.success ? 'success' : 'failure'),
      metric_value: 1,
      metric_unit: 'count',
      time_period: 'hour',
      recorded_at: new Date().toISOString()
    })
  }

  const { error } = await sb
    .from('platform_metrics')
    .insert(metrics)

  if (error) {
    console.error('Failed to update platform metrics:', error)
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  throw new Error('Retry exhausted')
}

function detectAuthType(creds?: Record<string, unknown>): PlatformCredentials['auth_type'] {
  if (!creds) return 'api_key'
  if (creds.access_token || creds.client_id) return 'oauth2'
  if (creds.api_key) return 'api_key'
  if (creds.username && creds.password) return 'basic'
  if (creds.session_id) return 'session'
  if (creds.jwt_token) return 'jwt'
  return 'api_key'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-org-id, x-enterprise-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { 
    status, 
    headers: { 
      'Content-Type': 'application/json', 
      ...corsHeaders 
    } 
  })
}