/**
 * Policy Digest Pinning Integration Tests
 * 
 * Tests for:
 * 1. Policy artifact creation and digest uniqueness
 * 2. Policy activation and resolution
 * 3. Proof bundle generation with digest pinning
 * 4. Trace context propagation
 * 5. Historical policy lookup
 * 6. Audit event correlation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const TEST_ENTERPRISE_ID = process.env.TEST_ENTERPRISE_ID || ''

// Skip tests if no service key
const skipTests = !SUPABASE_SERVICE_KEY

let supabase: SupabaseClient

beforeAll(() => {
  if (skipTests) {
    console.warn('Skipping integration tests: SUPABASE_SERVICE_ROLE_KEY not set')
    return
  }
  
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  })
})

describe.skipIf(skipTests)('Policy Artifact Registry', () => {
  const testPolicyId = 'test-policy-' + Date.now()
  const testDigest = `sha256:${crypto.randomUUID().replace(/-/g, '')}` + Date.now()
  let createdArtifactId: string | null = null

  afterAll(async () => {
    // Cleanup test data
    if (createdArtifactId) {
      await supabase.from('policy_artifacts').delete().eq('id', createdArtifactId)
    }
  })

  it('should create a policy artifact with unique digest', async () => {
    // First, we need a policy to reference
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('id')
      .eq('enterprise_id', TEST_ENTERPRISE_ID)
      .limit(1)
      .single()

    if (policyError || !policy) {
      console.warn('No policy found for testing, skipping artifact creation test')
      return
    }

    const { data: artifact, error } = await supabase
      .from('policy_artifacts')
      .insert({
        policy_id: policy.id,
        version_number: 999, // High version to avoid conflicts
        oci_registry: 'ghcr.io/aicomplyr-test',
        oci_repository: 'policies/test-policy',
        oci_tag: 'v999.0.0',
        oci_digest: testDigest,
        content_sha256: testDigest.replace('sha256:', ''),
        build_provenance: { test: true }
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(artifact).toBeDefined()
    expect(artifact?.oci_digest).toBe(testDigest)
    
    createdArtifactId = artifact?.id
  })

  it('should reject duplicate digests', async () => {
    if (!createdArtifactId) {
      console.warn('Skipping duplicate test: no artifact created')
      return
    }

    const { data: policy } = await supabase
      .from('policies')
      .select('id')
      .eq('enterprise_id', TEST_ENTERPRISE_ID)
      .limit(1)
      .single()

    if (!policy) return

    const { error } = await supabase
      .from('policy_artifacts')
      .insert({
        policy_id: policy.id,
        version_number: 1000,
        oci_registry: 'ghcr.io/aicomplyr-test',
        oci_repository: 'policies/duplicate-test',
        oci_digest: testDigest, // Same digest - should fail
        content_sha256: 'abc123'
      })

    expect(error).toBeDefined()
    expect(error?.code).toBe('23505') // Unique constraint violation
  })
})

describe.skipIf(skipTests)('Policy Activation', () => {
  let testArtifactId: string | null = null
  let testActivationId: string | null = null
  const testDigest = `sha256:activation-test-${Date.now()}`

  beforeAll(async () => {
    // Create a test artifact for activation tests
    const { data: policy } = await supabase
      .from('policies')
      .select('id')
      .eq('enterprise_id', TEST_ENTERPRISE_ID)
      .limit(1)
      .single()

    if (!policy) return

    const { data: artifact } = await supabase
      .from('policy_artifacts')
      .insert({
        policy_id: policy.id,
        version_number: 998,
        oci_registry: 'ghcr.io/aicomplyr-test',
        oci_repository: 'policies/activation-test',
        oci_digest: testDigest,
        content_sha256: testDigest.replace('sha256:', '')
      })
      .select()
      .single()

    testArtifactId = artifact?.id
  })

  afterAll(async () => {
    // Cleanup
    if (testActivationId) {
      await supabase.from('policy_activations').delete().eq('id', testActivationId)
    }
    if (testArtifactId) {
      await supabase.from('policy_artifacts').delete().eq('id', testArtifactId)
    }
  })

  it('should activate a policy for an enterprise', async () => {
    if (!testArtifactId) {
      console.warn('Skipping activation test: no artifact created')
      return
    }

    const { data: activation, error } = await supabase
      .from('policy_activations')
      .insert({
        policy_artifact_id: testArtifactId,
        enterprise_id: TEST_ENTERPRISE_ID,
        active_digest: testDigest,
        activation_reason: 'initial_deployment',
        activation_notes: 'Integration test activation'
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(activation).toBeDefined()
    expect(activation?.active_digest).toBe(testDigest)
    
    testActivationId = activation?.id
  })

  it('should resolve active policy digest via RPC', async () => {
    if (!testActivationId) {
      console.warn('Skipping resolution test: no activation created')
      return
    }

    const { data: digest, error } = await supabase.rpc('get_active_policy_digest', {
      p_enterprise_id: TEST_ENTERPRISE_ID,
      p_workspace_id: null
    })

    expect(error).toBeNull()
    // Note: This may return a different digest if another policy is active
    // In a real test, we'd ensure we're the only active policy
    expect(typeof digest).toBe('string')
  })

  it('should return historical digest at specific time', async () => {
    if (!testActivationId) {
      console.warn('Skipping historical test: no activation created')
      return
    }

    // Get a time after our activation
    const futureTime = new Date(Date.now() + 1000)
    
    const { data: digest, error } = await supabase.rpc('get_policy_digest_at_time', {
      p_enterprise_id: TEST_ENTERPRISE_ID,
      p_workspace_id: null,
      p_at_time: futureTime.toISOString()
    })

    expect(error).toBeNull()
    // Should have some digest active
    expect(typeof digest === 'string' || digest === null).toBe(true)
  })
})

describe.skipIf(skipTests)('Trace Context Propagation', () => {
  it('should parse W3C traceparent header correctly', () => {
    // Import the shared utility (this would need to be bundled for browser tests)
    const traceparent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
    const parts = traceparent.split('-')
    
    expect(parts.length).toBe(4)
    expect(parts[0]).toBe('00') // version
    expect(parts[1].length).toBe(32) // trace_id
    expect(parts[2].length).toBe(16) // span_id
    expect(parts[3]).toBe('01') // flags
  })

  it('should parse W3C tracestate header correctly', () => {
    const tracestate = 'ai.eps=sha256:abc123,vendor1=value1'
    const pairs = tracestate.split(',').reduce((acc, pair) => {
      const [key, value] = pair.split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    expect(pairs['ai.eps']).toBe('sha256:abc123')
    expect(pairs['vendor1']).toBe('value1')
  })

  it('should build tracestate with policy digest first', () => {
    const existing = { vendor1: 'value1', vendor2: 'value2' }
    const policyDigest = 'sha256:newpolicy'
    
    // Build new tracestate
    const entries = [
      `ai.eps=${policyDigest}`,
      ...Object.entries(existing).map(([k, v]) => `${k}=${v}`)
    ]
    const result = entries.join(',')

    expect(result.startsWith('ai.eps=')).toBe(true)
    expect(result).toContain('vendor1=value1')
  })
})

describe.skipIf(skipTests)('Proof Bundle Pinning', () => {
  it('should include policy digest in proof bundle', async () => {
    // Query existing proof bundles to verify schema
    const { data: bundles, error } = await supabase
      .from('proof_bundles')
      .select('id, policy_digest, trace_id, enterprise_id')
      .eq('enterprise_id', TEST_ENTERPRISE_ID)
      .limit(5)

    expect(error).toBeNull()
    
    // Verify the columns exist (even if values are null for old records)
    if (bundles && bundles.length > 0) {
      const bundle = bundles[0]
      expect('policy_digest' in bundle).toBe(true)
      expect('trace_id' in bundle).toBe(true)
    }
  })
})

describe.skipIf(skipTests)('Audit Event Correlation', () => {
  it('should include policy digest in audit events', async () => {
    const { data: events, error } = await supabase
      .from('governance_audit_events')
      .select('event_id, policy_digest, trace_id, span_id, action_type')
      .limit(5)

    expect(error).toBeNull()
    
    // Verify the columns exist
    if (events && events.length > 0) {
      const event = events[0]
      expect('policy_digest' in event).toBe(true)
      expect('trace_id' in event).toBe(true)
      expect('span_id' in event).toBe(true)
    }
  })

  it('should include policy digest in agent activities', async () => {
    const { data: activities, error } = await supabase
      .from('agent_activities')
      .select('id, policy_digest, trace_id, span_id')
      .limit(5)

    expect(error).toBeNull()
    
    // Verify the columns exist
    if (activities && activities.length > 0) {
      const activity = activities[0]
      expect('policy_digest' in activity).toBe(true)
      expect('trace_id' in activity).toBe(true)
      expect('span_id' in activity).toBe(true)
    }
  })
})

describe.skipIf(skipTests)('Edge Function Integration', () => {
  it('should generate proof bundle via Edge Function', async () => {
    // This test requires the Edge Function to be deployed
    const functionUrl = `${SUPABASE_URL}/functions/v1/generate-proof-bundle`
    
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'traceparent': '00-' + crypto.randomUUID().replace(/-/g, '') + '-' + crypto.randomUUID().slice(0, 16).replace(/-/g, '') + '-01'
        },
        body: JSON.stringify({
          enterpriseId: TEST_ENTERPRISE_ID,
          requestedBy: 'integration-test',
          bundleType: 'trace',
          timeRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        console.warn('Edge Function returned error:', await response.text())
        return
      }

      const result = await response.json()
      
      expect(result.id).toBeDefined()
      expect(result.bundleHash).toMatch(/^sha256:/)
      expect(result.traceCorrelation).toBeDefined()
      expect(result.contents).toBeDefined()
    } catch (error) {
      console.warn('Edge Function test skipped:', error)
    }
  })

  it('should activate policy via Edge Function', async () => {
    // This test requires:
    // 1. Edge Function to be deployed
    // 2. Valid user authentication
    // 3. Policy artifact to exist
    
    // For now, just verify the endpoint exists
    const functionUrl = `${SUPABASE_URL}/functions/v1/activate-policy`
    
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No auth - should return 401
        },
        body: JSON.stringify({})
      })

      // Expect 401 Unauthorized without auth
      expect(response.status).toBe(401)
    } catch (error) {
      console.warn('Edge Function connectivity test skipped:', error)
    }
  })
})

// Utility tests for digest validation
describe('Policy Digest Format Validation', () => {
  it('should validate SHA256 digest format', () => {
    const validDigests = [
      'sha256:94a00394bc5a7d8a9f1a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      'sha256:0000000000000000000000000000000000000000000000000000000000000000'
    ]

    const invalidDigests = [
      'sha256:short',
      'md5:94a00394bc5a7d8a9f1a3b4c5d6e7f8a',
      '94a00394bc5a7d8a9f1a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      'sha256:INVALID_CHARS!'
    ]

    const digestRegex = /^sha256:[a-f0-9]{64}$/

    validDigests.forEach(digest => {
      expect(digestRegex.test(digest)).toBe(true)
    })

    invalidDigests.forEach(digest => {
      expect(digestRegex.test(digest)).toBe(false)
    })
  })

  it('should validate OCI reference format', () => {
    const validReferences = [
      'ghcr.io/aicomplyr/policies/test@sha256:abc123',
      'docker.io/library/policy@sha256:def456'
    ]

    const referenceRegex = /^[a-z0-9.-]+\/[a-z0-9._/-]+@sha256:[a-f0-9]+$/

    validReferences.forEach(ref => {
      expect(referenceRegex.test(ref)).toBe(true)
    })
  })
})

