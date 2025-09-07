import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PlatformConfigurationInputSchema, PlatformConfigurationUpdateSchema } from "../shared/platform-config.ts"
import { CredentialManager } from "../shared/credential-manager.ts"
import { buildAuthHeaders } from "../shared/auth-headers.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  try {
    const url = new URL(req.url)
    const path = url.pathname.replace(/\/$/, '')
    const [_, base, id, action] = path.split('/')
    if (base !== 'platform-manager') return json({ ok: true })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) return json({ error: 'Missing Supabase env' }, 500)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const org = headerOrg(req, url)
    if (!org) return json({ error: 'Missing organization_id (x-org-id or query)' }, 400)

    if (req.method === 'GET' && !id) {
      const { data, error } = await supabase
        .from('platform_configurations')
        .select('id, organization_id, platform_type, platform_name, configuration, field_mappings, webhook_config, status, last_connection_test, connection_status, created_at, updated_at')
        .eq('organization_id', org)
        .order('created_at', { ascending: false })
      if (error) return json({ error: error.message }, 500)
      return json({ items: data })
    }

    if (req.method === 'GET' && id) {
      const { data, error } = await supabase
        .from('platform_configurations')
        .select('id, organization_id, platform_type, platform_name, configuration, field_mappings, webhook_config, status, last_connection_test, connection_status, created_at, updated_at')
        .eq('id', id)
        .eq('organization_id', org)
        .single()
      if (error) return json({ error: error.message }, 404)
      return json(data)
    }

    if (req.method === 'POST' && !id) {
      const body = await req.json()
      const payload = PlatformConfigurationInputSchema.parse({ ...body, organization_id: body.organization_id || org })
      let credentials_encrypted: string | undefined
      if (payload.credentials) {
        credentials_encrypted = await CredentialManager.encryptCredentials(payload.credentials)
      }
      const { data, error } = await supabase.from('platform_configurations').insert({
        organization_id: payload.organization_id,
        platform_type: payload.platform_type,
        platform_name: payload.platform_name,
        configuration: payload.configuration,
        credentials_encrypted,
        field_mappings: payload.field_mappings || {},
        webhook_config: payload.webhook_config || {},
        status: payload.status || 'active',
      }).select('*').single()
      if (error) return json({ error: error.message }, 500)
      return json({ id: data.id })
    }

    if (req.method === 'PUT' && id) {
      const body = await req.json()
      const payload = PlatformConfigurationUpdateSchema.parse(body)
      const update: Record<string, unknown> = { ...payload }
      if ('credentials' in payload && payload.credentials) {
        update.credentials_encrypted = await CredentialManager.encryptCredentials(payload.credentials)
        delete (update as any).credentials
      }
      const { data, error } = await supabase
        .from('platform_configurations')
        .update(update)
        .eq('id', id)
        .eq('organization_id', org)
        .select('id')
        .single()
      if (error) return json({ error: error.message }, 500)
      return json({ id: data.id })
    }

    if (req.method === 'DELETE' && id) {
      const { error } = await supabase
        .from('platform_configurations')
        .delete()
        .eq('id', id)
        .eq('organization_id', org)
      if (error) return json({ error: error.message }, 500)
      return json({ deleted: true })
    }

    if (req.method === 'POST' && id && action === 'test') {
      const rec = await CredentialManager.loadFromDb(id)
      if (!rec || rec.organization_id !== org) return json({ error: 'Not found' }, 404)
      const creds = rec.credentials_encrypted
        ? await CredentialManager.decryptCredentials(rec.credentials_encrypted)
        : null
      const baseUrl = rec?.configuration?.endpoints?.base_url || rec?.configuration?.base_url || rec?.configuration?.api_base || null
      const status = await testConnectivity(baseUrl, creds || undefined)
      await createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
        .from('platform_configurations')
        .update({ last_connection_test: new Date().toISOString(), connection_status: status.connected ? 'connected' : 'error', error_message: status.error || null })
        .eq('id', id)
      return json(status)
    }

    return json({ error: 'Unsupported route' }, 404)
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors } })
}

function headerOrg(req: Request, url: URL): string | null {
  const h = req.headers
  return (
    h.get('x-org-id') ||
    h.get('x-organization-id') ||
    h.get('x-enterprise-id') ||
    url.searchParams.get('organization_id') ||
    url.searchParams.get('enterprise_id')
  )
}

async function testConnectivity(baseUrl: string | null, creds?: Record<string, unknown>): Promise<{ connected: boolean; code?: number; error?: string }> {
  if (!baseUrl) return { connected: false, error: 'Missing base_url' }
  try {
    const headers = creds ? buildAuthHeaders(creds as any) : {}
    const res = await fetch(String(baseUrl), { method: 'GET', headers })
    return { connected: res.ok || (res.status >= 200 && res.status < 500), code: res.status }
  } catch (e) {
    return { connected: false, error: e instanceof Error ? e.message : String(e) }
  }
}


