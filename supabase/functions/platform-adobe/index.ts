import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AdobeAdapter } from './adapter.ts'
import { PlatformCredentials, FileUploadRequest, ComplianceMetadata } from "../shared/platform-adapter-types.ts"
import { CredentialManager } from "../shared/credential-manager.ts"
import { PlatformConfig } from "../shared/platform-adapter-base.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-org-id, x-enterprise-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // GET /platform-adobe/health - Health check
    if (req.method === 'GET' && url.pathname.endsWith('/health')) {
      const health = await checkAdobeHealth()
      return json({ ok: true, health })
    }

    // POST /platform-adobe/upload - Upload file with compliance metadata
    if (req.method === 'POST' && url.pathname.endsWith('/upload')) {
      const body = await req.json()
      const { file_data, compliance_data, project_id, organization_id } = body
      
      if (!file_data || !compliance_data) {
        return json({ error: 'Missing file_data or compliance_data' }, 400)
      }

      const org = organization_id || req.headers.get('x-org-id') || req.headers.get('x-enterprise-id')
      if (!org) return json({ error: 'Missing organization_id' }, 400)

      // Get Adobe configuration for organization
      const { data: config, error } = await sb
        .from('platform_configurations')
        .select('*')
        .eq('organization_id', org)
        .eq('platform_type', 'adobe')
        .eq('status', 'active')
        .single()

      if (error || !config) {
        return json({ error: 'Adobe configuration not found' }, 404)
      }

      // Decrypt credentials
      const creds = config.credentials_encrypted 
        ? await CredentialManager.decryptCredentials(config.credentials_encrypted)
        : null

      if (!creds) {
        return json({ error: 'Adobe credentials not found' }, 400)
      }

      // Create adapter and upload
      const pconfig: PlatformConfig = {
        name: 'adobe',
        endpoints: {
          base_url: config.configuration?.endpoints?.base_url || config.configuration?.base_url || ''
        }
      }

      const adapter = new AdobeAdapter(creds as PlatformCredentials, pconfig)
      await adapter.authenticate(creds as PlatformCredentials)

      const uploadRequest: FileUploadRequest = {
        file: {
          name: file_data.name,
          content: new TextEncoder().encode(file_data.content),
          mime_type: file_data.mime_type,
          size: file_data.size
        },
        metadata: compliance_data as ComplianceMetadata,
        project_id: project_id || compliance_data?.aicomplyr?.project_id
      }

      const result = await adapter.uploadFile(uploadRequest)

      // Log integration attempt
      await sb.from('platform_integration_logs').insert({
        organization_id: org,
        platform_config_id: config.id,
        operation: 'upload',
        entity_type: 'file',
        entity_id: compliance_data?.aicomplyr?.activity_id || 'unknown',
        status: result.success ? 'success' : 'error',
        request_data: { file_name: file_data.name, project_id },
        response_data: result,
        created_at: new Date().toISOString()
      })

      return json({ ok: true, result })
    }

    // POST /platform-adobe/metadata - Attach metadata to existing file
    if (req.method === 'POST' && url.pathname.endsWith('/metadata')) {
      const body = await req.json()
      const { file_id, compliance_data, organization_id } = body
      
      if (!file_id || !compliance_data) {
        return json({ error: 'Missing file_id or compliance_data' }, 400)
      }

      const org = organization_id || req.headers.get('x-org-id') || req.headers.get('x-enterprise-id')
      if (!org) return json({ error: 'Missing organization_id' }, 400)

      // Get Adobe configuration
      const { data: config, error } = await sb
        .from('platform_configurations')
        .select('*')
        .eq('organization_id', org)
        .eq('platform_type', 'adobe')
        .eq('status', 'active')
        .single()

      if (error || !config) {
        return json({ error: 'Adobe configuration not found' }, 404)
      }

      const creds = config.credentials_encrypted 
        ? await CredentialManager.decryptCredentials(config.credentials_encrypted)
        : null

      if (!creds) {
        return json({ error: 'Adobe credentials not found' }, 400)
      }

      const pconfig: PlatformConfig = {
        name: 'adobe',
        endpoints: {
          base_url: config.configuration?.endpoints?.base_url || config.configuration?.base_url || ''
        }
      }

      const adapter = new AdobeAdapter(creds as PlatformCredentials, pconfig)
      await adapter.authenticate(creds as PlatformCredentials)

      const result = await adapter.attachMetadata(file_id, compliance_data as ComplianceMetadata)

      // Log metadata attachment
      await sb.from('platform_integration_logs').insert({
        organization_id: org,
        platform_config_id: config.id,
        operation: 'metadata',
        entity_type: 'file',
        entity_id: file_id,
        status: result.success ? 'success' : 'error',
        request_data: { file_id, compliance_data },
        response_data: result,
        created_at: new Date().toISOString()
      })

      return json({ ok: true, result })
    }

    // GET /platform-adobe/files - List files
    if (req.method === 'GET' && url.pathname.endsWith('/files')) {
      const org = req.headers.get('x-org-id') || req.headers.get('x-enterprise-id')
      if (!org) return json({ error: 'Missing organization_id' }, 400)

      const projectId = url.searchParams.get('project_id')
      const limit = url.searchParams.get('limit')
      const cursor = url.searchParams.get('cursor')

      // Get Adobe configuration
      const { data: config, error } = await sb
        .from('platform_configurations')
        .select('*')
        .eq('organization_id', org)
        .eq('platform_type', 'adobe')
        .eq('status', 'active')
        .single()

      if (error || !config) {
        return json({ error: 'Adobe configuration not found' }, 404)
      }

      const creds = config.credentials_encrypted 
        ? await CredentialManager.decryptCredentials(config.credentials_encrypted)
        : null

      if (!creds) {
        return json({ error: 'Adobe credentials not found' }, 400)
      }

      const pconfig: PlatformConfig = {
        name: 'adobe',
        endpoints: {
          base_url: config.configuration?.endpoints?.base_url || config.configuration?.base_url || ''
        }
      }

      const adapter = new AdobeAdapter(creds as PlatformCredentials, pconfig)
      await adapter.authenticate(creds as PlatformCredentials)

      const result = await adapter.listFiles({
        project_id: projectId || undefined,
        limit: limit ? parseInt(limit) : undefined,
        cursor: cursor || undefined
      })

      return json({ ok: true, result })
    }

    // GET /platform-adobe/projects - List projects
    if (req.method === 'GET' && url.pathname.endsWith('/projects')) {
      const org = req.headers.get('x-org-id') || req.headers.get('x-enterprise-id')
      if (!org) return json({ error: 'Missing organization_id' }, 400)

      const nameContains = url.searchParams.get('name_contains')
      const limit = url.searchParams.get('limit')
      const cursor = url.searchParams.get('cursor')

      // Get Adobe configuration
      const { data: config, error } = await sb
        .from('platform_configurations')
        .select('*')
        .eq('organization_id', org)
        .eq('platform_type', 'adobe')
        .eq('status', 'active')
        .single()

      if (error || !config) {
        return json({ error: 'Adobe configuration not found' }, 404)
      }

      const creds = config.credentials_encrypted 
        ? await CredentialManager.decryptCredentials(config.credentials_encrypted)
        : null

      if (!creds) {
        return json({ error: 'Adobe credentials not found' }, 400)
      }

      const pconfig: PlatformConfig = {
        name: 'adobe',
        endpoints: {
          base_url: config.configuration?.endpoints?.base_url || config.configuration?.base_url || ''
        }
      }

      const adapter = new AdobeAdapter(creds as PlatformCredentials, pconfig)
      await adapter.authenticate(creds as PlatformCredentials)

      const result = await adapter.listProjects({
        name_contains: nameContains || undefined,
        limit: limit ? parseInt(limit) : undefined,
        cursor: cursor || undefined
      })

      return json({ ok: true, result })
    }

    return json({ ok: true, message: 'Adobe Platform API alive' })

  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
}

async function checkAdobeHealth() {
  try {
    // Check Adobe API connectivity
    const response = await fetch('https://api.adobe.io/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ADOBE_ACCESS_TOKEN') || 'test'}`,
        'X-API-Key': Deno.env.get('ADOBE_CLIENT_ID') || 'test'
      }
    })

    return {
      status: response.ok ? 'healthy' : 'degraded',
      adobe_api: response.ok ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    }

  } catch (e) {
    return {
      status: 'unhealthy',
      adobe_api: 'disconnected',
      error: e instanceof Error ? e.message : String(e),
      timestamp: new Date().toISOString()
    }
  }
}