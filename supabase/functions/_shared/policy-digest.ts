/**
 * Policy Digest Utilities
 * 
 * Shared utilities for policy digest resolution and W3C trace context propagation.
 * Used across Edge Functions to ensure consistent policy governance tracking.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface PolicyDigestContext {
  digest: string
  fullReference: string // e.g., 'ghcr.io/aicomplyr/policies/pfizer@sha256:abc...'
  artifactId: string
  policyId: string
  versionNumber: number
  activatedAt: string
}

export interface TraceContext {
  traceId: string
  spanId: string
  traceState: Record<string, string>
  policyDigest: string | null
}

export interface PolicyArtifact {
  id: string
  policy_id: string
  version_number: number
  oci_registry: string
  oci_repository: string
  oci_tag: string | null
  oci_digest: string
  content_sha256: string
  created_at: string
}

// =============================================================================
// POLICY DIGEST RESOLUTION
// =============================================================================

/**
 * Resolve the active policy digest for an enterprise/workspace.
 * This is the canonical function for determining "which policy governs this request?"
 */
export async function resolveActivePolicyDigest(
  supabase: SupabaseClient,
  enterpriseId: string,
  workspaceId?: string | null
): Promise<PolicyDigestContext | null> {
  try {
    // Call the database function for consistent resolution logic
    const { data: digest, error } = await supabase.rpc('get_active_policy_digest', {
      p_enterprise_id: enterpriseId,
      p_workspace_id: workspaceId || null
    })

    if (error) {
      console.warn(`[policy-digest] Error resolving digest for enterprise ${enterpriseId}:`, error)
      return null
    }

    if (!digest) {
      console.log(`[policy-digest] No active policy digest for enterprise ${enterpriseId}`)
      return null
    }

    // Fetch full artifact details for the digest
    const { data: artifact, error: artifactError } = await supabase
      .from('policy_artifacts')
      .select('id, policy_id, version_number, oci_registry, oci_repository, oci_tag, oci_digest, created_at')
      .eq('oci_digest', digest)
      .single()

    if (artifactError || !artifact) {
      console.error('[policy-digest] Failed to fetch artifact details:', artifactError)
      return null
    }

    // Get activation time
    const { data: activation } = await supabase
      .from('policy_activations')
      .select('activated_at')
      .eq('active_digest', digest)
      .eq('enterprise_id', enterpriseId)
      .is('deactivated_at', null)
      .order('activated_at', { ascending: false })
      .limit(1)
      .single()

    return {
      digest: artifact.oci_digest,
      fullReference: `${artifact.oci_registry}/${artifact.oci_repository}@${artifact.oci_digest}`,
      artifactId: artifact.id,
      policyId: artifact.policy_id,
      versionNumber: artifact.version_number,
      activatedAt: activation?.activated_at || artifact.created_at
    }
  } catch (err) {
    console.error('[policy-digest] Exception resolving policy digest:', err)
    return null
  }
}

/**
 * Get policy artifact details by digest
 */
export async function getPolicyArtifactByDigest(
  supabase: SupabaseClient,
  digest: string
): Promise<PolicyArtifact | null> {
  try {
    const { data, error } = await supabase
      .from('policy_artifacts')
      .select('*')
      .eq('oci_digest', digest)
      .single()

    if (error || !data) {
      return null
    }

    return data as PolicyArtifact
  } catch {
    return null
  }
}

/**
 * Get policy digest that was active at a specific point in time
 */
export async function getPolicyDigestAtTime(
  supabase: SupabaseClient,
  enterpriseId: string,
  workspaceId: string | null,
  atTime: Date
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_policy_digest_at_time', {
      p_enterprise_id: enterpriseId,
      p_workspace_id: workspaceId,
      p_at_time: atTime.toISOString()
    })

    if (error) {
      console.warn('[policy-digest] Error getting historical digest:', error)
      return null
    }

    return data
  } catch {
    return null
  }
}

// =============================================================================
// W3C TRACE CONTEXT PARSING
// =============================================================================

/**
 * Parse W3C tracestate header into key-value pairs
 * Format: "vendor1=value1,vendor2=value2"
 */
export function parseTraceState(traceStateHeader: string | null): Record<string, string> {
  if (!traceStateHeader) return {}
  
  return traceStateHeader
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => entry.includes('='))
    .reduce((acc, entry) => {
      const eqIndex = entry.indexOf('=')
      const key = entry.slice(0, eqIndex).trim()
      const value = entry.slice(eqIndex + 1).trim()
      if (key && value) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, string>)
}

/**
 * Parse W3C traceparent header
 * Format: {version}-{trace_id}-{parent_id}-{flags}
 * Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
 */
export function parseTraceParent(traceParentHeader: string | null): { traceId: string; spanId: string } | null {
  if (!traceParentHeader) return null
  
  const parts = traceParentHeader.split('-')
  if (parts.length !== 4) return null
  
  // Validate trace ID (32 hex chars) and span ID (16 hex chars)
  const traceId = parts[1]
  const spanId = parts[2]
  
  if (!/^[0-9a-f]{32}$/i.test(traceId)) return null
  if (!/^[0-9a-f]{16}$/i.test(spanId)) return null
  
  return { traceId, spanId }
}

/**
 * Build updated tracestate with policy digest
 * Ensures ai.eps is always first (newest) entry per W3C spec
 */
export function buildTraceState(
  existingTraceState: Record<string, string>,
  policyDigest: string
): string {
  // Remove existing ai.eps if present
  const filtered = Object.entries(existingTraceState)
    .filter(([key]) => key !== 'ai.eps')
  
  // Add new ai.eps at the front (most recent entry per W3C spec)
  const entries = [
    `ai.eps=${policyDigest}`,
    ...filtered.map(([k, v]) => `${k}=${v}`)
  ]
  
  // Respect 512 byte limit for tracestate
  let result = entries.join(',')
  while (result.length > 512 && entries.length > 1) {
    // Truncate vendor entries from the end if needed
    entries.pop()
    result = entries.join(',')
  }
  
  return result
}

/**
 * Build traceparent header for outgoing requests
 * Creates a new span ID for the child span
 */
export function buildTraceParent(traceId: string, spanId: string): string {
  return `00-${traceId}-${spanId}-01`
}

/**
 * Generate a new span ID (16 hex characters)
 */
export function generateSpanId(): string {
  const array = new Uint8Array(8)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a new trace ID (32 hex characters)
 */
export function generateTraceId(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Extract full trace context from request headers
 */
export function extractTraceContext(headers: Headers): TraceContext {
  const traceParent = parseTraceParent(headers.get('traceparent'))
  const traceState = parseTraceState(headers.get('tracestate'))
  
  return {
    traceId: traceParent?.traceId || generateTraceId(),
    spanId: traceParent?.spanId || generateSpanId(),
    traceState: traceState,
    policyDigest: traceState['ai.eps'] || null
  }
}

/**
 * Create trace headers for outgoing requests
 */
export function createTraceHeaders(
  traceContext: TraceContext,
  policyDigest?: string | null
): Record<string, string> {
  const newSpanId = generateSpanId()
  const traceState = policyDigest 
    ? buildTraceState(traceContext.traceState, policyDigest)
    : Object.entries(traceContext.traceState).map(([k, v]) => `${k}=${v}`).join(',')
  
  const headers: Record<string, string> = {
    'traceparent': buildTraceParent(traceContext.traceId, newSpanId),
  }
  
  if (traceState) {
    headers['tracestate'] = traceState
  }
  
  if (policyDigest) {
    headers['x-policy-digest'] = policyDigest
  }
  
  return headers
}

// =============================================================================
// AUDIT CONTEXT HELPERS
// =============================================================================

export interface AuditContext {
  policyDigest: string | null
  policyArtifactReference: string | null
  traceId: string
  spanId: string
  enterpriseId: string
  workspaceId?: string | null
}

/**
 * Build audit context object for database inserts
 */
export function buildAuditContext(
  policyContext: PolicyDigestContext | null,
  traceContext: TraceContext,
  enterpriseId: string,
  workspaceId?: string | null
): AuditContext {
  return {
    policyDigest: policyContext?.digest || null,
    policyArtifactReference: policyContext?.fullReference || null,
    traceId: traceContext.traceId,
    spanId: traceContext.spanId,
    enterpriseId,
    workspaceId
  }
}










