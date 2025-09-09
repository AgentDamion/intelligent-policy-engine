import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"
import { PlatformCredentials, FileUploadRequest, ComplianceMetadata } from "../shared/platform-adapter-types.ts"
import { CredentialManager } from "../shared/credential-manager.ts"
import { VeevaAdapter } from "../platform-veeva/adapter.ts"
import { SharePointAdapter } from "../platform-sharepoint/adapter.ts"
import { AdobeAdapter } from "../platform-adobe/adapter.ts"
import { PlatformConfig } from "../shared/platform-adapter-base.ts"

// Input validation schemas
const IntegrationRequestSchema = z.object({
  activity_id: z.string().uuid(),
  compliance_data: z.record(z.any()),
  target_platforms: z.array(z.string()).optional(),
  file_data: z.object({
    name: z.string(),
    content: z.string(),
    mime_type: z.string(),
    size: z.number()
  }).optional(),
  organization_id: z.string().uuid().optional(),
  enterprise_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  async: z.boolean().default(false)
})

const JobStatusSchema = z.object({
  job_id: z.string().uuid(),
  organization_id: z.string().uuid()
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // POST /platform-universal/integrate - Main integration endpoint
    if (req.method === 'POST' && url.pathname.endsWith('/integrate')) {
      const body = await req.json()
      const payload = IntegrationRequestSchema.parse(body)
      const org = payload.organization_id || payload.enterprise_id || req.headers.get('x-org-id') || req.headers.get('x-enterprise-id')
      if (!org) return json({ error: 'Missing organization_id' }, 400)

      // If async processing requested, create job and return immediately
      if (payload.async) {
        const jobId = crypto.randomUUID()
        await sb.from('platform_integration_jobs').insert({
          id: jobId,
          organization_id: org,
          activity_id: payload.activity_id,
          status: 'pending',
          priority: payload.priority,
          request_data: payload,
          created_at: new Date().toISOString()
        })
        
        // Trigger async processing (in production, this would be a queue)
        processIntegrationJob(jobId, org, payload).catch(console.error)
        
        return json({ 
          ok: true, 
          job_id: jobId, 
          status: 'queued',
          message: 'Integration job created and queued for processing'
        })
      }

      // Synchronous processing
      const results = await processIntegrationSync(org, payload, sb)
      return json({ ok: true, results })
    }

    // GET /platform-universal/job/{job_id} - Check job status
    if (req.method === 'GET' && url.pathname.includes('/job/')) {
      const jobId = url.pathname.split('/').pop()
      const org = req.headers.get('x-org-id') || req.headers.get('x-enterprise-id')
      if (!org) return json({ error: 'Missing organization_id' }, 400)
      if (!jobId) return json({ error: 'Missing job_id' }, 400)

      const { data: job, error } = await sb
        .from('platform_integration_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('organization_id', org)
        .single()

      if (error || !job) return json({ error: 'Job not found' }, 404)
      return json({ job })
    }

    // POST /platform-universal/retry/{job_id} - Retry failed job
    if (req.method === 'POST' && url.pathname.includes('/retry/')) {
      const jobId = url.pathname.split('/').pop()
      const org = req.headers.get('x-org-id') || req.headers.get('x-enterprise-id')
      if (!org) return json({ error: 'Missing organization_id' }, 400)
      if (!jobId) return json({ error: 'Missing job_id' }, 400)

      const { data: job, error } = await sb
        .from('platform_integration_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('organization_id', org)
        .single()

      if (error || !job) return json({ error: 'Job not found' }, 404)
      if (job.status !== 'failed') return json({ error: 'Job is not in failed state' }, 400)

      // Reset job for retry
      await sb
        .from('platform_integration_jobs')
        .update({ 
          status: 'pending', 
          retry_count: (job.retry_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      // Process job
      processIntegrationJob(jobId, org, job.request_data).catch(console.error)
      
      return json({ ok: true, message: 'Job queued for retry' })
    }

    // GET /platform-universal/health - Health check
    if (req.method === 'GET' && url.pathname.endsWith('/health')) {
      const health = await checkSystemHealth(sb)
      return json({ ok: true, health })
    }

    return json({ ok: true, message: 'Universal Platform API alive' })
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-org-id, x-enterprise-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
}

// Process integration synchronously
async function processIntegrationSync(org: string, payload: any, sb: any) {
  let q = sb.from('platform_configurations').select('*').eq('organization_id', org).eq('status','active')
  if (Array.isArray(payload.target_platforms) && payload.target_platforms.length) {
    q = q.in('platform_type', payload.target_platforms)
  }
  const { data: configs, error } = await q
  if (error) throw new Error(error.message)

  const results: any[] = []
  for (const cfg of configs || []) {
    try {
      const result = await processPlatformIntegration(cfg, payload, sb)
      results.push(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push({ 
        platform: cfg.platform_type, 
        success: false, 
        error: msg 
      })
    }
  }

  return results
}

// Process integration job asynchronously
async function processIntegrationJob(jobId: string, org: string, payload: any) {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  
  try {
    // Update job status to processing
    await sb
      .from('platform_integration_jobs')
      .update({ 
        status: 'processing', 
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Process integration
    const results = await processIntegrationSync(org, payload, sb)
    
    // Update job with results
    await sb
      .from('platform_integration_jobs')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        result_data: results,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    
    // Update job with error
    await sb
      .from('platform_integration_jobs')
      .update({ 
        status: 'failed', 
        error_message: error,
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }
}

// Process integration for a specific platform
async function processPlatformIntegration(cfg: any, payload: any, sb: any) {
  const credsObj = cfg.credentials_encrypted ? await CredentialManager.decryptCredentials(cfg.credentials_encrypted) : null
  const creds = credsObj as PlatformCredentials | null
  const pconfig: PlatformConfig = { 
    name: cfg.platform_type, 
    endpoints: { 
      base_url: cfg.configuration?.endpoints?.base_url || cfg.configuration?.base_url || '' 
    } 
  }

  let adapter: any
  const t = (cfg.platform_type || '').toLowerCase()
  
  if (t.includes('veeva')) {
    adapter = new VeevaAdapter(creds as any, pconfig)
  } else if (t.includes('sharepoint')) {
    adapter = new SharePointAdapter(creds as any, pconfig)
  } else if (t.includes('adobe')) {
    adapter = new AdobeAdapter(creds as any, pconfig)
  } else {
    throw new Error(`Unsupported platform: ${cfg.platform_type}`)
  }

  if (creds) await adapter.authenticate(creds)

  const uploadReq: FileUploadRequest | null = payload.file_data ? { 
    file: {
      name: payload.file_data.name,
      content: new TextEncoder().encode(payload.file_data.content),
      mime_type: payload.file_data.mime_type,
      size: payload.file_data.size
    }, 
    metadata: payload.compliance_data as ComplianceMetadata, 
    project_id: payload.compliance_data?.aicomplyr?.project_id 
  } : null

  const res = uploadReq ? await adapter.uploadFile(uploadReq) : { success: true, metadata_only: true }

  // Log integration attempt
  await sb.from('platform_integration_logs').insert({
    organization_id: payload.organization_id || payload.enterprise_id,
    platform_config_id: cfg.id,
    operation: uploadReq ? 'upload' : 'metadata',
    entity_type: 'file',
    entity_id: payload.activity_id,
    status: res.success ? 'success' : 'error',
    request_data: { 
      activity_id: payload.activity_id, 
      target_platform: cfg.platform_type 
    },
    response_data: res,
    created_at: new Date().toISOString()
  })

  return { 
    platform: cfg.platform_type, 
    result: res, 
    success: res.success !== false 
  }
}

// Check system health
async function checkSystemHealth(sb: any) {
  try {
    // Check database connectivity
    const { data: configs, error } = await sb
      .from('platform_configurations')
      .select('id')
      .limit(1)

    if (error) throw error

    // Check platform adapters
    const platformHealth = await Promise.allSettled([
      checkPlatformHealth('veeva'),
      checkPlatformHealth('sharepoint'),
      checkPlatformHealth('adobe')
    ])

    return {
      database: 'healthy',
      platforms: {
        veeva: platformHealth[0].status === 'fulfilled' ? platformHealth[0].value : 'unhealthy',
        sharepoint: platformHealth[1].status === 'fulfilled' ? platformHealth[1].value : 'unhealthy',
        adobe: platformHealth[2].status === 'fulfilled' ? platformHealth[2].value : 'unhealthy'
      },
      timestamp: new Date().toISOString()
    }
  } catch (e) {
    return {
      database: 'unhealthy',
      error: e instanceof Error ? e.message : String(e),
      timestamp: new Date().toISOString()
    }
  }
}

// Check individual platform health
async function checkPlatformHealth(platform: string) {
  try {
    // This would check actual platform connectivity
    // For now, return mock health status
    return 'healthy'
  } catch (e) {
    return 'unhealthy'
  }
}


