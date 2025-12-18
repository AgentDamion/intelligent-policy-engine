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

export class SharePointAdapter extends BasePlatformAdapter {
  readonly platform = 'sharepoint'
  readonly version = '0.1.0'
  readonly capabilities: PlatformCapabilities = {
    supportsFileUpload: true,
    supportsMetadata: true,
    supportsWebhooks: true,
    supportsProjects: true,
    supportsBatchOperations: false,
    maxFileSize: 250 * 1024 * 1024,
    supportedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    metadataFieldTypes: ['string','number','boolean','date','enum','object'],
  }

  constructor(credentials: PlatformCredentials, config: PlatformConfig) {
    super(credentials, config)
  }

  async authenticate(credentials: PlatformCredentials): Promise<AuthResult> {
    this.credentials = credentials
    return { success: true, expires_at: credentials.expires_at }
  }

  async uploadFile(request: FileUploadRequest): Promise<FileUploadResult> {
    await this.ensureAuthenticated()
    this.validateFileSize(request.file.size)
    this.validateFileType(request.file.mime_type)

    // Example: upload to SharePoint drive root (stub)
    const createUrl = `${this.config.endpoints.base_url}/_api/web/GetFolderByServerRelativeUrl('/Shared Documents')/Files/add(url='${encodeURIComponent(request.file.name)}',overwrite=${request.overwrite ? 'true' : 'false'})`
    const contentBody = typeof request.file.content === 'string' ? new TextEncoder().encode(request.file.content) : request.file.content
    const createRes = await this.makeRequest<any>('POST', createUrl, {
      headers: mergeHeaders(buildAuthHeaders(this.credentials), { 'Content-Type': request.file.mime_type }),
      body: contentBody,
    })

    const platformFileId = createRes?.d?.UniqueId || 'sp_temp_id'

    const transformed = MetadataTransformer.toSharePoint(request.metadata)
    if (transformed.success) {
      await this.attachMetadata(platformFileId, request.metadata)
    }

    return { success: true, file_id: platformFileId, platform_file_id: platformFileId, metadata_attached: transformed.success }
  }

  async attachMetadata(fileId: string, metadata: ComplianceMetadata): Promise<MetadataResult> {
    await this.ensureAuthenticated()
    const transformed = MetadataTransformer.toSharePoint(metadata)
    if (!transformed.success) return { success: false, file_id: fileId }

    const url = `${this.config.endpoints.base_url}/_api/web/lists/getbytitle('Documents')/items('${fileId}')`
    await this.makeRequest('PATCH', url, {
      headers: mergeHeaders(buildAuthHeaders(this.credentials), { 'Content-Type': 'application/json;odata=verbose' }),
      body: JSON.stringify(transformed.data),
    })
    return { success: true, file_id: fileId }
  }
}


