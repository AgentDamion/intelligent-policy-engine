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


