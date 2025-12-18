import { PlatformCredentials } from './platform-adapter-types.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Simple in-memory + env-backed credential manager for Edge functions
export class CredentialManager {
  // In Edge functions, keep minimal state; rely on env or KMS in future
  static fromEnv(platform: string): PlatformCredentials | null {
    const prefix = platform.toUpperCase()
    const baseUrl = Deno.env.get(`${prefix}_BASE_URL`)
    const authType = Deno.env.get(`${prefix}_AUTH_TYPE`) as PlatformCredentials['auth_type'] | undefined
    if (!baseUrl || !authType) return null

    const creds: PlatformCredentials = {
      platform,
      auth_type: authType,
      credentials: {
        client_id: Deno.env.get(`${prefix}_CLIENT_ID`) || undefined,
        client_secret: Deno.env.get(`${prefix}_CLIENT_SECRET`) || undefined,
        access_token: Deno.env.get(`${prefix}_ACCESS_TOKEN`) || undefined,
        refresh_token: Deno.env.get(`${prefix}_REFRESH_TOKEN`) || undefined,
        api_key: Deno.env.get(`${prefix}_API_KEY`) || undefined,
        username: Deno.env.get(`${prefix}_USERNAME`) || undefined,
        password: Deno.env.get(`${prefix}_PASSWORD`) || undefined,
        jwt_token: Deno.env.get(`${prefix}_JWT_TOKEN`) || undefined,
      },
      endpoints: {
        base_url: baseUrl,
        auth_url: Deno.env.get(`${prefix}_AUTH_URL`) || undefined,
        token_url: Deno.env.get(`${prefix}_TOKEN_URL`) || undefined,
        api_version: Deno.env.get(`${prefix}_API_VERSION`) || undefined,
      },
      expires_at: Deno.env.get(`${prefix}_EXPIRES_AT`) || undefined,
    }
    return creds
  }

  static async encryptCredentials(obj: Record<string, unknown>, secret?: string): Promise<string> {
    const key = await this.getKey(secret)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = new TextEncoder().encode(JSON.stringify(obj))
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
    const out = new Uint8Array(iv.length + cipher.byteLength)
    out.set(iv, 0)
    out.set(new Uint8Array(cipher), iv.length)
    return btoa(String.fromCharCode(...out))
  }

  static async decryptCredentials(enc: string, secret?: string): Promise<Record<string, unknown>> {
    const raw = Uint8Array.from(atob(enc), c => c.charCodeAt(0))
    const iv = raw.slice(0, 12)
    const data = raw.slice(12)
    const key = await this.getKey(secret)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    const text = new TextDecoder().decode(new Uint8Array(plain))
    return JSON.parse(text)
  }

  private static async getKey(secret?: string): Promise<CryptoKey> {
    const sec = secret || Deno.env.get('PLATFORM_CREDENTIALS_SECRET') || ''
    const bytes = sec.startsWith('base64:')
      ? Uint8Array.from(atob(sec.slice(7)), c => c.charCodeAt(0))
      : new TextEncoder().encode(sec.padEnd(32).slice(0,32))
    return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt','decrypt'])
  }

  static getSupabase(): SupabaseClient {
    const url = Deno.env.get('SUPABASE_URL')!
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    return createClient(url, key)
  }

  static async loadFromDb(id: string) {
    const sb = this.getSupabase()
    const { data, error } = await sb.from('platform_configurations').select('*').eq('id', id).single()
    if (error) throw error
    return data
  }

  static async decryptFromDb(id: string, secret?: string): Promise<Record<string, unknown> | null> {
    const rec = await this.loadFromDb(id)
    if (!rec?.credentials_encrypted) return null
    return await this.decryptCredentials(rec.credentials_encrypted, secret)
  }
}


