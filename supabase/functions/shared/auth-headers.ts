import { PlatformCredentials } from './platform-adapter-types.ts'

export function buildAuthHeaders(credentials: PlatformCredentials): Record<string, string> {
  const headers: Record<string, string> = {}
  switch (credentials.auth_type) {
    case 'oauth2': {
      const token = credentials.credentials.access_token || credentials.credentials.jwt_token
      if (token) headers['Authorization'] = `Bearer ${token}`
      break
    }
    case 'api_key': {
      const apiKey = credentials.credentials.api_key
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
        headers['x-api-key'] = apiKey
      }
      break
    }
    case 'basic': {
      const { username, password } = credentials.credentials
      if (username && password) {
        const enc = btoa(`${username}:${password}`)
        headers['Authorization'] = `Basic ${enc}`
      }
      break
    }
    case 'session': {
      const sid = credentials.credentials.session_id
      if (sid) headers['Cookie'] = `sid=${sid}`
      break
    }
    case 'jwt': {
      const jwt = credentials.credentials.jwt_token
      if (jwt) headers['Authorization'] = `Bearer ${jwt}`
      break
    }
  }
  return headers
}

export function mergeHeaders(base: Record<string, string>, extra?: Record<string, string>): Record<string, string> {
  return { ...(base || {}), ...(extra || {}) }
}


