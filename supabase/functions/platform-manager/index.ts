// @ts-nocheck
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

      // Validate platform-specific configuration and field mappings
      const validation = validatePlatformConfiguration(payload.platform_type, payload.configuration, payload.field_mappings)
      if (!validation.valid) return json({ error: validation.error, details: validation.details }, 400)

      // Connectivity precheck prior to saving
      const baseUrlForTest = (payload.configuration?.endpoints?.base_url || payload.configuration?.base_url || payload.configuration?.api_base || null) as string | null
      const precheck = await testConnectivity(baseUrlForTest, payload.credentials as any)
      if (!precheck.connected) return json({ error: 'Connectivity check failed before save', details: precheck }, 400)

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

      // Audit log creation (without secrets)
      try {
        await createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
          .from('audit_logs_enhanced')
          .insert({
            organization_id: payload.organization_id,
            user_id: null,
            action: 'platform_config_created',
            entity_type: 'platform_configuration',
            entity_id: data.id,
            details: { platform_type: payload.platform_type, platform_name: payload.platform_name },
            risk_level: 'low',
          })
      } catch {}

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

      // Validate configuration if provided
      if (payload.configuration || payload.field_mappings) {
        // Load current to validate merged config
        const current = await CredentialManager.loadFromDb(id)
        const mergedConfig = { ...(current?.configuration || {}), ...(payload.configuration || {}) }
        const validation = validatePlatformConfiguration((current?.platform_type || payload.platform_type) as string, mergedConfig, payload.field_mappings || current?.field_mappings)
        if (!validation.valid) return json({ error: validation.error, details: validation.details }, 400)

        // Precheck connectivity when config or credentials are changing
        const credsForTest = (payload as any).credentials || (current?.credentials_encrypted ? await CredentialManager.decryptCredentials(current.credentials_encrypted) : undefined)
        const baseUrlForTest = (mergedConfig?.endpoints?.base_url || mergedConfig?.base_url || mergedConfig?.api_base || null) as string | null
        const precheck = await testConnectivity(baseUrlForTest, credsForTest as any)
        if (!precheck.connected) return json({ error: 'Connectivity check failed for update', details: precheck }, 400)
      }
      const { data, error } = await supabase
        .from('platform_configurations')
        .update(update)
        .eq('id', id)
        .eq('organization_id', org)
        .select('id')
        .single()
      if (error) return json({ error: error.message }, 500)

      // Audit log update
      try {
        await createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
          .from('audit_logs_enhanced')
          .insert({
            organization_id: org,
            user_id: null,
            action: 'platform_config_updated',
            entity_type: 'platform_configuration',
            entity_id: data.id,
            details: { id },
            risk_level: 'low',
          })
      } catch {}
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
      // Audit log: connection test
      try {
        await createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
          .from('audit_logs_enhanced')
          .insert({
            organization_id: org,
            user_id: null,
            action: 'platform_config_test_connection',
            entity_type: 'platform_configuration',
            entity_id: id,
            details: { connection_status: status.connected ? 'connected' : 'error', error: status.error },
            risk_level: status.connected ? 'low' : 'medium',
          })
      } catch {}
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

// Platform-specific configuration validation
function validatePlatformConfiguration(platformType: string, configuration: Record<string, unknown>, fieldMappings?: Record<string, unknown>): { valid: boolean; error?: string; details?: Record<string, unknown> } {
  const type = (platformType || '').toLowerCase()
  const errors: string[] = []

  // Common validation
  const baseUrl = (configuration as any)?.endpoints?.base_url || (configuration as any)?.base_url || (configuration as any)?.api_base
  if (!baseUrl || typeof baseUrl !== 'string') errors.push('Missing configuration.endpoints.base_url')

  // Field mapping sanity check
  if (fieldMappings && typeof fieldMappings !== 'object') errors.push('field_mappings must be an object')

  if (type.includes('veeva')) {
    if (!(configuration as any)?.api_version) {
      // Accept if nested under endpoints
      const ver = (configuration as any)?.endpoints?.api_version
      if (!ver) errors.push('Veeva requires api_version')
    }
  } else if (type.includes('sharepoint')) {
    const site = (configuration as any)?.site || (configuration as any)?.site_url
    if (!site) errors.push('SharePoint requires site or site_url')
  } else if (type.includes('adobe')) {
    const orgId = (configuration as any)?.organization_id || (configuration as any)?.adobe_org_id
    if (!orgId) errors.push('Adobe requires organization_id')
  }

  if (errors.length) return { valid: false, error: 'Invalid configuration', details: { errors } }
  return { valid: true }
}


