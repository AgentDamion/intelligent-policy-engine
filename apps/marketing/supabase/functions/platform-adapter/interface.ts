import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts"

// Logging utilities for platform interactions
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export function platformLog(
  level: LogLevel,
  platform: string,
  operation: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  const ts = new Date().toISOString()
  const prefix = `[${ts}] [${level}] [${platform}] [${operation}]`
  const payload = data ? ` | ${JSON.stringify(data)}` : ""
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(`${prefix} ${message}${payload}`)
      break
    case LogLevel.INFO:
      console.info(`${prefix} ${message}${payload}`)
      break
    case LogLevel.WARN:
      console.warn(`${prefix} ${message}${payload}`)
      break
    case LogLevel.ERROR:
      console.error(`${prefix} ${message}${payload}`)
      break
  }
}

export const logger = {
  debug: (platform: string, operation: string, message: string, data?: Record<string, unknown>) =>
    platformLog(LogLevel.DEBUG, platform, operation, message, data),
  info: (platform: string, operation: string, message: string, data?: Record<string, unknown>) =>
    platformLog(LogLevel.INFO, platform, operation, message, data),
  warn: (platform: string, operation: string, message: string, data?: Record<string, unknown>) =>
    platformLog(LogLevel.WARN, platform, operation, message, data),
  error: (platform: string, operation: string, message: string, data?: Record<string, unknown>) =>
    platformLog(LogLevel.ERROR, platform, operation, message, data),
}

// Retry helper with exponential backoff and jitter
export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  jitter?: boolean
  retryOn?: (error: unknown) => boolean
}

export async function withRetry<T>(
  platform: string,
  operation: string,
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 15_000,
    backoffMultiplier = 2,
    jitter = true,
    retryOn = defaultRetryOn,
  } = options

  let attempt = 0
  let delay = baseDelayMs

  while (true) {
    attempt += 1
    try {
      if (attempt > 1) {
        logger.debug(platform, operation, `Retry attempt ${attempt}/${maxAttempts}`)
      }
      return await fn()
    } catch (err) {
      if (attempt >= maxAttempts || !retryOn(err)) {
        logger.error(platform, operation, `Operation failed`, { attempt, error: asErrorMessage(err) })
        throw err
      }

      const sleepFor = Math.min(delay, maxDelayMs)
      const jitterAmount = jitter ? (Math.random() - 0.5) * 0.2 * sleepFor : 0
      const finalSleep = Math.max(0, Math.floor(sleepFor + jitterAmount))
      logger.warn(platform, operation, `Retrying in ${finalSleep}ms`, { attempt, error: asErrorMessage(err) })
      await sleep(finalSleep)
      delay = Math.min(maxDelayMs, delay * backoffMultiplier)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function defaultRetryOn(error: unknown): boolean {
  const message = asErrorMessage(error).toLowerCase()
  return message.includes("timeout") ||
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("rate limit") ||
    message.includes("429") ||
    message.includes("503") ||
    message.includes("504")
}

function asErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

// ---- Core contracts ----
export interface PlatformCredentials {
  type: 'oauth2' | 'api_key' | 'basic_auth' | 'bearer_token'
  clientId?: string
  clientSecret?: string
  apiKey?: string
  username?: string
  password?: string
  token?: string
  refreshToken?: string
  expiresAt?: string // ISO string for portability in edge/runtime contexts
  scope?: string[]
  [key: string]: unknown
}

export interface FileMetadata {
  id: string
  name: string
  path: string
  size: number
  mimeType: string
  lastModified: string // ISO string
  checksum?: string
  tags?: string[]
  customProperties?: Record<string, unknown>
  platformSpecific?: Record<string, unknown>
}

export interface UploadResult {
  success: boolean
  fileId?: string
  url?: string
  metadata?: FileMetadata
  error?: string
  retryable?: boolean
}

export interface ListFilesOptions {
  projectPath?: string
  recursive?: boolean
  fileTypes?: string[]
  limit?: number
  offset?: number
  sortBy?: 'name' | 'size' | 'lastModified'
  sortOrder?: 'asc' | 'desc'
}

export interface PlatformCapabilities {
  supportsOAuth2: boolean
  supportsApiKey: boolean
  supportsBasicAuth: boolean
  supportsFileUpload: boolean
  supportsMetadata: boolean
  supportsFileListing: boolean
  supportsFileDeletion: boolean
  maxFileSize: number
  supportedFileTypes: string[]
  rateLimits?: {
    requestsPerMinute?: number
    requestsPerHour?: number
    requestsPerDay?: number
  }
  features?: string[]
}

export interface PlatformConfig {
  name: string
  displayName: string
  version: string
  baseUrl: string
  capabilities: PlatformCapabilities
  authentication: {
    required: boolean
    supportedTypes: Array<PlatformCredentials['type']>
    defaultType: PlatformCredentials['type']
  }
  endpoints?: {
    auth?: string
    upload?: string
    files?: string
    metadata?: string
    [key: string]: string | undefined
  }
}

export interface PlatformError extends Error {
  code: string
  statusCode?: number
  retryable: boolean
  platform: string
  operation: string
  details?: Record<string, unknown>
}

export const PlatformCredentialsSchema = z.object({
  type: z.enum(['oauth2', 'api_key', 'basic_auth', 'bearer_token']),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  apiKey: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  token: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
  scope: z.array(z.string()).optional(),
}).passthrough()

export const FileMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  size: z.number().nonnegative(),
  mimeType: z.string(),
  lastModified: z.string(),
  checksum: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customProperties: z.record(z.unknown()).optional(),
  platformSpecific: z.record(z.unknown()).optional(),
})

export const ListFilesOptionsSchema = z.object({
  projectPath: z.string().optional(),
  recursive: z.boolean().default(false),
  fileTypes: z.array(z.string()).optional(),
  limit: z.number().positive().max(1000).default(100),
  offset: z.number().nonnegative().default(0),
  sortBy: z.enum(['name', 'size', 'lastModified']).default('lastModified'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export interface PlatformAdapter {
  readonly platformName: string
  readonly config: PlatformConfig
  readonly isAuthenticated: boolean

  authenticate(credentials: PlatformCredentials): Promise<boolean>
  testConnection(): Promise<boolean>

  uploadFile(
    file: File | ArrayBuffer | Uint8Array,
    metadata: Partial<FileMetadata>,
  ): Promise<UploadResult>
  attachMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<boolean>
  listFiles(options?: ListFilesOptions): Promise<FileMetadata[]>
  deleteFile(fileId: string): Promise<boolean>
  getFile(fileId: string): Promise<FileMetadata | null>

  refreshCredentials(): Promise<boolean>
  revokeAuthentication(): Promise<boolean>
  getCapabilities(): PlatformCapabilities
  validateCredentials(credentials: PlatformCredentials): Promise<boolean>

  getStatus(): Promise<{
    connected: boolean
    authenticated: boolean
    lastError?: string
    rateLimitStatus?: { remaining: number; resetTime: string }
  }>
}

export abstract class BasePlatformAdapter implements PlatformAdapter {
  public readonly platformName: string
  public readonly config: PlatformConfig
  protected _isAuthenticated = false
  protected _credentials?: PlatformCredentials
  protected _lastError?: string

  constructor(platformName: string, config: PlatformConfig) {
    this.platformName = platformName
    this.config = config
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated
  }

  abstract authenticate(credentials: PlatformCredentials): Promise<boolean>
  abstract testConnection(): Promise<boolean>
  abstract uploadFile(
    file: File | ArrayBuffer | Uint8Array,
    metadata: Partial<FileMetadata>,
  ): Promise<UploadResult>
  abstract attachMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<boolean>
  abstract listFiles(options?: ListFilesOptions): Promise<FileMetadata[]>
  abstract deleteFile(fileId: string): Promise<boolean>
  abstract getFile(fileId: string): Promise<FileMetadata | null>

  async refreshCredentials(): Promise<boolean> {
    if (!this._credentials) {
      throw new Error('No credentials available to refresh')
    }
    return this.authenticate(this._credentials)
  }

  async revokeAuthentication(): Promise<boolean> {
    this._isAuthenticated = false
    this._credentials = undefined
    this._lastError = undefined
    return true
  }

  getCapabilities(): PlatformCapabilities {
    return this.config.capabilities
  }

  async validateCredentials(credentials: PlatformCredentials): Promise<boolean> {
    try {
      PlatformCredentialsSchema.parse(credentials)
      return true
    } catch (error) {
      this._lastError = `Invalid credentials format: ${asErrorMessage(error)}`
      return false
    }
  }

  async getStatus(): Promise<{
    connected: boolean
    authenticated: boolean
    lastError?: string
    rateLimitStatus?: { remaining: number; resetTime: string }
  }> {
    const connected = await this.testConnection()
    return {
      connected,
      authenticated: this._isAuthenticated,
      lastError: this._lastError,
    }
  }

  protected setError(error: string, retryable = false): void {
    this._lastError = error
    if (!retryable) this._isAuthenticated = false
  }

  protected clearError(): void {
    this._lastError = undefined
  }
}

export class PlatformAuthenticationError extends Error implements PlatformError {
  public readonly code = 'AUTH_ERROR'
  public readonly retryable = false
  public readonly platform: string
  public readonly operation: string
  public readonly details?: Record<string, unknown>

  constructor(platform: string, operation: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'PlatformAuthenticationError'
    this.platform = platform
    this.operation = operation
    this.details = details
  }
}

export class PlatformRateLimitError extends Error implements PlatformError {
  public readonly code = 'RATE_LIMIT'
  public readonly retryable = true
  public readonly platform: string
  public readonly operation: string
  public readonly statusCode?: number

  constructor(platform: string, operation: string, message: string, statusCode?: number) {
    super(message)
    this.name = 'PlatformRateLimitError'
    this.platform = platform
    this.operation = operation
    this.statusCode = statusCode
  }
}

export class PlatformFileError extends Error implements PlatformError {
  public readonly code = 'FILE_ERROR'
  public readonly retryable: boolean
  public readonly platform: string
  public readonly operation: string

  constructor(platform: string, operation: string, message: string, retryable = false) {
    super(message)
    this.name = 'PlatformFileError'
    this.platform = platform
    this.operation = operation
    this.retryable = retryable
  }
}

export class PlatformConnectionError extends Error implements PlatformError {
  public readonly code = 'CONNECTION_ERROR'
  public readonly retryable = true
  public readonly platform: string
  public readonly operation: string

  constructor(platform: string, operation: string, message: string) {
    super(message)
    this.name = 'PlatformConnectionError'
    this.platform = platform
    this.operation = operation
  }
}


