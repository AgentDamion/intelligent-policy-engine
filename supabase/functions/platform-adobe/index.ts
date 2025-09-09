import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"
import { AdobeAdapter } from "./adapter.ts"
import { PlatformCredentials, FileUploadRequest, ComplianceMetadata } from "../shared/platform-adapter-types.ts"
import { CredentialManager } from "../shared/credential-manager.ts"
import { PlatformConfig } from "../shared/platform-adapter-base.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-org-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Request schemas
const FileUploadSchema = z.object({
  file: z.object({
    name: z.string(),
    content: z.string(), // base64 encoded
    mime_type: z.string(),
    size: z.number()
  }),
  metadata: z.record(z.any()),
  project_id: z.string().optional(),
  folder_path: z.string().optional()
})

const MetadataUpdateSchema = z.object({
  file_id: z.string(),
  metadata: z.record(z.any())
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace(/^\/platform-adobe/, '')
    
    // Health check
    if (req.method === 'GET' && path === '/health') {
      return json({ 
        status: 'healthy',
        platform: 'adobe',
        version: '1.0.0',
        capabilities: {
          xmp_metadata: true,
          creative_cloud_sync: true,
          batch_operations: true
        }
      })
    }

    // Get organization ID
    const org = req.headers.get('x-org-id') || 
                req.headers.get('x-organization-id') ||
                url.searchParams.get('organization_id')
    
    if (!org) {
      return json({ error: 'Missing organization_id' }, 400)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      return json({ error: 'Missing Supabase configuration' }, 500)
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Adobe platform configuration
    const { data: configs, error: configError } = await supabase
      .from('platform_configurations')
      .select('*')
      .eq('organization_id', org)
      .eq('status', 'active')
      .ilike('platform_type', '%adobe%')
      .limit(1)
      .single()

    if (configError || !configs) {
      return json({ error: 'Adobe platform not configured for this organization' }, 404)
    }

    // Decrypt credentials
    const credentials = configs.credentials_encrypted
      ? await CredentialManager.decryptCredentials(configs.credentials_encrypted)
      : null

    if (!credentials) {
      return json({ error: 'No credentials found for Adobe platform' }, 500)
    }

    // Create platform credentials object
    const platformCreds: PlatformCredentials = {
      platform: 'adobe',
      auth_type: detectAuthType(credentials),
      credentials: credentials,
      endpoints: {
        base_url: configs.configuration?.endpoints?.base_url || 'https://cc-api-storage.adobe.io',
        ...(configs.configuration?.endpoints || {})
      }
    }

    // Create platform config
    const platformConfig: PlatformConfig = {
      name: 'adobe',
      displayName: configs.platform_name,
      endpoints: platformCreds.endpoints
    }

    // Initialize Adobe adapter
    const adapter = new AdobeAdapter(platformCreds, platformConfig)

    // Authenticate
    const authResult = await adapter.authenticate(platformCreds)
    if (!authResult.success) {
      return json({ error: 'Adobe authentication failed', details: authResult.error }, 401)
    }

    // Route handlers
    if (req.method === 'POST' && path === '/upload') {
      const body = await req.json()
      const validatedData = FileUploadSchema.parse(body)
      
      // Convert base64 to Uint8Array
      const fileContent = Uint8Array.from(atob(validatedData.file.content), c => c.charCodeAt(0))
      
      // Build compliance metadata
      const metadata = buildComplianceMetadata(validatedData.metadata, org)
      
      // Create upload request
      const uploadRequest: FileUploadRequest = {
        file: {
          name: validatedData.file.name,
          content: fileContent,
          mime_type: validatedData.file.mime_type,
          size: validatedData.file.size
        },
        metadata: metadata,
        project_id: validatedData.project_id,
        folder_path: validatedData.folder_path
      }
      
      // Upload file
      const result = await adapter.uploadFile(uploadRequest)
      
      // Log operation
      await supabase.from('platform_integration_logs').insert({
        organization_id: org,
        platform_config_id: configs.id,
        operation: 'file_upload',
        entity_type: 'file',
        entity_id: validatedData.file.name,
        platform_entity_id: result.platform_file_id,
        status: result.success ? 'success' : 'error',
        request_data: { file_name: validatedData.file.name, has_metadata: true },
        response_data: result,
        error_message: result.error?.message,
        created_at: new Date().toISOString()
      })
      
      return json(result)
    }
    
    if (req.method === 'PUT' && path === '/metadata') {
      const body = await req.json()
      const validatedData = MetadataUpdateSchema.parse(body)
      
      // Build compliance metadata
      const metadata = buildComplianceMetadata(validatedData.metadata, org)
      
      // Update metadata
      const result = await adapter.updateMetadata(validatedData.file_id, metadata)
      
      // Log operation
      await supabase.from('platform_integration_logs').insert({
        organization_id: org,
        platform_config_id: configs.id,
        operation: 'metadata_update',
        entity_type: 'file',
        entity_id: validatedData.file_id,
        platform_entity_id: validatedData.file_id,
        status: result.success ? 'success' : 'error',
        request_data: { file_id: validatedData.file_id },
        response_data: result,
        error_message: result.error?.message,
        created_at: new Date().toISOString()
      })
      
      return json(result)
    }
    
    if (req.method === 'GET' && path.startsWith('/files/')) {
      const fileId = path.split('/')[2]
      if (!fileId) {
        return json({ error: 'Missing file ID' }, 400)
      }
      
      if (path.endsWith('/metadata')) {
        // Get metadata
        const metadata = await adapter.getMetadata(fileId)
        return json({ success: true, metadata })
      } else {
        // Download file
        const result = await adapter.downloadFile(fileId)
        if (result.success && result.content) {
          return new Response(result.content, {
            headers: {
              'Content-Type': result.mime_type || 'application/octet-stream',
              ...corsHeaders
            }
          })
        }
        return json(result, result.success ? 200 : 500)
      }
    }
    
    if (req.method === 'GET' && path === '/files') {
      // List files
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const cursor = url.searchParams.get('cursor') || undefined
      const folder = url.searchParams.get('folder') || undefined
      
      const result = await adapter.listFiles({
        limit,
        cursor,
        folder_path: folder
      })
      
      return json(result)
    }
    
    if (req.method === 'POST' && path === '/projects') {
      const body = await req.json()
      const result = await adapter.createProject({
        name: body.name,
        description: body.description,
        parent_id: body.parent_id
      })
      
      return json(result)
    }
    
    if (req.method === 'GET' && path === '/projects') {
      const result = await adapter.listProjects()
      return json(result)
    }

    return json({ error: 'Not found' }, 404)

  } catch (error) {
    console.error('Error in platform-adobe:', error)
    return json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error instanceof z.ZodError ? error.errors : undefined
    }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  })
}

function detectAuthType(creds?: Record<string, unknown>): PlatformCredentials['auth_type'] {
  if (!creds) return 'oauth2'
  if (creds.access_token || creds.client_id) return 'oauth2'
  if (creds.api_key) return 'api_key'
  return 'oauth2'
}

function buildComplianceMetadata(data: any, orgId: string): ComplianceMetadata {
  // If already in correct format, return as is
  if (data.aicomplyr && data.compliance) {
    return data as ComplianceMetadata
  }
  
  // Otherwise build from provided data
  return {
    aicomplyr: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      project_id: data.project_id || '',
      organization_id: orgId,
      activity_id: data.activity_id
    },
    compliance: {
      status: data.compliance_status || 'compliant',
      score: data.compliance_score || 100,
      risk_level: data.risk_level || 'low',
      last_checked: data.last_checked || new Date().toISOString()
    },
    ai_tools: data.ai_tools || [],
    policy_checks: data.policy_checks || [],
    violations: data.violations || [],
    references: {
      detailed_report_url: data.report_url || '',
      audit_trail_url: data.audit_url || ''
    }
  }
}