import { BasePlatformAdapter, PlatformConfig } from "../shared/platform-adapter-base.ts"
import {
  PlatformCapabilities,
  PlatformCredentials,
  AuthResult,
  FileUploadRequest,
  FileUploadResult,
  FileDownloadResult,
  FileListFilters,
  FileListResult,
  ComplianceMetadata,
  MetadataResult,
  ProjectConfig,
  ProjectResult,
  ProjectInfo,
  ConnectionStatus,
  PlatformError,
} from "../shared/platform-adapter-types.ts"
import { MetadataTransformer } from "../shared/metadata-transformer.ts"
import { buildAuthHeaders, mergeHeaders } from "../shared/auth-headers.ts"

export class AdobeAdapter extends BasePlatformAdapter {
  readonly platform = 'adobe'
  readonly version = '1.0.0'
  readonly capabilities: PlatformCapabilities = {
    supportsFileUpload: true,
    supportsMetadata: true,
    supportsWebhooks: false, // Adobe uses polling for now
    supportsProjects: true,
    supportsBatchOperations: true,
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    supportedFileTypes: [
      'image/vnd.adobe.photoshop', // PSD
      'application/illustrator', // AI
      'application/x-indesign', // INDD
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ],
    metadataFieldTypes: ['string', 'number', 'boolean', 'date', 'array', 'object'],
  }

  private accessToken?: string
  private refreshToken?: string
  private tokenExpiry?: Date

  constructor(credentials: PlatformCredentials, config: PlatformConfig) {
    super(credentials, config)
  }

  async authenticate(credentials: PlatformCredentials): Promise<AuthResult> {
    try {
      // Adobe uses OAuth2 with JWT for service accounts
      if (credentials.auth_type === 'oauth2' && credentials.credentials.client_id && credentials.credentials.client_secret) {
        const tokenResult = await this.exchangeJWTForToken(credentials)
        if (tokenResult.success) {
          this.accessToken = tokenResult.access_token
          this.refreshToken = tokenResult.refresh_token
          this.tokenExpiry = new Date(Date.now() + (tokenResult.expires_in || 3600) * 1000)
          
          // Update credentials with tokens
          this.credentials.credentials.access_token = this.accessToken
          this.credentials.credentials.refresh_token = this.refreshToken
          this.credentials.expires_at = this.tokenExpiry.toISOString()
          
          return { success: true, expires_at: this.tokenExpiry.toISOString() }
        }
        return { success: false, error: tokenResult.error }
      }
      
      // If already have access token, use it
      if (credentials.credentials.access_token) {
        this.accessToken = credentials.credentials.access_token
        this.refreshToken = credentials.credentials.refresh_token
        return { success: true }
      }
      
      return { 
        success: false, 
        error: this.createPlatformError('AUTH_FAILED', 'Invalid authentication credentials')
      }
    } catch (error) {
      return { 
        success: false, 
        error: this.createPlatformError('AUTH_ERROR', error instanceof Error ? error.message : 'Authentication failed')
      }
    }
  }

  async refreshAuth(): Promise<AuthResult> {
    if (!this.refreshToken) {
      return { success: false, error: this.createPlatformError('NO_REFRESH_TOKEN', 'No refresh token available') }
    }
    
    try {
      const response = await this.makeRequest<any>('POST', 'https://ims-na1.adobelogin.com/ims/token/v3', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.credentials.credentials.client_id || '',
          client_secret: this.credentials.credentials.client_secret || '',
          refresh_token: this.refreshToken,
        }).toString()
      })
      
      this.accessToken = response.access_token
      this.tokenExpiry = new Date(Date.now() + (response.expires_in || 3600) * 1000)
      
      return { success: true, expires_at: this.tokenExpiry.toISOString() }
    } catch (error) {
      return { 
        success: false, 
        error: this.createPlatformError('REFRESH_FAILED', 'Token refresh failed')
      }
    }
  }

  async uploadFile(request: FileUploadRequest): Promise<FileUploadResult> {
    await this.ensureAuthenticated()
    this.validateFileSize(request.file.size)
    this.validateFileType(request.file.mime_type)

    try {
      // Step 1: Create asset in Creative Cloud
      const createUrl = `${this.config.endpoints.base_url}/assets`
      const createResponse = await this.makeRequest<any>('POST', createUrl, {
        headers: mergeHeaders(
          this.getAuthHeaders(),
          { 'Content-Type': 'application/json' }
        ),
        body: JSON.stringify({
          name: request.file.name,
          type: this.mapMimeTypeToAdobeType(request.file.mime_type),
          size: request.file.size,
          folder: request.folder_path || '/',
        })
      })

      const assetId = createResponse.id

      // Step 2: Upload file content
      const uploadUrl = createResponse.upload_url || `${createUrl}/${assetId}/content`
      const contentBody = typeof request.file.content === 'string' 
        ? new TextEncoder().encode(request.file.content) 
        : request.file.content

      await this.makeRequest<any>('PUT', uploadUrl, {
        headers: mergeHeaders(
          this.getAuthHeaders(),
          { 'Content-Type': request.file.mime_type }
        ),
        body: contentBody
      })

      // Step 3: Embed XMP metadata
      if (request.metadata) {
        const xmpResult = await this.embedXMPMetadata(assetId, request.metadata)
        if (!xmpResult.success) {
          console.warn('Failed to embed XMP metadata:', xmpResult.error)
        }
      }

      await this.logOperation('file_upload', { 
        file_name: request.file.name,
        asset_id: assetId,
        size: request.file.size 
      })

      return {
        success: true,
        file_id: assetId,
        platform_file_id: assetId,
        file_url: `https://assets.adobe.com/assets/${assetId}`,
        metadata_attached: true
      }
    } catch (error) {
      const platformError = error instanceof Error 
        ? this.createPlatformError('UPLOAD_FAILED', error.message)
        : error as PlatformError
      
      return {
        success: false,
        file_id: '',
        platform_file_id: '',
        metadata_attached: false,
        error: platformError
      }
    }
  }

  async downloadFile(fileId: string): Promise<FileDownloadResult> {
    await this.ensureAuthenticated()
    
    try {
      const url = `${this.config.endpoints.base_url}/assets/${fileId}/content`
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      const content = new Uint8Array(await response.arrayBuffer())
      const mimeType = response.headers.get('content-type') || 'application/octet-stream'

      return {
        success: true,
        file_id: fileId,
        content,
        mime_type: mimeType
      }
    } catch (error) {
      return {
        success: false,
        file_id: fileId,
        error: this.createPlatformError('DOWNLOAD_FAILED', error instanceof Error ? error.message : 'Download failed')
      }
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    await this.ensureAuthenticated()
    
    try {
      await this.makeRequest<any>('DELETE', `${this.config.endpoints.base_url}/assets/${fileId}`, {
        headers: this.getAuthHeaders()
      })
      return true
    } catch (error) {
      console.error('Failed to delete file:', error)
      return false
    }
  }

  async listFiles(filters: FileListFilters): Promise<FileListResult> {
    await this.ensureAuthenticated()
    
    try {
      const params = new URLSearchParams()
      if (filters.folder_path) params.append('folder', filters.folder_path)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.cursor) params.append('cursor', filters.cursor)
      
      const url = `${this.config.endpoints.base_url}/assets?${params.toString()}`
      const response = await this.makeRequest<any>('GET', url, {
        headers: this.getAuthHeaders()
      })

      return {
        items: response.assets.map((asset: any) => ({
          file_id: asset.id,
          name: asset.name,
          size: asset.size || 0,
          mime_type: this.mapAdobeTypeToMimeType(asset.type),
          last_modified: asset.modified_at || asset.created_at
        })),
        next_cursor: response.next_cursor
      }
    } catch (error) {
      return { items: [] }
    }
  }

  async attachMetadata(fileId: string, metadata: ComplianceMetadata): Promise<MetadataResult> {
    await this.ensureAuthenticated()
    return this.embedXMPMetadata(fileId, metadata)
  }

  async getMetadata(fileId: string): Promise<ComplianceMetadata | null> {
    await this.ensureAuthenticated()
    
    try {
      const url = `${this.config.endpoints.base_url}/assets/${fileId}/xmp`
      const response = await this.makeRequest<any>('GET', url, {
        headers: this.getAuthHeaders()
      })

      // Parse XMP and extract AICOMPLYR metadata
      return this.parseXMPMetadata(response.xmp)
    } catch (error) {
      console.error('Failed to get metadata:', error)
      return null
    }
  }

  async updateMetadata(fileId: string, metadata: Partial<ComplianceMetadata>): Promise<MetadataResult> {
    // Get existing metadata and merge
    const existing = await this.getMetadata(fileId)
    const merged = existing ? { ...existing, ...metadata } : metadata as ComplianceMetadata
    return this.attachMetadata(fileId, merged)
  }

  async createProject(config: ProjectConfig): Promise<ProjectResult> {
    await this.ensureAuthenticated()
    
    try {
      const response = await this.makeRequest<any>('POST', `${this.config.endpoints.base_url}/folders`, {
        headers: mergeHeaders(this.getAuthHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          parent: config.parent_id || '/'
        })
      })

      return {
        success: true,
        project: {
          id: response.id,
          name: response.name,
          description: response.description,
          created_at: response.created_at
        }
      }
    } catch (error) {
      return {
        success: false,
        error: this.createPlatformError('PROJECT_CREATE_FAILED', 'Failed to create project')
      }
    }
  }

  async getProject(projectId: string): Promise<ProjectInfo | null> {
    await this.ensureAuthenticated()
    
    try {
      const response = await this.makeRequest<any>('GET', `${this.config.endpoints.base_url}/folders/${projectId}`, {
        headers: this.getAuthHeaders()
      })

      return {
        id: response.id,
        name: response.name,
        description: response.description,
        created_at: response.created_at
      }
    } catch (error) {
      return null
    }
  }

  async listProjects(filters?: any): Promise<any> {
    await this.ensureAuthenticated()
    
    try {
      const response = await this.makeRequest<any>('GET', `${this.config.endpoints.base_url}/folders`, {
        headers: this.getAuthHeaders()
      })

      return {
        items: response.folders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          description: folder.description,
          created_at: folder.created_at
        }))
      }
    } catch (error) {
      return { items: [] }
    }
  }

  // Helper methods
  private async exchangeJWTForToken(credentials: PlatformCredentials): Promise<any> {
    try {
      // Generate JWT for service account authentication
      const jwt = await this.generateServiceAccountJWT(credentials)
      
      const response = await this.makeRequest<any>('POST', 'https://ims-na1.adobelogin.com/ims/token/v3', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          client_id: credentials.credentials.client_id || '',
          client_secret: credentials.credentials.client_secret || '',
          jwt_token: jwt
        }).toString()
      })

      return {
        success: true,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_in: response.expires_in
      }
    } catch (error) {
      return {
        success: false,
        error: this.createPlatformError('JWT_EXCHANGE_FAILED', 'Failed to exchange JWT for token')
      }
    }
  }

  private async generateServiceAccountJWT(credentials: PlatformCredentials): Promise<string> {
    // In a real implementation, this would generate a proper JWT
    // For now, return a placeholder
    return 'jwt_placeholder'
  }

  private getAuthHeaders(): Record<string, string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'x-api-key': this.credentials.credentials.client_id || ''
    }
  }

  private async embedXMPMetadata(assetId: string, metadata: ComplianceMetadata): Promise<MetadataResult> {
    try {
      const xmpData = this.generateXMPPacket(metadata)
      
      await this.makeRequest<any>('PUT', `${this.config.endpoints.base_url}/assets/${assetId}/xmp`, {
        headers: mergeHeaders(
          this.getAuthHeaders(),
          { 'Content-Type': 'application/xml' }
        ),
        body: xmpData
      })

      return { success: true, file_id: assetId }
    } catch (error) {
      return {
        success: false,
        file_id: assetId,
        error: this.createPlatformError('XMP_EMBED_FAILED', 'Failed to embed XMP metadata')
      }
    }
  }

  private generateXMPPacket(metadata: ComplianceMetadata): string {
    // Generate XMP packet with AICOMPLYR namespace
    const aiTools = metadata.ai_tools.map(tool => `
        <rdf:li>
          <aicomplyr:AITool>
            <aicomplyr:toolName>${tool.tool_name}</aicomplyr:toolName>
            <aicomplyr:toolVersion>${tool.tool_version || 'unknown'}</aicomplyr:toolVersion>
            <aicomplyr:usageType>${tool.usage_type}</aicomplyr:usageType>
            <aicomplyr:approvalStatus>${tool.approval_status}</aicomplyr:approvalStatus>
            <aicomplyr:timestamp>${tool.usage_timestamp}</aicomplyr:timestamp>
          </aicomplyr:AITool>
        </rdf:li>`).join('')

    const violations = metadata.violations.map(v => `
        <rdf:li>
          <aicomplyr:Violation>
            <aicomplyr:violationId>${v.violation_id}</aicomplyr:violationId>
            <aicomplyr:violationType>${v.violation_type}</aicomplyr:violationType>
            <aicomplyr:severity>${v.severity}</aicomplyr:severity>
            <aicomplyr:description>${v.description}</aicomplyr:description>
            <aicomplyr:detectedAt>${v.detected_at}</aicomplyr:detectedAt>
          </aicomplyr:Violation>
        </rdf:li>`).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:aicomplyr="http://aicomplyr.io/xmp/1.0/"
      xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">
      
      <aicomplyr:version>${metadata.aicomplyr.version}</aicomplyr:version>
      <aicomplyr:generatedAt>${metadata.aicomplyr.generated_at}</aicomplyr:generatedAt>
      <aicomplyr:projectId>${metadata.aicomplyr.project_id}</aicomplyr:projectId>
      <aicomplyr:organizationId>${metadata.aicomplyr.organization_id}</aicomplyr:organizationId>
      <aicomplyr:activityId>${metadata.aicomplyr.activity_id || ''}</aicomplyr:activityId>
      
      <aicomplyr:complianceStatus>${metadata.compliance.status}</aicomplyr:complianceStatus>
      <aicomplyr:complianceScore>${metadata.compliance.score}</aicomplyr:complianceScore>
      <aicomplyr:riskLevel>${metadata.compliance.risk_level}</aicomplyr:riskLevel>
      <aicomplyr:lastChecked>${metadata.compliance.last_checked}</aicomplyr:lastChecked>
      
      <aicomplyr:aiTools>
        <rdf:Bag>${aiTools}
        </rdf:Bag>
      </aicomplyr:aiTools>
      
      <aicomplyr:violations>
        <rdf:Bag>${violations}
        </rdf:Bag>
      </aicomplyr:violations>
      
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`
  }

  private parseXMPMetadata(xmpData: string): ComplianceMetadata | null {
    // Parse XMP XML and extract AICOMPLYR metadata
    // This is a simplified implementation
    try {
      // Extract key values using regex (in production, use proper XML parser)
      const extractValue = (key: string): string => {
        const match = xmpData.match(new RegExp(`<aicomplyr:${key}>([^<]+)</aicomplyr:${key}>`))
        return match ? match[1] : ''
      }

      return {
        aicomplyr: {
          version: extractValue('version'),
          generated_at: extractValue('generatedAt'),
          project_id: extractValue('projectId'),
          organization_id: extractValue('organizationId'),
          activity_id: extractValue('activityId')
        },
        compliance: {
          status: extractValue('complianceStatus') as any,
          score: parseInt(extractValue('complianceScore')) || 0,
          risk_level: extractValue('riskLevel') as any,
          last_checked: extractValue('lastChecked')
        },
        ai_tools: [], // Would need proper parsing
        policy_checks: [],
        violations: [],
        references: {
          detailed_report_url: '',
          audit_trail_url: ''
        }
      }
    } catch (error) {
      console.error('Failed to parse XMP metadata:', error)
      return null
    }
  }

  private mapMimeTypeToAdobeType(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'image/vnd.adobe.photoshop': 'photoshop',
      'application/illustrator': 'illustrator',
      'application/x-indesign': 'indesign',
      'application/pdf': 'pdf',
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/tiff': 'image'
    }
    return typeMap[mimeType] || 'document'
  }

  private mapAdobeTypeToMimeType(adobeType: string): string {
    const typeMap: Record<string, string> = {
      'photoshop': 'image/vnd.adobe.photoshop',
      'illustrator': 'application/illustrator',
      'indesign': 'application/x-indesign',
      'pdf': 'application/pdf',
      'image': 'image/jpeg'
    }
    return typeMap[adobeType] || 'application/octet-stream'
  }
}