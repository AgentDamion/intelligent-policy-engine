import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformCredentials,
  PlatformError,
  AuthResult,
  FileUploadRequest,
  FileUploadResult,
  ComplianceMetadata,
  MetadataResult,
  ConnectionStatus,
  HealthStatus,
  RequestOptions,
} from './platform-adapter-types.ts'

// Minimal logger for Edge context
function log(level: 'debug' | 'info' | 'warn' | 'error', scope: string, message: string, data?: Record<string, unknown>) {
  const ts = new Date().toISOString()
  const payload = data ? ` | ${JSON.stringify(data)}` : ''
  const line = `[${ts}] [${scope}] [${level.toUpperCase()}] ${message}${payload}`
  ;(console as any)[level](line)
}

export abstract class BasePlatformAdapter implements PlatformAdapter {
  protected credentials: PlatformCredentials
  protected config: PlatformConfig

  abstract readonly platform: string
  abstract readonly version: string
  abstract readonly capabilities: PlatformCapabilities

  constructor(credentials: PlatformCredentials, config: PlatformConfig) {
    this.credentials = credentials
    this.config = config
  }

  // ---- HTTP with retry/backoff ----
  protected async makeRequest<T>(method: string, url: string, options: RequestOptions = {}): Promise<T> {
    const maxRetries = options.maxRetries ?? 3
    const retryDelay = options.retryDelay ?? 1000
    const headers = options.headers ?? {}

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, { method, headers, body: options.body, signal: options.signal })

        if (!response.ok) {
          const error = await this.handleHttpError(response)
          if (!error.retryable || attempt === maxRetries) throw error
          await this.delay(retryDelay * attempt)
          continue
        }
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          return await response.json()
        }
        // @ts-ignore - caller is responsible to cast appropriately
        return await (response.text() as unknown as T)
      } catch (e) {
        log('warn', `${this.platform}:http`, `Request failed (attempt ${attempt}/${maxRetries})`, {
          method,
          url,
          error: e instanceof Error ? e.message : String(e),
        })
        if (attempt === maxRetries) throw this.createPlatformError('REQUEST_FAILED', 'Request failed', { method, url })
        await this.delay(retryDelay * attempt)
      }
    }
    // Unreachable
    throw this.createPlatformError('REQUEST_FAILED', 'Exhausted retries')
  }

  // ---- Auth helpers ----
  protected async ensureAuthenticated(): Promise<void> {
    if (!this.isTokenValid()) await this.refreshAuth()
  }

  protected isTokenValid(): boolean {
    if (!this.credentials.expires_at) return true
    return new Date(this.credentials.expires_at) > new Date()
  }

  // ---- Error helpers ----
  protected createPlatformError(code: string, message: string, details?: Record<string, unknown>): PlatformError {
    return { code, message, details, retryable: this.isRetryableError(code) }
  }

  protected isRetryableError(code: string): boolean {
    return ['RATE_LIMITED', 'TIMEOUT', 'SERVER_ERROR', 'NETWORK_ERROR', 'REQUEST_FAILED'].includes(code)
  }

  protected async handleHttpError(response: Response): Promise<PlatformError> {
    const status = response.status
    let message = `HTTP ${status}`
    try {
      const body = await response.text()
      message = `${message}: ${body}`
    } catch {}
    if (status === 429) return this.createPlatformError('RATE_LIMITED', message, { status })
    if (status >= 500) return this.createPlatformError('SERVER_ERROR', message, { status })
    return this.createPlatformError('HTTP_ERROR', message, { status })
  }

  // ---- Logging ----
  protected async logOperation(operation: string, details: Record<string, unknown>, duration?: number): Promise<void> {
    log('info', `${this.platform}:op`, operation, { ...details, duration })
  }

  // ---- Utilities ----
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  protected validateFileSize(size: number): void {
    if (size > this.capabilities.maxFileSize) {
      throw this.createPlatformError('FILE_TOO_LARGE', `Size ${size} exceeds ${this.capabilities.maxFileSize}`)
    }
  }

  protected validateFileType(mimeType: string): void {
    if (!this.capabilities.supportedFileTypes.includes(mimeType)) {
      throw this.createPlatformError('UNSUPPORTED_FILE_TYPE', `Unsupported type ${mimeType}`)
    }
  }

  // ---- Abstracts to implement ----
  abstract authenticate(credentials: PlatformCredentials): Promise<AuthResult>
  abstract uploadFile(request: FileUploadRequest): Promise<FileUploadResult>
  abstract attachMetadata(fileId: string, metadata: ComplianceMetadata): Promise<MetadataResult>

  // ---- Default impls (override as needed) ----
  async validateConnection(): Promise<ConnectionStatus> {
    try {
      await this.ensureAuthenticated()
      return { connected: true, latency: 0 }
    } catch (e) {
      return { connected: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  async getHealth(): Promise<HealthStatus> {
    const connection = await this.validateConnection()
    return { status: connection.connected ? 'healthy' : 'unhealthy', connection, last_check: new Date().toISOString() }
  }
}

// Lightweight platform config used by base
export interface PlatformConfig {
  name: string
  displayName?: string
  endpoints: { base_url: string; [key: string]: string | undefined }
}


