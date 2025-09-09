// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PlatformCredentials, FileUploadRequest, ComplianceMetadata } from "../shared/platform-adapter-types.ts"
import { CredentialManager } from "../shared/credential-manager.ts"
import { VeevaAdapter } from "../platform-veeva/adapter.ts"
import { SharePointAdapter } from "../platform-sharepoint/adapter.ts"
import { PlatformConfig } from "../shared/platform-adapter-base.ts"
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    if (req.method === 'POST' && url.pathname.endsWith('/integrate')) {
      const body = await req.json()
      const Schema = z.object({
        activity_id: z.string().optional(),
        compliance_data: z.record(z.any()).optional(),
        target_platforms: z.array(z.string()).optional(),
        file_data: z.object({
          name: z.string(),
          content: z.union([z.string(), z.instanceof(Uint8Array)]),
          mime_type: z.string(),
          size: z.number(),
        }).optional(),
        organization_id: z.string().uuid().optional(),
        enterprise_id: z.string().uuid().optional(),
        priority: z.number().int().min(1).max(10).optional(),
        async: z.boolean().optional().default(false),
        fallback_platforms: z.array(z.string()).optional(),
      })
      const parsed = Schema.parse(body)
      const { activity_id, compliance_data, target_platforms, file_data, organization_id, enterprise_id, priority = 5, async: runAsync = false, fallback_platforms = [] } = parsed
      const org = organization_id || enterprise_id || req.headers.get('x-org-id') || req.headers.get('x-enterprise-id')
      if (!org) return json({ error: 'Missing organization_id' }, 400)

      const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      let q = sb.from('platform_configurations').select('*').eq('organization_id', org).eq('status','active')
      if (Array.isArray(target_platforms) && target_platforms.length) q = q.in('platform_type', target_platforms)
      const { data: configs, error } = await q
      if (error) return json({ error: error.message }, 500)

      // Async job mode: create jobs and return
      if (runAsync) {
        const jobs = (configs || []).map((cfg: any) => ({
          organization_id: org,
          platform_config_id: cfg.id,
          job_type: 'integrate_activity',
          priority,
          payload: { activity_id, target_platform: cfg.platform_type, file_data, compliance_data, fallback_platforms },
          status: 'pending',
          scheduled_for: new Date().toISOString(),
          max_retries: 3,
        }))
        if (jobs.length) await sb.from('platform_integration_jobs').insert(jobs)
        return json({ ok: true, mode: 'async', jobs_created: jobs.length })
      }

      // Sync mode: process sequentially with retry/backoff and fallback
      const results: any[] = []
      for (const cfg of configs || []) {
        const credsObj = cfg.credentials_encrypted ? await CredentialManager.decryptCredentials(cfg.credentials_encrypted) : null
        const creds = credsObj as PlatformCredentials | null
        const pconfig: PlatformConfig = { name: cfg.platform_type, endpoints: { base_url: cfg.configuration?.endpoints?.base_url || cfg.configuration?.base_url || '' } }
        const t = (cfg.platform_type || '').toLowerCase()

        const pickAdapter = (platformType: string, credentials: PlatformCredentials | null, config: PlatformConfig) => {
          if (platformType.includes('veeva')) return new VeevaAdapter(credentials as any, config)
          if (platformType.includes('sharepoint')) return new SharePointAdapter(credentials as any, config)
          return null
        }

        const tryPlatforms = [t, ...fallback_platforms.map((p) => p.toLowerCase())]
        let success = false
        let lastError: string | undefined
        for (const pt of tryPlatforms) {
          const adapter = pickAdapter(pt, creds, pconfig)
          if (!adapter) { lastError = 'Unsupported platform'; continue }
          try {
            if (creds) await adapter.authenticate(creds)
            const uploadReq: FileUploadRequest | null = file_data ? { file: file_data as any, metadata: compliance_data as ComplianceMetadata, project_id: (compliance_data as any)?.aicomplyr?.project_id } : null
            const start = Date.now()
            const res = uploadReq ? await adapter.uploadFile(uploadReq) : { success: true, metadata_only: true }
            const duration = Date.now() - start
            success = res.success !== false
            results.push({ platform: cfg.platform_type, result: res, success, duration_ms: duration })

            await sb.from('platform_integration_logs').insert({
              organization_id: org,
              platform_config_id: cfg.id,
              operation: uploadReq ? 'upload' : 'metadata',
              entity_type: 'file',
              entity_id: activity_id,
              status: success ? 'success' : 'error',
              request_data: { activity_id, target_platform: cfg.platform_type },
              response_data: res,
              duration_ms: duration,
            })

            // Update metrics
            await sb.from('platform_metrics').insert({
              organization_id: org,
              platform_config_id: cfg.id,
              metric_type: 'response_time_ms',
              metric_value: success ? duration : 0,
              metric_unit: 'ms',
            })
            break
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            lastError = msg
            await sb.from('platform_integration_logs').insert({
              organization_id: org,
              platform_config_id: cfg.id,
              operation: 'upload',
              entity_type: 'file',
              entity_id: activity_id,
              status: 'error',
              error_message: msg,
            })
            // exponential backoff before next try
            await new Promise(r => setTimeout(r, 500))
            continue
          }
        }

        if (!success) results.push({ platform: cfg.platform_type, success: false, error: lastError || 'Unknown error' })
      }

      return json({ ok: true, results })
    }
    
    // Job processor: processes queued platform integration jobs with retries/backoff
    if (req.method === 'POST' && url.pathname.endsWith('/process-jobs')) {
      const body = await req.json().catch(() => ({}))
      const { organization_id, limit = 5 } = body || {}
      const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

      // Select pending jobs ordered by priority and schedule
      let jq = sb
        .from('platform_integration_jobs')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: true })
        .order('scheduled_for', { ascending: true })
        .limit(limit)

      if (organization_id) jq = jq.eq('organization_id', organization_id)
      const { data: jobs, error: jobsErr } = await jq
      if (jobsErr) return json({ error: jobsErr.message }, 500)

      const results: any[] = []
      for (const job of jobs || []) {
        const jobId = job.id
        const startAt = new Date().toISOString()
        await sb.from('platform_integration_jobs').update({ status: 'processing', started_at: startAt }).eq('id', jobId)

        try {
          // Load platform configuration and credentials
          const { data: cfg, error: cfgErr } = await sb.from('platform_configurations').select('*').eq('id', job.platform_config_id).single()
          if (cfgErr || !cfg) throw new Error(cfgErr?.message || 'Missing platform configuration')

          const credsObj = cfg.credentials_encrypted ? await CredentialManager.decryptCredentials(cfg.credentials_encrypted) : null
          const creds = credsObj as PlatformCredentials | null
          const pconfig: PlatformConfig = { name: cfg.platform_type, endpoints: { base_url: cfg.configuration?.endpoints?.base_url || cfg.configuration?.base_url || '' } }
          const pt = (cfg.platform_type || '').toLowerCase()

          const pickAdapter = (platformType: string, credentials: PlatformCredentials | null, config: PlatformConfig) => {
            if (platformType.includes('veeva')) return new VeevaAdapter(credentials as any, config)
            if (platformType.includes('sharepoint')) return new SharePointAdapter(credentials as any, config)
            return null
          }

          const adapter = pickAdapter(pt, creds, pconfig)
          if (!adapter) throw new Error(`Unsupported platform: ${cfg.platform_type}`)
          if (creds) await adapter.authenticate(creds)

          const payload = job.payload || {}
          const activityId = payload.activity_id
          const fileData = payload.file_data
          const compData = payload.compliance_data as ComplianceMetadata | undefined
          const uploadReq: FileUploadRequest | null = fileData ? { file: fileData, metadata: compData as any, project_id: (compData as any)?.aicomplyr?.project_id } : null

          const t0 = Date.now()
          const res = uploadReq ? await adapter.uploadFile(uploadReq) : { success: true, metadata_only: true }
          const duration = Date.now() - t0

          // Log success
          await sb.from('platform_integration_logs').insert({
            organization_id: job.organization_id,
            platform_config_id: cfg.id,
            operation: uploadReq ? 'upload' : 'metadata',
            entity_type: 'file',
            entity_id: activityId,
            status: res.success ? 'success' : 'error',
            response_data: res,
            duration_ms: duration,
          })

          // Metrics
          await sb.from('platform_metrics').insert({
            organization_id: job.organization_id,
            platform_config_id: cfg.id,
            metric_type: 'response_time_ms',
            metric_value: res.success ? duration : 0,
            metric_unit: 'ms',
          })

          // Complete job
          await sb.from('platform_integration_jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', jobId)

          // Update activity status based on remaining jobs for this activity
          if (activityId) await reconcileActivityIntegrationStatus(sb, activityId)

          results.push({ job_id: jobId, success: true })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          const nextRetry = new Date(Date.now() + Math.pow(2, (job.retry_count || 0)) * 1000).toISOString()
          const willRetry = (job.retry_count || 0) + 1 < (job.max_retries || 3)

          await sb.from('platform_integration_logs').insert({
            organization_id: job.organization_id,
            platform_config_id: job.platform_config_id,
            operation: 'upload',
            entity_type: 'file',
            entity_id: job.payload?.activity_id,
            status: willRetry ? 'retrying' : 'error',
            error_message: msg,
          })

          if (willRetry) {
            await sb.from('platform_integration_jobs').update({
              status: 'pending',
              retry_count: (job.retry_count || 0) + 1,
              scheduled_for: nextRetry,
              updated_at: new Date().toISOString(),
            }).eq('id', jobId)
          } else {
            await sb.from('platform_integration_jobs').update({ status: 'failed', completed_at: new Date().toISOString(), error_message: msg }).eq('id', jobId)
            if (job.payload?.activity_id) await markActivityFailed(sb, job.payload.activity_id, msg)
          }

          results.push({ job_id: jobId, success: false, error: msg })
        }
      }

      return json({ ok: true, processed: (jobs || []).length, results })
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


async function reconcileActivityIntegrationStatus(sb: ReturnType<typeof createClient>, activityId: string) {
  // Determine if any jobs remain for this activity
  const { data: pending } = await sb
    .from('platform_integration_jobs')
    .select('id,status')
    .in('status', ['pending','processing'])
    .filter('payload->>activity_id', 'eq', activityId)

  const { data: failures } = await sb
    .from('platform_integration_jobs')
    .select('id,status')
    .eq('status', 'failed')
    .filter('payload->>activity_id', 'eq', activityId)

  if (pending && pending.length > 0) {
    await sb.from('agent_activities').update({ platform_integration_status: 'processing' }).eq('id', activityId)
    return
  }
  if (failures && failures.length > 0) {
    await sb.from('agent_activities').update({ platform_integration_status: 'failed' }).eq('id', activityId)
    return
  }
  await sb.from('agent_activities').update({ platform_integration_status: 'completed' }).eq('id', activityId)
}

async function markActivityFailed(sb: ReturnType<typeof createClient>, activityId: string, message: string) {
  await sb.from('agent_activities').update({
    platform_integration_status: 'failed',
    platform_integration_errors: [{ message, at: new Date().toISOString() }]
  }).eq('id', activityId)
}


