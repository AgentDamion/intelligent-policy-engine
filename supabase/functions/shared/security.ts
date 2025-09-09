// Security utilities for Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = parseInt(Deno.env.get('RATE_LIMIT_REQUESTS_PER_MINUTE') || '100')
const RATE_LIMIT_BURST_SIZE = parseInt(Deno.env.get('RATE_LIMIT_BURST_SIZE') || '20')

// Request tracking (in-memory for Edge Functions)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

// Rate limiting
export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now()
  const record = requestCounts.get(identifier)
  
  if (!record || now > record.resetTime) {
    // Create new window
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    })
    return { allowed: true }
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }
  
  // Increment count
  record.count++
  
  // Check burst limit
  if (record.count > RATE_LIMIT_BURST_SIZE && record.count > RATE_LIMIT_MAX_REQUESTS * 0.8) {
    // Soft limit - slow down requests
    return { allowed: true, retryAfter: 1 }
  }
  
  return { allowed: true }
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime + RATE_LIMIT_WINDOW_MS) {
      requestCounts.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW_MS)

// Validate organization access
export async function validateOrgAccess(
  orgId: string, 
  userId?: string
): Promise<boolean> {
  if (!orgId) return false
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Check if organization exists and is active
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, status')
      .eq('id', orgId)
      .eq('status', 'active')
      .single()
    
    if (error || !org) return false
    
    // If userId provided, check membership
    if (userId) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .single()
      
      return !!member
    }
    
    return true
  } catch (e) {
    console.error('Error validating org access:', e)
    return false
  }
}

// Sanitize input
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS vectors
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

// Validate API key
export async function validateAPIKey(
  apiKey: string,
  requiredScopes?: string[]
): Promise<{ valid: boolean; orgId?: string }> {
  if (!apiKey) return { valid: false }
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Hash API key for storage
    const hashedKey = await hashAPIKey(apiKey)
    
    // Look up API key
    const { data: keyRecord, error } = await supabase
      .from('api_keys')
      .select('id, organization_id, scopes, expires_at')
      .eq('key_hash', hashedKey)
      .eq('status', 'active')
      .single()
    
    if (error || !keyRecord) return { valid: false }
    
    // Check expiration
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return { valid: false }
    }
    
    // Check scopes if required
    if (requiredScopes && requiredScopes.length > 0) {
      const keyScopes = keyRecord.scopes || []
      const hasAllScopes = requiredScopes.every(scope => keyScopes.includes(scope))
      if (!hasAllScopes) return { valid: false }
    }
    
    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id)
    
    return { valid: true, orgId: keyRecord.organization_id }
  } catch (e) {
    console.error('Error validating API key:', e)
    return { valid: false }
  }
}

// Hash API key
async function hashAPIKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// CORS configuration
export function getCORSHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '*').split(',')
  
  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-org-id, x-api-key',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400'
    }
  }
  
  // Default CORS headers
  return {
    'Access-Control-Allow-Origin': allowedOrigins[0] || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-org-id, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400'
  }
}

// Request logging
export async function logRequest(
  req: Request,
  res: Response,
  duration: number,
  context: any = {}
): Promise<void> {
  if (Deno.env.get('ENABLE_REQUEST_LOGGING') !== 'true') return
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const url = new URL(req.url)
    
    await supabase.from('request_logs').insert({
      method: req.method,
      path: url.pathname,
      status_code: res.status,
      duration_ms: duration,
      user_agent: req.headers.get('user-agent'),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      organization_id: context.orgId,
      error_message: context.error,
      created_at: new Date().toISOString()
    })
  } catch (e) {
    console.error('Failed to log request:', e)
  }
}

// Error response helper
export function errorResponse(
  message: string,
  status: number = 400,
  details?: any
): Response {
  const error = {
    error: message,
    status,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  }
  
  return new Response(JSON.stringify(error), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...securityHeaders
    }
  })
}