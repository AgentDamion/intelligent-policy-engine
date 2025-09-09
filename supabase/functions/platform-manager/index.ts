import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PlatformConfigurationInputSchema, PlatformConfigurationUpdateSchema } from "../shared/platform-config.ts"
import { CredentialManager } from "../shared/credential-manager.ts"
import { buildAuthHeaders } from "../shared/auth-headers.ts"
import { VeevaAdapter } from "../platform-veeva/adapter.ts"
import { SharePointAdapter } from "../platform-sharepoint/adapter.ts"
import { PlatformConfig } from "../shared/platform-adapter-base.ts"
import { PlatformCredentials } from "../shared/platform-adapter-types.ts"

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
        .select('*')
        .eq('organization_id', org)
        .order('created_at', { ascending: false })
      if (error) return json({ error: error.message }, 500)
      
      // Add credential status without exposing actual credentials
      const items = data.map(item => ({
        ...item,
        has_credentials: !!item.credentials_encrypted,
        credentials_encrypted: undefined // Never expose encrypted credentials
      }))
      
      return json({ items })
    }

    if (req.method === 'GET' && id) {
      const { data, error } = await supabase
        .from('platform_configurations')
        .select('*')
        .eq('id', id)
        .eq('organization_id', org)
        .single()
      if (error) return json({ error: error.message }, 404)
      
      // Add credential status without exposing actual credentials
      const result = {
        ...data,
        has_credentials: !!data.credentials_encrypted,
        credentials_encrypted: undefined // Never expose encrypted credentials
      }
      
      return json(result)
    }

    if (req.method === 'POST' && !id) {
      const body = await req.json()
      const payload = PlatformConfigurationInputSchema.parse({ ...body, organization_id: body.organization_id || org })
      
      // Validate platform-specific requirements
      const validationResult = validatePlatformConfiguration(payload)
      if (!validationResult.valid) {
        return json({ error: validationResult.error, details: validationResult.details }, 400)
      }
      
      // Test connection before saving
      if (payload.credentials && payload.configuration?.endpoints?.base_url) {
        const testResult = await testConnectivity(
          payload.platform_type,
          payload.configuration.endpoints.base_url,
          payload.credentials,
          payload.configuration
        )
        if (!testResult.connected) {
          return json({ 
            error: 'Connection test failed', 
            details: {
              test_error: testResult.error,
              test_details: testResult.details
            }
          }, 400)
        }
      }
      
      // Encrypt credentials using Vault
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
        connection_status: 'connected',
        last_connection_test: new Date().toISOString()
      }).select('*').single()
      
      if (error) return json({ error: error.message }, 500)
      
      // Log configuration creation
      await supabase.from('audit_logs_enhanced').insert({
        organization_id: payload.organization_id,
        action: 'platform_configuration_created',
        entity_type: 'platform_configuration',
        entity_id: data.id,
        details: {
          platform_type: payload.platform_type,
          platform_name: payload.platform_name
        },
        created_at: new Date().toISOString()
      })
      
      return json({ id: data.id, status: 'connected' })
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
      
      // Decrypt credentials with audit logging
      const creds = rec.credentials_encrypted
        ? await CredentialManager.decryptCredentials(rec.credentials_encrypted)
        : null
      
      // Log credential access for audit
      await supabase.from('audit_logs_enhanced').insert({
        organization_id: org,
        action: 'platform_credential_access',
        entity_type: 'platform_configuration',
        entity_id: id,
        details: {
          operation: 'test_connection',
          platform_type: rec.platform_type,
          platform_name: rec.platform_name
        },
        created_at: new Date().toISOString()
      })
      
      const baseUrl = rec?.configuration?.endpoints?.base_url || rec?.configuration?.base_url || rec?.configuration?.api_base || null
      const status = await testConnectivity(rec.platform_type, baseUrl, creds || undefined, rec.configuration)
      
      // Update connection status
      await supabase
        .from('platform_configurations')
        .update({ 
          last_connection_test: new Date().toISOString(), 
          connection_status: status.connected ? 'connected' : 'error', 
          error_message: status.error || null 
        })
        .eq('id', id)
      
      // Log test result
      await supabase.from('platform_integration_logs').insert({
        organization_id: org,
        platform_config_id: id,
        operation: 'test_connection',
        status: status.connected ? 'success' : 'error',
        response_data: status,
        error_message: status.error,
        created_at: new Date().toISOString()
      })
      
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

async function testConnectivity(
  platformType: string, 
  baseUrl: string | null, 
  creds?: Record<string, unknown>,
  configuration?: Record<string, any>
): Promise<{ connected: boolean; code?: number; error?: string; details?: any }> {
  if (!baseUrl) return { connected: false, error: 'Missing base_url' }
  
  try {
    // Create platform credentials object
    const platformCreds: PlatformCredentials = {
      platform: platformType,
      auth_type: detectAuthType(creds),
      credentials: creds || {},
      endpoints: {
        base_url: baseUrl,
        ...(configuration?.endpoints || {})
      }
    }

    // Create platform config
    const platformConfig: PlatformConfig = {
      name: platformType,
      endpoints: {
        base_url: baseUrl,
        ...(configuration?.endpoints || {})
      }
    }

    // Test with actual platform adapter
    const platformTypeLower = platformType.toLowerCase()
    let adapter: any
    
    if (platformTypeLower.includes('veeva')) {
      adapter = new VeevaAdapter(platformCreds, platformConfig)
    } else if (platformTypeLower.includes('sharepoint')) {
      adapter = new SharePointAdapter(platformCreds, platformConfig)
    } else {
      // Fallback to basic HTTP test
      const headers = creds ? buildAuthHeaders(platformCreds) : {}
      const res = await fetch(String(baseUrl), { method: 'GET', headers })
      return { 
        connected: res.ok || (res.status >= 200 && res.status < 500), 
        code: res.status,
        details: { method: 'basic_http_test' }
      }
    }

    // Authenticate and validate connection
    const authResult = await adapter.authenticate(platformCreds)
    if (!authResult.success) {
      return { 
        connected: false, 
        error: authResult.error?.message || 'Authentication failed',
        details: authResult.error
      }
    }

    const connectionStatus = await adapter.validateConnection()
    return { 
      connected: connectionStatus.connected, 
      error: connectionStatus.error,
      details: {
        latency: connectionStatus.latency,
        platform: platformType,
        capabilities: adapter.capabilities
      }
    }
  } catch (e) {
    return { 
      connected: false, 
      error: e instanceof Error ? e.message : String(e),
      details: { exception: true }
    }
  }
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

function validatePlatformConfiguration(config: any): { valid: boolean; error?: string; details?: any } {
  const platformType = config.platform_type?.toLowerCase() || ''
  
  // Common validations
  if (!config.configuration?.endpoints?.base_url) {
    return { valid: false, error: 'Missing base_url in configuration.endpoints' }
  }
  
  // Veeva-specific validations
  if (platformType.includes('veeva')) {
    if (!config.credentials?.username || !config.credentials?.password) {
      return { 
        valid: false, 
        error: 'Veeva requires username and password credentials',
        details: { required_fields: ['credentials.username', 'credentials.password'] }
      }
    }
    if (!config.configuration?.vault_id) {
      return { 
        valid: false, 
        error: 'Veeva requires vault_id in configuration',
        details: { required_fields: ['configuration.vault_id'] }
      }
    }
  }
  
  // SharePoint-specific validations
  else if (platformType.includes('sharepoint')) {
    if (!config.credentials?.client_id || !config.credentials?.client_secret) {
      return { 
        valid: false, 
        error: 'SharePoint requires OAuth2 credentials',
        details: { required_fields: ['credentials.client_id', 'credentials.client_secret'] }
      }
    }
    if (!config.configuration?.tenant_id || !config.configuration?.site_id) {
      return { 
        valid: false, 
        error: 'SharePoint requires tenant_id and site_id in configuration',
        details: { required_fields: ['configuration.tenant_id', 'configuration.site_id'] }
      }
    }
  }
  
  // Adobe-specific validations (for future)
  else if (platformType.includes('adobe')) {
    if (!config.credentials?.client_id || !config.credentials?.client_secret) {
      return { 
        valid: false, 
        error: 'Adobe Creative Cloud requires OAuth2 credentials',
        details: { required_fields: ['credentials.client_id', 'credentials.client_secret'] }
      }
    }
  }
  
  // Validate field mappings if provided
  if (config.field_mappings) {
    const requiredMappings = ['aicomplyr.project_id', 'compliance.status', 'compliance.score']
    const mappingKeys = Object.keys(config.field_mappings)
    const missing = requiredMappings.filter(req => !mappingKeys.some(key => key.includes(req)))
    if (missing.length > 0) {
      return {
        valid: false,
        error: 'Missing required field mappings',
        details: { missing_mappings: missing }
      }
    }
  }
  
  return { valid: true }
}


