import { BasePlatformAdapter } from '../shared/platform-adapter-base.ts'
import {
  PlatformCredentials,
  PlatformCapabilities,
  AuthResult,
  FileUploadRequest,
  FileUploadResult,
  FileDownloadResult,
  FileListResult,
  FileListFilters,
  ComplianceMetadata,
  MetadataResult,
  ConnectionStatus,
  HealthStatus,
  PlatformError,
  ProjectConfig,
  ProjectResult,
  ProjectInfo,
  ProjectFilters,
  ProjectListResult
} from '../shared/platform-adapter-types.ts'

export class AdobeAdapter extends BasePlatformAdapter {
  readonly platform = 'adobe'
  readonly version = '1.0.0'
  readonly capabilities: PlatformCapabilities = {
    supportsFileUpload: true,
    supportsMetadata: true,
    supportsWebhooks: false,
    supportsProjects: true,
    supportsBatchOperations: false,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/psd',
      'image/ai',
      'image/indd',
      'application/pdf',
      'application/illustrator',
      'application/indesign'
    ],
    metadataFieldTypes: ['string', 'number', 'boolean', 'date', 'object']
  }

  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiresAt: Date | null = null

  async authenticate(credentials: PlatformCredentials): Promise<AuthResult> {
    try {
      if (credentials.auth_type !== 'oauth2') {
        throw this.createPlatformError('INVALID_AUTH_TYPE', 'Adobe requires OAuth2 authentication')
      }

      const { client_id, client_secret, access_token, refresh_token } = credentials.credentials
      
      if (!client_id || !client_secret) {
        throw this.createPlatformError('MISSING_CREDENTIALS', 'Missing client_id or client_secret')
      }

      // If we have an access token, validate it
      if (access_token) {
        const isValid = await this.validateAccessToken(access_token)
        if (isValid) {
          this.accessToken = access_token
          this.refreshToken = refresh_token || null
          this.tokenExpiresAt = credentials.expires_at ? new Date(credentials.expires_at) : null
          return { success: true, expires_at: credentials.expires_at }
        }
      }

      // If no valid token, try to refresh or get new token
      if (refresh_token) {
        const refreshResult = await this.refreshAccessToken(client_id, client_secret, refresh_token)
        if (refreshResult.success) {
          return refreshResult
        }
      }

      // If no refresh token or refresh failed, need new authorization
      throw this.createPlatformError('AUTH_REQUIRED', 'New OAuth2 authorization required')

    } catch (e) {
      return {
        success: false,
        error: e instanceof PlatformError ? e : this.createPlatformError('AUTH_FAILED', e instanceof Error ? e.message : String(e))
      }
    }
  }

  async refreshAuth(): Promise<AuthResult> {
    if (!this.refreshToken) {
      throw this.createPlatformError('NO_REFRESH_TOKEN', 'No refresh token available')
    }

    const { client_id, client_secret } = this.credentials.credentials
    if (!client_id || !client_secret) {
      throw this.createPlatformError('MISSING_CREDENTIALS', 'Missing client credentials for refresh')
    }

    return await this.refreshAccessToken(client_id, client_secret, this.refreshToken)
  }

  async uploadFile(request: FileUploadRequest): Promise<FileUploadResult> {
    try {
      await this.ensureAuthenticated()
      this.validateFileSize(request.file.size)
      this.validateFileType(request.file.mime_type)

      // Upload file to Adobe Creative Cloud
      const uploadResult = await this.uploadToCreativeCloud(request)
      
      // Embed XMP metadata
      if (uploadResult.success && request.metadata) {
        await this.embedXMPMetadata(uploadResult.platform_file_id, request.metadata)
      }

      return {
        success: true,
        file_id: uploadResult.file_id,
        platform_file_id: uploadResult.platform_file_id,
        file_url: uploadResult.file_url,
        metadata_attached: !!request.metadata
      }

    } catch (e) {
      return {
        success: false,
        file_id: '',
        platform_file_id: '',
        error: e instanceof PlatformError ? e : this.createPlatformError('UPLOAD_FAILED', e instanceof Error ? e.message : String(e))
      }
    }
  }

  async downloadFile(fileId: string): Promise<FileDownloadResult> {
    try {
      await this.ensureAuthenticated()
      
      const response = await this.makeRequest<any>('GET', `${this.config.endpoints.base_url}/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/octet-stream'
        }
      })

      return {
        success: true,
        file_id: fileId,
        content: response.content,
        mime_type: response.mime_type
      }

    } catch (e) {
      return {
        success: false,
        file_id: fileId,
        error: e instanceof PlatformError ? e : this.createPlatformError('DOWNLOAD_FAILED', e instanceof Error ? e.message : String(e))
      }
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await this.ensureAuthenticated()
      
      await this.makeRequest('DELETE', `${this.config.endpoints.base_url}/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return true

    } catch (e) {
      console.error('Failed to delete file:', e)
      return false
    }
  }

  async listFiles(filters: FileListFilters): Promise<FileListResult> {
    try {
      await this.ensureAuthenticated()
      
      const params = new URLSearchParams()
      if (filters.project_id) params.append('project_id', filters.project_id)
      if (filters.folder_path) params.append('folder_path', filters.folder_path)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.cursor) params.append('cursor', filters.cursor)

      const response = await this.makeRequest<any>('GET', `${this.config.endpoints.base_url}/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return {
        items: response.items.map((item: any) => ({
          file_id: item.id,
          name: item.name,
          size: item.size,
          mime_type: item.mime_type,
          last_modified: item.last_modified
        })),
        next_cursor: response.next_cursor
      }

    } catch (e) {
      throw e instanceof PlatformError ? e : this.createPlatformError('LIST_FAILED', e instanceof Error ? e.message : String(e))
    }
  }

  async attachMetadata(fileId: string, metadata: ComplianceMetadata): Promise<MetadataResult> {
    try {
      await this.ensureAuthenticated()
      
      await this.embedXMPMetadata(fileId, metadata)

      return {
        success: true,
        file_id: fileId
      }

    } catch (e) {
      return {
        success: false,
        file_id: fileId,
        error: e instanceof PlatformError ? e : this.createPlatformError('METADATA_FAILED', e instanceof Error ? e.message : String(e))
      }
    }
  }

  async getMetadata(fileId: string): Promise<ComplianceMetadata | null> {
    try {
      await this.ensureAuthenticated()
      
      const response = await this.makeRequest<any>('GET', `${this.config.endpoints.base_url}/files/${fileId}/metadata`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return this.parseXMPMetadata(response.xmp_data)

    } catch (e) {
      console.error('Failed to get metadata:', e)
      return null
    }
  }

  async updateMetadata(fileId: string, metadata: Partial<ComplianceMetadata>): Promise<MetadataResult> {
    try {
      await this.ensureAuthenticated()
      
      // Get existing metadata
      const existing = await this.getMetadata(fileId)
      if (!existing) {
        throw this.createPlatformError('METADATA_NOT_FOUND', 'No existing metadata found')
      }

      // Merge with new metadata
      const updated = { ...existing, ...metadata }
      await this.embedXMPMetadata(fileId, updated)

      return {
        success: true,
        file_id: fileId
      }

    } catch (e) {
      return {
        success: false,
        file_id: fileId,
        error: e instanceof PlatformError ? e : this.createPlatformError('METADATA_UPDATE_FAILED', e instanceof Error ? e.message : String(e))
      }
    }
  }

  async createProject(config: ProjectConfig): Promise<ProjectResult> {
    try {
      await this.ensureAuthenticated()
      
      const response = await this.makeRequest<any>('POST', `${this.config.endpoints.base_url}/projects`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          parent_id: config.parent_id,
          custom_fields: config.custom_fields
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

    } catch (e) {
      return {
        success: false,
        error: e instanceof PlatformError ? e : this.createPlatformError('PROJECT_CREATE_FAILED', e instanceof Error ? e.message : String(e))
      }
    }
  }

  async getProject(projectId: string): Promise<ProjectInfo | null> {
    try {
      await this.ensureAuthenticated()
      
      const response = await this.makeRequest<any>('GET', `${this.config.endpoints.base_url}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return {
        id: response.id,
        name: response.name,
        description: response.description,
        created_at: response.created_at
      }

    } catch (e) {
      console.error('Failed to get project:', e)
      return null
    }
  }

  async listProjects(filters?: ProjectFilters): Promise<ProjectListResult> {
    try {
      await this.ensureAuthenticated()
      
      const params = new URLSearchParams()
      if (filters?.name_contains) params.append('name_contains', filters.name_contains)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.cursor) params.append('cursor', filters.cursor)

      const response = await this.makeRequest<any>('GET', `${this.config.endpoints.base_url}/projects?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      return {
        items: response.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          created_at: item.created_at
        })),
        next_cursor: response.next_cursor
      }

    } catch (e) {
      throw e instanceof PlatformError ? e : this.createPlatformError('PROJECT_LIST_FAILED', e instanceof Error ? e.message : String(e))
    }
  }

  // Adobe-specific methods
  private async validateAccessToken(token: string): Promise<boolean> {
    try {
      await this.makeRequest('GET', `${this.config.endpoints.base_url}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return true
    } catch {
      return false
    }
  }

  private async refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<AuthResult> {
    try {
      const response = await this.makeRequest<any>('POST', `${this.config.endpoints.base_url}/oauth/token`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken
        })
      })

      this.accessToken = response.access_token
      this.refreshToken = response.refresh_token || refreshToken
      this.tokenExpiresAt = new Date(Date.now() + (response.expires_in * 1000))

      return {
        success: true,
        expires_at: this.tokenExpiresAt.toISOString()
      }

    } catch (e) {
      return {
        success: false,
        error: e instanceof PlatformError ? e : this.createPlatformError('REFRESH_FAILED', e instanceof Error ? e.message : String(e))
      }
    }
  }

  private async uploadToCreativeCloud(request: FileUploadRequest): Promise<{
    success: boolean
    file_id: string
    platform_file_id: string
    file_url?: string
  }> {
    // Create upload session
    const uploadSession = await this.makeRequest<any>('POST', `${this.config.endpoints.base_url}/files/upload`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: request.file.name,
        size: request.file.size,
        mime_type: request.file.mime_type,
        project_id: request.project_id,
        folder_path: request.folder_path
      })
    })

    // Upload file content
    const uploadResponse = await this.makeRequest<any>('PUT', uploadSession.upload_url, {
      headers: {
        'Content-Type': request.file.mime_type,
        'Content-Length': request.file.size.toString()
      },
      body: request.file.content
    })

    return {
      success: true,
      file_id: uploadSession.file_id,
      platform_file_id: uploadSession.file_id,
      file_url: uploadResponse.file_url
    }
  }

  private async embedXMPMetadata(fileId: string, metadata: ComplianceMetadata): Promise<void> {
    try {
      const xmpData = this.convertToXMP(metadata)
      
      await this.makeRequest('POST', `${this.config.endpoints.base_url}/files/${fileId}/metadata`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          xmp_data: xmpData,
          namespace: 'http://aicomplyr.io/ns/1.0/'
        })
      })

    } catch (e) {
      throw this.createPlatformError('XMP_EMBED_FAILED', e instanceof Error ? e.message : String(e))
    }
  }

  private convertToXMP(metadata: ComplianceMetadata): string {
    // Convert compliance metadata to XMP format
    const xmp = {
      'aicomplyr:version': metadata.aicomplyr.version,
      'aicomplyr:generated_at': metadata.aicomplyr.generated_at,
      'aicomplyr:project_id': metadata.aicomplyr.project_id,
      'aicomplyr:organization_id': metadata.aicomplyr.organization_id,
      'aicomplyr:activity_id': metadata.aicomplyr.activity_id,
      'aicomplyr:compliance_status': metadata.compliance.status,
      'aicomplyr:compliance_score': metadata.compliance.score,
      'aicomplyr:risk_level': metadata.compliance.risk_level,
      'aicomplyr:last_checked': metadata.compliance.last_checked,
      'aicomplyr:ai_tools': JSON.stringify(metadata.ai_tools),
      'aicomplyr:policy_checks': JSON.stringify(metadata.policy_checks),
      'aicomplyr:violations': JSON.stringify(metadata.violations),
      'aicomplyr:references': JSON.stringify(metadata.references)
    }

    return JSON.stringify(xmp)
  }

  private parseXMPMetadata(xmpData: string): ComplianceMetadata | null {
    try {
      const xmp = JSON.parse(xmpData)
      
      return {
        aicomplyr: {
          version: xmp['aicomplyr:version'] || '1.0.0',
          generated_at: xmp['aicomplyr:generated_at'] || new Date().toISOString(),
          project_id: xmp['aicomplyr:project_id'] || '',
          organization_id: xmp['aicomplyr:organization_id'] || '',
          activity_id: xmp['aicomplyr:activity_id']
        },
        compliance: {
          status: xmp['aicomplyr:compliance_status'] || 'unknown',
          score: xmp['aicomplyr:compliance_score'] || 0,
          risk_level: xmp['aicomplyr:risk_level'] || 'unknown',
          last_checked: xmp['aicomplyr:last_checked'] || new Date().toISOString()
        },
        ai_tools: xmp['aicomplyr:ai_tools'] ? JSON.parse(xmp['aicomplyr:ai_tools']) : [],
        policy_checks: xmp['aicomplyr:policy_checks'] ? JSON.parse(xmp['aicomplyr:policy_checks']) : [],
        violations: xmp['aicomplyr:violations'] ? JSON.parse(xmp['aicomplyr:violations']) : [],
        references: xmp['aicomplyr:references'] ? JSON.parse(xmp['aicomplyr:references']) : {}
      }

    } catch (e) {
      console.error('Failed to parse XMP metadata:', e)
      return null
    }
  }
}