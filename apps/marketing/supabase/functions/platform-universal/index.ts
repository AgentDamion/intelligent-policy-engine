import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PlatformCredentials, FileUploadRequest, ComplianceMetadata } from "../shared/platform-adapter-types.ts"
import { CredentialManager } from "../shared/credential-manager.ts"
import { VeevaAdapter } from "../platform-veeva/adapter.ts"
import { SharePointAdapter } from "../platform-sharepoint/adapter.ts"
import { PlatformConfig } from "../shared/platform-adapter-base.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    if (req.method === 'POST' && url.pathname.endsWith('/integrate')) {
      const body = await req.json()
      const { activity_id, compliance_data, target_platforms, file_data, organization_id, enterprise_id } = body
      const org = organization_id || enterprise_id || req.headers.get('x-org-id') || req.headers.get('x-enterprise-id')
      if (!org) return json({ error: 'Missing organization_id' }, 400)

      const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      let q = sb.from('platform_configurations').select('*').eq('organization_id', org).eq('status','active')
      if (Array.isArray(target_platforms) && target_platforms.length) q = q.in('platform_type', target_platforms)
      const { data: configs, error } = await q
      if (error) return json({ error: error.message }, 500)

      const results: any[] = []
      for (const cfg of configs || []) {
        const credsObj = cfg.credentials_encrypted ? await CredentialManager.decryptCredentials(cfg.credentials_encrypted) : null
        const creds = credsObj as PlatformCredentials | null
        const pconfig: PlatformConfig = { name: cfg.platform_type, endpoints: { base_url: cfg.configuration?.endpoints?.base_url || cfg.configuration?.base_url || '' } }

        try {
          let adapter: any
          const t = (cfg.platform_type || '').toLowerCase()
          if (t.includes('veeva')) adapter = new VeevaAdapter(creds as any, pconfig)
          else if (t.includes('sharepoint')) adapter = new SharePointAdapter(creds as any, pconfig)
          else { results.push({ platform: cfg.platform_type, success: false, error: 'Unsupported platform' }); continue }
          if (creds) await adapter.authenticate(creds)

          const uploadReq: FileUploadRequest | null = file_data ? { file: file_data, metadata: compliance_data as ComplianceMetadata, project_id: compliance_data?.aicomplyr?.project_id } : null
          const res = uploadReq ? await adapter.uploadFile(uploadReq) : { success: true, metadata_only: true }
          results.push({ platform: cfg.platform_type, result: res, success: res.success !== false })

          await sb.from('platform_integration_logs').insert({
            organization_id: org,
            platform_config_id: cfg.id,
            operation: uploadReq ? 'upload' : 'metadata',
            entity_type: 'file',
            entity_id: activity_id,
            status: res.success ? 'success' : 'error',
            request_data: { activity_id, target_platform: cfg.platform_type },
            response_data: res,
          })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          results.push({ platform: cfg.platform_type, success: false, error: msg })
          await sb.from('platform_integration_logs').insert({
            organization_id: org,
            platform_config_id: cfg.id,
            operation: 'upload',
            entity_type: 'file',
            entity_id: activity_id,
            status: 'error',
            error_message: msg,
          })
        }
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


