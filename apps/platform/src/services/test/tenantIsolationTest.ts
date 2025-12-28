/**
 * Tenant Isolation Test Suite
 * 
 * Week 12: Multi-Tenancy Validation
 * Tests for cross-tenant data isolation.
 * 
 * Run these tests as part of security audit process.
 */

import { supabase } from '@/lib/supabase'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface TestResult {
  testName: string
  passed: boolean
  duration: number
  details: Record<string, unknown>
  error?: string
}

export interface TestSuiteResult {
  suiteName: string
  runAt: Date
  totalTests: number
  passedTests: number
  failedTests: number
  duration: number
  results: TestResult[]
}

// ============================================================
// TEST FUNCTIONS
// ============================================================

/**
 * Run all tenant isolation tests
 */
export async function runTenantIsolationTests(
  enterpriseId: string
): Promise<TestSuiteResult> {
  const startTime = Date.now()
  const results: TestResult[] = []
  
  // Test 1: Database-level isolation via RPC
  results.push(await testDatabaseIsolation(enterpriseId))
  
  // Test 2: Governance threads isolation
  results.push(await testGovernanceThreadsIsolation(enterpriseId))
  
  // Test 3: Proof bundles isolation
  results.push(await testProofBundlesIsolation(enterpriseId))
  
  // Test 4: Signing keys isolation
  results.push(await testSigningKeysIsolation(enterpriseId))
  
  // Test 5: Partner data isolation
  results.push(await testPartnerDataIsolation(enterpriseId))
  
  // Test 6: Workspace isolation
  results.push(await testWorkspaceIsolation(enterpriseId))
  
  const passedTests = results.filter(r => r.passed).length
  
  return {
    suiteName: 'Tenant Isolation',
    runAt: new Date(),
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    duration: Date.now() - startTime,
    results,
  }
}

/**
 * Test database-level isolation using the test_tenant_isolation RPC
 */
async function testDatabaseIsolation(enterpriseId: string): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const { data, error } = await supabase.rpc('test_tenant_isolation', {
      p_test_enterprise_id: enterpriseId,
    })
    
    if (error) {
      return {
        testName: 'Database Isolation RPC',
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        error: error.message,
      }
    }
    
    const allPassed = (data || []).every(
      (r: { test_result: string }) => r.test_result === 'passed' || r.test_result === 'skipped'
    )
    
    return {
      testName: 'Database Isolation RPC',
      passed: allPassed,
      duration: Date.now() - startTime,
      details: { rpcResults: data },
    }
  } catch (err) {
    return {
      testName: 'Database Isolation RPC',
      passed: false,
      duration: Date.now() - startTime,
      details: {},
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Test that governance threads from other enterprises are not visible
 */
async function testGovernanceThreadsIsolation(enterpriseId: string): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    // Query all threads - should only see our enterprise's threads
    const { data, error } = await supabase
      .from('governance_threads')
      .select('enterprise_id')
      .limit(100)
    
    if (error) {
      return {
        testName: 'Governance Threads Isolation',
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        error: error.message,
      }
    }
    
    // Check that all returned threads belong to our enterprise
    const otherEnterpriseThreads = (data || []).filter(
      (t: { enterprise_id: string }) => t.enterprise_id !== enterpriseId
    )
    
    return {
      testName: 'Governance Threads Isolation',
      passed: otherEnterpriseThreads.length === 0,
      duration: Date.now() - startTime,
      details: {
        totalThreadsVisible: data?.length || 0,
        otherEnterpriseThreads: otherEnterpriseThreads.length,
      },
    }
  } catch (err) {
    return {
      testName: 'Governance Threads Isolation',
      passed: false,
      duration: Date.now() - startTime,
      details: {},
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Test that proof bundles from other enterprises are not visible
 */
async function testProofBundlesIsolation(enterpriseId: string): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const { data, error } = await supabase
      .from('proof_bundles')
      .select('enterprise_id')
      .limit(100)
    
    if (error) {
      return {
        testName: 'Proof Bundles Isolation',
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        error: error.message,
      }
    }
    
    const otherEnterpriseBundles = (data || []).filter(
      (b: { enterprise_id: string }) => b.enterprise_id !== enterpriseId
    )
    
    return {
      testName: 'Proof Bundles Isolation',
      passed: otherEnterpriseBundles.length === 0,
      duration: Date.now() - startTime,
      details: {
        totalBundlesVisible: data?.length || 0,
        otherEnterpriseBundles: otherEnterpriseBundles.length,
      },
    }
  } catch (err) {
    return {
      testName: 'Proof Bundles Isolation',
      passed: false,
      duration: Date.now() - startTime,
      details: {},
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Test that signing keys from other enterprises are not visible
 */
async function testSigningKeysIsolation(enterpriseId: string): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const { data, error } = await supabase
      .from('enterprise_signing_keys')
      .select('enterprise_id')
      .limit(100)
    
    if (error) {
      return {
        testName: 'Signing Keys Isolation',
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        error: error.message,
      }
    }
    
    const otherEnterpriseKeys = (data || []).filter(
      (k: { enterprise_id: string }) => k.enterprise_id !== enterpriseId
    )
    
    return {
      testName: 'Signing Keys Isolation',
      passed: otherEnterpriseKeys.length === 0,
      duration: Date.now() - startTime,
      details: {
        totalKeysVisible: data?.length || 0,
        otherEnterpriseKeys: otherEnterpriseKeys.length,
      },
    }
  } catch (err) {
    return {
      testName: 'Signing Keys Isolation',
      passed: false,
      duration: Date.now() - startTime,
      details: {},
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Test partner data isolation (partners linked to enterprise)
 */
async function testPartnerDataIsolation(enterpriseId: string): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    // Get enterprise's partners
    const { data: ourPartners } = await supabase
      .from('partners')
      .select('id')
      .eq('enterprise_id', enterpriseId)
    
    // Query partner_attestations - should only see our partners
    const { data: attestations, error } = await supabase
      .from('partner_attestations')
      .select('partner_id')
      .limit(100)
    
    if (error) {
      return {
        testName: 'Partner Data Isolation',
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        error: error.message,
      }
    }
    
    const ourPartnerIds = new Set((ourPartners || []).map(p => p.id))
    const otherPartnerAttestations = (attestations || []).filter(
      (a: { partner_id: string }) => !ourPartnerIds.has(a.partner_id)
    )
    
    return {
      testName: 'Partner Data Isolation',
      passed: otherPartnerAttestations.length === 0,
      duration: Date.now() - startTime,
      details: {
        ourPartnersCount: ourPartnerIds.size,
        totalAttestationsVisible: attestations?.length || 0,
        otherPartnerAttestations: otherPartnerAttestations.length,
      },
    }
  } catch (err) {
    return {
      testName: 'Partner Data Isolation',
      passed: false,
      duration: Date.now() - startTime,
      details: {},
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Test workspace isolation
 */
async function testWorkspaceIsolation(enterpriseId: string): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .select('enterprise_id')
      .limit(100)
    
    if (error) {
      return {
        testName: 'Workspace Isolation',
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        error: error.message,
      }
    }
    
    const otherEnterpriseWorkspaces = (data || []).filter(
      (w: { enterprise_id: string }) => w.enterprise_id !== enterpriseId
    )
    
    return {
      testName: 'Workspace Isolation',
      passed: otherEnterpriseWorkspaces.length === 0,
      duration: Date.now() - startTime,
      details: {
        totalWorkspacesVisible: data?.length || 0,
        otherEnterpriseWorkspaces: otherEnterpriseWorkspaces.length,
      },
    }
  } catch (err) {
    return {
      testName: 'Workspace Isolation',
      passed: false,
      duration: Date.now() - startTime,
      details: {},
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// ============================================================
// PERFORMANCE TESTS
// ============================================================

/**
 * Run performance tests for decision latency
 */
export async function runPerformanceTests(
  enterpriseId: string,
  options: { targetDecisionsPerHour?: number; durationSeconds?: number } = {}
): Promise<TestSuiteResult> {
  const { targetDecisionsPerHour = 1000, durationSeconds = 60 } = options
  const startTime = Date.now()
  const results: TestResult[] = []
  
  // Test 1: Query latency
  results.push(await testQueryLatency(enterpriseId))
  
  // Test 2: Concurrent context switching
  results.push(await testConcurrentContextSwitching(enterpriseId))
  
  // Test 3: Proof bundle generation latency
  results.push(await testProofBundleGenerationLatency(enterpriseId))
  
  const passedTests = results.filter(r => r.passed).length
  
  return {
    suiteName: 'Performance',
    runAt: new Date(),
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    duration: Date.now() - startTime,
    results,
  }
}

async function testQueryLatency(enterpriseId: string): Promise<TestResult> {
  const startTime = Date.now()
  const latencies: number[] = []
  const iterations = 10
  
  try {
    for (let i = 0; i < iterations; i++) {
      const queryStart = Date.now()
      await supabase
        .from('governance_threads')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .limit(10)
      latencies.push(Date.now() - queryStart)
    }
    
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
    const maxLatency = Math.max(...latencies)
    
    return {
      testName: 'Query Latency',
      passed: avgLatency < 100 && maxLatency < 500, // Target: <100ms avg, <500ms max
      duration: Date.now() - startTime,
      details: {
        averageLatencyMs: avgLatency,
        maxLatencyMs: maxLatency,
        minLatencyMs: Math.min(...latencies),
        iterations,
      },
    }
  } catch (err) {
    return {
      testName: 'Query Latency',
      passed: false,
      duration: Date.now() - startTime,
      details: { latencies },
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function testConcurrentContextSwitching(enterpriseId: string): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    // Simulate concurrent context queries
    const concurrentRequests = 10
    const promises = Array(concurrentRequests).fill(null).map(() =>
      supabase
        .from('enterprise_members')
        .select('*')
        .eq('enterprise_id', enterpriseId)
    )
    
    const results = await Promise.all(promises)
    const successCount = results.filter(r => !r.error).length
    
    return {
      testName: 'Concurrent Context Switching',
      passed: successCount === concurrentRequests,
      duration: Date.now() - startTime,
      details: {
        concurrentRequests,
        successCount,
        failureCount: concurrentRequests - successCount,
      },
    }
  } catch (err) {
    return {
      testName: 'Concurrent Context Switching',
      passed: false,
      duration: Date.now() - startTime,
      details: {},
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function testProofBundleGenerationLatency(enterpriseId: string): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    // Query proof bundles to measure read latency
    const queryStart = Date.now()
    const { data, error } = await supabase
      .from('proof_bundles')
      .select('*, proof_bundle_artifacts(*)')
      .eq('enterprise_id', enterpriseId)
      .limit(5)
    
    const latency = Date.now() - queryStart
    
    return {
      testName: 'Proof Bundle Query Latency',
      passed: latency < 200, // Target: <200ms
      duration: Date.now() - startTime,
      details: {
        queryLatencyMs: latency,
        bundlesReturned: data?.length || 0,
        hasError: !!error,
      },
    }
  } catch (err) {
    return {
      testName: 'Proof Bundle Query Latency',
      passed: false,
      duration: Date.now() - startTime,
      details: {},
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export default {
  runTenantIsolationTests,
  runPerformanceTests,
}

