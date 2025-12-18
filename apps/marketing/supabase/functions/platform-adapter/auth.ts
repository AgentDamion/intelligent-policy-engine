import { PlatformCredentials, PlatformCredentialsSchema, logger } from './interface.ts'

export class OAuth2Handler {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private scope: string[]
  private authUrl: string
  private tokenUrl: string

  constructor(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    scope: string[],
    authUrl: string,
    tokenUrl: string,
  ) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.redirectUri = redirectUri
    this.scope = scope
    this.authUrl = authUrl
    this.tokenUrl = tokenUrl
  }

  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope.join(' '),
      response_type: 'code',
      ...(state ? { state } : {}),
    })
    return `${this.authUrl}?${params.toString()}`
  }

  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    scope?: string
  }> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OAuth2 token exchange failed: ${error}`)
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
  }> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OAuth2 token refresh failed: ${error}`)
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    }
  }
}

export class ApiKeyHandler {
  private apiKey: string
  private headerName: string
  private queryParam?: string

  constructor(apiKey: string, headerName: string = 'Authorization', queryParam?: string) {
    this.apiKey = apiKey
    this.headerName = headerName
    this.queryParam = queryParam
  }

  getHeaders(): Record<string, string> {
    return { [this.headerName]: `Bearer ${this.apiKey}` }
  }

  getQueryParams(): Record<string, string> {
    return this.queryParam ? { [this.queryParam]: this.apiKey } : {}
  }

  validate(): boolean {
    return this.apiKey.length > 0
  }
}

export class BasicAuthHandler {
  private username: string
  private password: string

  constructor(username: string, password: string) {
    this.username = username
    this.password = password
  }

  private getAuthHeader(): string {
    const credentials = btoa(`${this.username}:${this.password}`)
    return `Basic ${credentials}`
  }

  getHeaders(): Record<string, string> {
    return { 'Authorization': this.getAuthHeader() }
  }

  validate(): boolean {
    return this.username.length > 0 && this.password.length > 0
  }
}

export class BearerTokenHandler {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  getHeaders(): Record<string, string> {
    return { 'Authorization': `Bearer ${this.token}` }
  }

  validate(): boolean {
    return this.token.length > 0
  }
}

export class AuthenticationManager {
  private handlers = new Map<string, any>()

  constructor() {
    this.handlers.set('oauth2', OAuth2Handler)
    this.handlers.set('api_key', ApiKeyHandler)
    this.handlers.set('basic_auth', BasicAuthHandler)
    this.handlers.set('bearer_token', BearerTokenHandler)
  }

  createHandler(type: PlatformCredentials['type'], ...args: unknown[]): any {
    const Handler = this.handlers.get(type)
    if (!Handler) throw new Error(`Unsupported authentication type: ${type}`)
    return new Handler(...args)
  }

  async validateCredentials(credentials: PlatformCredentials): Promise<{ valid: boolean; error?: string }> {
    try {
      PlatformCredentialsSchema.parse(credentials)
      switch (credentials.type) {
        case 'oauth2':
          if (!credentials.clientId || !credentials.clientSecret) return { valid: false, error: 'Missing clientId/clientSecret' }
          return { valid: true }
        case 'api_key':
          if (!credentials.apiKey) return { valid: false, error: 'Missing apiKey' }
          return { valid: true }
        case 'basic_auth':
          if (!credentials.username || !credentials.password) return { valid: false, error: 'Missing username/password' }
          return { valid: true }
        case 'bearer_token':
          if (!credentials.token) return { valid: false, error: 'Missing token' }
          return { valid: true }
      }
    } catch (e) {
      return { valid: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  getAuthHeaders(credentials: PlatformCredentials): Record<string, string> {
    switch (credentials.type) {
      case 'api_key':
        return new ApiKeyHandler(credentials.apiKey || '').getHeaders()
      case 'basic_auth':
        return new BasicAuthHandler(credentials.username || '', credentials.password || '').getHeaders()
      case 'bearer_token':
        return new BearerTokenHandler(credentials.token || '').getHeaders()
      case 'oauth2':
        if (credentials.token) return new BearerTokenHandler(credentials.token).getHeaders()
        logger.warn('auth', 'getAuthHeaders', 'OAuth2 without token provided')
        return {}
      default:
        return {}
    }
  }

  isExpired(credentials: PlatformCredentials): boolean {
    if (credentials.type !== 'oauth2' || !credentials.expiresAt) return false
    return new Date() >= new Date(credentials.expiresAt)
  }
}

export const authManager = new AuthenticationManager()


