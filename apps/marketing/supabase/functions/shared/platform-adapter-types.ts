// Universal Platform Adapter Types (Edge-safe)

export interface PlatformAdapter {
  readonly platform: string
  readonly version: string
  readonly capabilities: PlatformCapabilities

  // Authentication
  authenticate(credentials: PlatformCredentials): Promise<AuthResult>
  refreshAuth(): Promise<AuthResult>
  validateConnection(): Promise<ConnectionStatus>

  // File Operations
  uploadFile(request: FileUploadRequest): Promise<FileUploadResult>
  downloadFile(fileId: string): Promise<FileDownloadResult>
  deleteFile(fileId: string): Promise<boolean>
  listFiles(filters: FileListFilters): Promise<FileListResult>

  // Metadata Operations
  attachMetadata(fileId: string, metadata: ComplianceMetadata): Promise<MetadataResult>
  getMetadata(fileId: string): Promise<ComplianceMetadata | null>
  updateMetadata(fileId: string, metadata: Partial<ComplianceMetadata>): Promise<MetadataResult>

  // Project/Folder Operations
  createProject(config: ProjectConfig): Promise<ProjectResult>
  getProject(projectId: string): Promise<ProjectInfo | null>
  listProjects(filters?: ProjectFilters): Promise<ProjectListResult>

  // Webhook Operations
  setupWebhooks(config: WebhookConfig): Promise<WebhookSetupResult>
  handleWebhook(payload: WebhookPayload): Promise<WebhookResponse>

  // Health & Monitoring
  getHealth(): Promise<HealthStatus>
  getMetrics(): Promise<PlatformMetrics>
}

export interface PlatformCapabilities {
  supportsFileUpload: boolean
  supportsMetadata: boolean
  supportsWebhooks: boolean
  supportsProjects: boolean
  supportsBatchOperations: boolean
  maxFileSize: number
  supportedFileTypes: string[]
  metadataFieldTypes: MetadataFieldType[]
}

export type MetadataFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'array'
  | 'object'

export interface ComplianceMetadata {
  aicomplyr: {
    version: string
    generated_at: string
    project_id: string
    organization_id: string
    activity_id?: string
  }
  compliance: {
    status: 'compliant' | 'warning' | 'violation'
    score: number
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    last_checked: string
    next_check_due?: string
  }
  ai_tools: Array<{
    tool_name: string
    tool_version?: string
    usage_type: string
    approval_status: 'approved' | 'pending' | 'denied'
    evidence_files: string[]
    usage_timestamp: string
  }>
  policy_checks: Array<{
    policy_id: string
    policy_name: string
    policy_version: string
    status: 'passed' | 'failed' | 'warning'
    findings: PolicyFinding[]
    checked_at: string
  }>
  violations: Array<{
    violation_id: string
    violation_type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    corrective_actions: string[]
    detected_at: string
  }>
  references: {
    detailed_report_url: string
    audit_trail_url: string
    compliance_certificate_url?: string
    source_activity_url?: string
  }
  platform_specific?: Record<string, unknown>
}

export interface PolicyFinding {
  field: string
  message: string
  severity: 'low' | 'medium' | 'high'
  code?: string
}

export interface PlatformCredentials {
  platform: string
  auth_type: 'oauth2' | 'api_key' | 'basic' | 'session' | 'jwt'
  credentials: {
    client_id?: string
    client_secret?: string
    access_token?: string
    refresh_token?: string
    api_key?: string
    username?: string
    password?: string
    session_id?: string
    jwt_token?: string
    custom_fields?: Record<string, string>
  }
  endpoints: {
    base_url: string
    auth_url?: string
    token_url?: string
    api_version?: string
  }
  expires_at?: string
}

export interface FileUploadRequest {
  file: {
    name: string
    content: Uint8Array | string
    mime_type: string
    size: number
  }
  metadata: ComplianceMetadata
  project_id?: string
  folder_path?: string
  overwrite?: boolean
  lifecycle_state?: string
}

export interface FileUploadResult {
  success: boolean
  file_id: string
  platform_file_id: string
  file_url?: string
  metadata_attached: boolean
  error?: PlatformError
  warnings?: string[]
}

export interface FileDownloadResult {
  success: boolean
  file_id: string
  content?: Uint8Array
  mime_type?: string
  error?: PlatformError
}

export interface FileListFilters {
  project_id?: string
  folder_path?: string
  mime_types?: string[]
  limit?: number
  cursor?: string
}

export interface FileListResult {
  items: Array<{
    file_id: string
    name: string
    size: number
    mime_type: string
    last_modified: string
  }>
  next_cursor?: string
}

export interface MetadataResult {
  success: boolean
  file_id: string
  error?: PlatformError
}

export interface ProjectConfig {
  name: string
  description?: string
  parent_id?: string
  custom_fields?: Record<string, string>
}

export interface ProjectInfo {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface ProjectFilters {
  name_contains?: string
  limit?: number
  cursor?: string
}

export interface ProjectResult {
  success: boolean
  project?: ProjectInfo
  error?: PlatformError
}

export interface ProjectListResult {
  items: ProjectInfo[]
  next_cursor?: string
}

export interface WebhookConfig {
  endpoint_url: string
  secret_key?: string
  event_types: string[]
}

export interface WebhookSetupResult {
  success: boolean
  platform_webhook_id?: string
  error?: PlatformError
}

export interface WebhookPayload {
  id: string
  type: string
  created_at: string
  data: Record<string, unknown>
}

export interface WebhookResponse {
  status: 'ok' | 'ignored' | 'error'
  message?: string
}

export interface ConnectionStatus {
  connected: boolean
  latency?: number
  error?: string
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  connection: ConnectionStatus
  last_check: string
}

export interface PlatformMetrics {
  response_time_ms?: number
  success_rate?: number
  error_rate?: number
}

export interface AuthResult {
  success: boolean
  expires_at?: string
  error?: PlatformError
}

export interface PlatformError {
  code: string
  message: string
  details?: Record<string, unknown>
  retryable: boolean
  retry_after?: number
}

export interface RequestOptions {
  headers?: Record<string, string>
  body?: BodyInit | null
  maxRetries?: number
  retryDelay?: number
  signal?: AbortSignal
}


