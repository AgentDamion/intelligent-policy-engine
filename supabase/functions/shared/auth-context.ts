import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'https://deno.land/x/jose@v4.14.4/index.ts'

type MaybeArray<T> = T | T[] | null | undefined

export interface AuthContext {
  userId: string
  enterpriseId: string
  partnerId?: string
  scopes: string[]
  roles: string[]
  defaultRole?: string
  mfaVerified: boolean
  mfaMethods: string[]
  isServiceRole: boolean
  rawClaims: JWTPayload
}

export interface AuthOptions {
  allowedRoles?: string[]
  requireMfa?: boolean
  allowServiceRoleBypass?: boolean
  corsHeaders?: HeadersInit
}

export class AuthError extends Error {
  constructor(
    public status: number,
    public code: 'unauthorized' | 'forbidden' | 'mfa_required' | 'bad_request',
    message: string,
  ) {
    super(message)
  }

  toResponse(corsHeaders?: HeadersInit): Response {
    const headers = new Headers(corsHeaders ?? {})
    headers.set('content-type', 'application/json')
    return new Response(
      JSON.stringify({
        error: this.code,
        message: this.message,
      }),
      {
        status: this.status,
        headers,
      },
    )
  }
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY') ?? undefined
const JWKS = SUPABASE_URL
  ? createRemoteJWKSet(new URL('/auth/v1/certs', SUPABASE_URL))
  : undefined

const DEFAULT_AUDIENCE = Deno.env.get('SUPABASE_JWT_AUD') ?? 'authenticated'
const DEFAULT_ISSUER = SUPABASE_URL ? new URL('/auth/v1', SUPABASE_URL).toString() : undefined

export async function requireAuth(req: Request, options: AuthOptions = {}): Promise<AuthContext> {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) {
    throw new AuthError(401, 'unauthorized', 'Authorization header missing')
  }

  const [scheme, token] = header.split(' ')
  if (!token || scheme.toLowerCase() !== 'bearer') {
    throw new AuthError(401, 'unauthorized', 'Authorization header must be a Bearer token')
  }

  // Allow trusted service role bypass for internal automation.
  if (SERVICE_KEY && token === SERVICE_KEY) {
    if (options.allowServiceRoleBypass === false) {
      throw new AuthError(403, 'forbidden', 'Service role token not allowed for this endpoint')
    }

    return {
      userId: '00000000-0000-0000-0000-000000000000',
      enterpriseId: '00000000-0000-0000-0000-000000000000',
      scopes: ['*'],
      roles: ['service_role'],
      defaultRole: 'service_role',
      mfaVerified: true,
      mfaMethods: ['service'],
      isServiceRole: true,
      rawClaims: {},
    }
  }

  if (!JWKS) {
    throw new AuthError(500, 'unauthorized', 'JWT verification is not configured')
  }

  let payload: JWTPayload
  try {
    const { payload: verified } = await jwtVerify(token, JWKS, {
      issuer: DEFAULT_ISSUER,
      audience: DEFAULT_AUDIENCE,
    })
    payload = verified
  } catch (err) {
    console.error('[auth] JWT verification failed', err)
    throw new AuthError(401, 'unauthorized', 'Invalid or expired token')
  }

  const userId = asString(payload.sub) ?? asString(payload['user_id'])
  if (!userId) {
    throw new AuthError(401, 'unauthorized', 'JWT missing subject')
  }

  const enterpriseId =
    pickClaim(payload, [
      ['enterprise_id'],
      ['enterpriseId'],
      ['org_id'],
      ['organization_id'],
      ['app_metadata', 'enterprise_id'],
      ['app_metadata', 'organization_id'],
      ['user_metadata', 'enterprise_id'],
    ]) ?? undefined

  if (!enterpriseId) {
    throw new AuthError(403, 'forbidden', 'Tenant context missing from token')
  }

  const partnerId =
    pickClaim(payload, [
      ['partner_id'],
      ['app_metadata', 'partner_id'],
      ['user_metadata', 'partner_id'],
    ]) ?? undefined

  const scopes = uniqueStrings(
    toArray(pickRaw(payload, [['scope'], ['scopes'], ['app_metadata', 'scopes']])),
  )

  const roles = uniqueStrings([
    ...toArray(pickRaw(payload, [['role']])),
    ...toArray(pickRaw(payload, [['app_metadata', 'role']])),
    ...toArray(pickRaw(payload, [['roles']])),
    ...toArray(pickRaw(payload, [['app_metadata', 'roles']])),
  ])

  const defaultRole = roles[0] ?? asString(payload['role'])

  const amr = toArray<string>(payload['amr'])
  const mfaVerified =
    Boolean(pickRaw(payload, [['app_metadata', 'mfa_verified']])) ||
    Boolean(pickRaw(payload, [['user_metadata', 'mfa_verified']])) ||
    amr.includes('mfa')

  if (options.requireMfa && !mfaVerified) {
    throw new AuthError(401, 'mfa_required', 'Multi-factor authentication is required')
  }

  if (options.allowedRoles && options.allowedRoles.length > 0) {
    const matching = roles.filter((role) => options.allowedRoles!.includes(role))
    if (matching.length === 0) {
      throw new AuthError(403, 'forbidden', 'Role not permitted for this action')
    }
  }

  return {
    userId,
    enterpriseId,
    partnerId,
    scopes,
    roles,
    defaultRole,
    mfaVerified,
    mfaMethods: amr,
    isServiceRole: false,
    rawClaims: payload,
  }
}

export async function withAuth(
  req: Request,
  handler: (ctx: AuthContext) => Promise<Response>,
  options: AuthOptions = {},
): Promise<Response> {
  const { corsHeaders, ...authOptions } = options
  try {
    const context = await requireAuth(req, authOptions)
    return await handler(context)
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse(corsHeaders)
    }
    console.error('[auth] unexpected error', error)
    const headers = new Headers(corsHeaders ?? {})
    headers.set('content-type', 'application/json')
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers,
    })
  }
}

function pickClaim(payload: JWTPayload, paths: string[][]): string | null {
  for (const path of paths) {
    const value = pickRaw(payload, [path])
    if (typeof value === 'string' && value) return value
  }
  return null
}

function pickRaw(payload: JWTPayload, paths: string[][]): unknown {
  for (const path of paths) {
    let current: unknown = payload
    let valid = true
    for (const key of path) {
      if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[key]
      } else {
        valid = false
        break
      }
    }
    if (valid) {
      return current
    }
  }
  return null
}

function toArray<T = string>(value: MaybeArray<T>): T[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean) as T[]
  if (typeof value === 'string') {
    return value
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean) as T[]
  }
  return [value] as T[]
}

function uniqueStrings(values: MaybeArray<string>): string[] {
  return Array.from(new Set(toArray(values).map((v) => v.toLowerCase())))
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

