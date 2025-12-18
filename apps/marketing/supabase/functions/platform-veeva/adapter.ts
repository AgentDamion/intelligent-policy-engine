import { BasePlatformAdapter, PlatformConfig } from "../shared/platform-adapter-base.ts"
import {
  PlatformCapabilities,
  PlatformCredentials,
  AuthResult,
  FileUploadRequest,
  FileUploadResult,
  ComplianceMetadata,
  MetadataResult,
} from "../shared/platform-adapter-types.ts"
import { MetadataTransformer } from "../shared/metadata-transformer.ts"
import { buildAuthHeaders, mergeHeaders } from "../shared/auth-headers.ts"

export class VeevaAdapter extends BasePlatformAdapter {
  readonly platform = 'veeva'
  readonly version = '0.1.0'
  readonly capabilities: PlatformCapabilities = {
    supportsFileUpload: true,
    supportsMetadata: true,
    supportsWebhooks: true,
    supportsProjects: true,
    supportsBatchOperations: false,
    maxFileSize: 200 * 1024 * 1024,
    supportedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    metadataFieldTypes: ['string','number','boolean','date','enum','object'],
  }

  constructor(credentials: PlatformCredentials, config: PlatformConfig) {
    super(credentials, config)
  }

  async authenticate(credentials: PlatformCredentials): Promise<AuthResult> {
    // For now, assume token-based/session-based credentials are supplied
    this.credentials = credentials
    return { success: true, expires_at: credentials.expires_at }
  }

  async uploadFile(request: FileUploadRequest): Promise<FileUploadResult> {
    await this.ensureAuthenticated()
    this.validateFileSize(request.file.size)
    this.validateFileType(request.file.mime_type)

    // 1) Create document (stubbed)
    const createUrl = `${this.config.endpoints.base_url}/api/documents`
    const createRes = await this.makeRequest<any>('POST', createUrl, {
      headers: mergeHeaders(buildAuthHeaders(this.credentials), { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: request.file.name,
        mimeType: request.file.mime_type,
        projectId: request.project_id,
      }),
    })

    const platformFileId = createRes.id || createRes.documentId || 'doc_temp_id'

    // 2) Attach binary (stubbed)
    const uploadUrl = `${this.config.endpoints.base_url}/api/documents/${platformFileId}/content`
    const contentBody = typeof request.file.content === 'string' ? new TextEncoder().encode(request.file.content) : request.file.content
    await this.makeRequest<any>('PUT', uploadUrl, {
      headers: mergeHeaders(buildAuthHeaders(this.credentials), { 'Content-Type': request.file.mime_type }),
      body: contentBody,
    })

    // 3) Transform and attach metadata
    const transformed = MetadataTransformer.toVeeva(request.metadata)
    if (transformed.success) {
      await this.attachMetadata(platformFileId, request.metadata)
    }

    return {
      success: true,
      file_id: platformFileId,
      platform_file_id: platformFileId,
      metadata_attached: transformed.success,
    }
  }

  async attachMetadata(fileId: string, metadata: ComplianceMetadata): Promise<MetadataResult> {
    await this.ensureAuthenticated()
    const transformed = MetadataTransformer.toVeeva(metadata)
    if (!transformed.success) return { success: false, file_id: fileId, }

    const url = `${this.config.endpoints.base_url}/api/documents/${fileId}/metadata`
    await this.makeRequest('PUT', url, {
      headers: mergeHeaders(buildAuthHeaders(this.credentials), { 'Content-Type': 'application/json' }),
      body: JSON.stringify(transformed.data),
    })
    return { success: true, file_id: fileId }
  }
}


