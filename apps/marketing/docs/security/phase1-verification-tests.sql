-- =============================================================================
-- PHASE 1 CRITICAL TABLES RLS - VERIFICATION TEST SUITE
-- =============================================================================
-- Run these tests after deploying Phase 1 RLS migration
-- All tests must PASS before considering deployment successful
-- =============================================================================

-- =============================================================================
-- TEST 1: Verify RESTRICTIVE Policies Exist
-- =============================================================================

SELECT 
  '1. RESTRICTIVE Policies Verification' as test_suite,
  * 
FROM verify_phase1_critical_rls();

-- Expected: All 4 tables show "PASS: Policy + Index active"
-- FAIL if any table shows "WARN" or "FAIL"

-- =============================================================================
-- TEST 2: Cross-Tenant Isolation - Setup Test Data
-- =============================================================================

-- Create test enterprises
INSERT INTO public.enterprises (id, name, created_at) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test Enterprise Alpha', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Test Enterprise Beta', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test API keys
INSERT INTO public.partner_api_keys 
  (id, partner_id, enterprise_id, key_hash, key_prefix, is_active, created_at)
VALUES 
  (
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'test_hash_alpha',
    'pak_alpha_',
    true,
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'test_hash_beta',
    'pak_beta_',
    true,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create test middleware requests
INSERT INTO public.middleware_requests
  (id, enterprise_id, partner_id, model, policy_decision, created_at)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'gpt-4',
    'allow',
    NOW()
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'gpt-4',
    'block',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create test trusted issuers
INSERT INTO public.trusted_issuers
  (id, partner_id, issuer_did, status, created_at)
VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'did:example:alpha',
    'active',
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'did:example:beta',
    'active',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create test agent activities
INSERT INTO public.agent_activities
  (agent, action, enterprise_id, created_at)
VALUES
  (
    'TestAgent',
    'test_action',
    '00000000-0000-0000-0000-000000000001',
    NOW()
  ),
  (
    'TestAgent',
    'test_action',
    '00000000-0000-0000-0000-000000000002',
    NOW()
  );

-- =============================================================================
-- TEST 3: Cross-Tenant Isolation - partner_api_keys
-- =============================================================================

-- Set context to Enterprise Alpha
SELECT set_current_context(
  '20000000-0000-0000-0000-000000000001'::UUID,
  '00000000-0000-0000-0000-000000000001'::UUID
);

-- Test: Should ONLY see Enterprise Alpha keys
SELECT 
  '3a. partner_api_keys - Can see own enterprise' as test_name,
  COUNT(*) as visible_keys,
  CASE 
    WHEN COUNT(*) = 1 AND key_prefix = 'pak_alpha_' THEN 'PASS'
    ELSE 'FAIL: Expected 1 alpha key, got ' || COUNT(*)::TEXT
  END as result
FROM public.partner_api_keys
WHERE id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
)
GROUP BY key_prefix;

-- Test: Should NOT see Enterprise Beta keys
SELECT 
  '3b. partner_api_keys - Cannot see other enterprise' as test_name,
  COUNT(*) as beta_keys_visible,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: Cross-tenant isolation working'
    ELSE 'FAIL: Can see ' || COUNT(*)::TEXT || ' keys from other enterprise'
  END as result
FROM public.partner_api_keys
WHERE enterprise_id = '00000000-0000-0000-0000-000000000002';

-- =============================================================================
-- TEST 4: Cross-Tenant Isolation - middleware_requests
-- =============================================================================

-- Test: Should ONLY see Enterprise Alpha requests
SELECT 
  '4a. middleware_requests - Can see own enterprise' as test_name,
  COUNT(*) as visible_requests,
  CASE 
    WHEN COUNT(*) = 1 THEN 'PASS'
    ELSE 'FAIL: Expected 1 request, got ' || COUNT(*)::TEXT
  END as result
FROM public.middleware_requests
WHERE id IN (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002'
);

-- Test: Should NOT see Enterprise Beta requests
SELECT 
  '4b. middleware_requests - Cannot see other enterprise' as test_name,
  COUNT(*) as beta_requests_visible,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: Cross-tenant isolation working'
    ELSE 'FAIL: Can see ' || COUNT(*)::TEXT || ' requests from other enterprise'
  END as result
FROM public.middleware_requests
WHERE enterprise_id = '00000000-0000-0000-0000-000000000002';

-- =============================================================================
-- TEST 5: Cross-Tenant Isolation - trusted_issuers
-- =============================================================================

-- Test: Should ONLY see Enterprise Alpha issuers
SELECT 
  '5a. trusted_issuers - Can see own enterprise' as test_name,
  COUNT(*) as visible_issuers,
  CASE 
    WHEN COUNT(*) = 1 THEN 'PASS'
    ELSE 'FAIL: Expected 1 issuer, got ' || COUNT(*)::TEXT
  END as result
FROM public.trusted_issuers
WHERE id IN (
  '40000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000002'
);

-- Test: Should NOT see Enterprise Beta issuers
SELECT 
  '5b. trusted_issuers - Cannot see other enterprise' as test_name,
  COUNT(*) as beta_issuers_visible,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: Cross-tenant isolation working'
    ELSE 'FAIL: Can see ' || COUNT(*)::TEXT || ' issuers from other enterprise'
  END as result
FROM public.trusted_issuers
WHERE partner_id = '20000000-0000-0000-0000-000000000002';

-- =============================================================================
-- TEST 6: Cross-Tenant Isolation - agent_activities
-- =============================================================================

-- Test: Should ONLY see Enterprise Alpha activities
SELECT 
  '6a. agent_activities - Can see own enterprise' as test_name,
  COUNT(*) as visible_activities,
  CASE 
    WHEN COUNT(*) >= 1 THEN 'PASS'
    ELSE 'FAIL: Expected at least 1 activity, got ' || COUNT(*)::TEXT
  END as result
FROM public.agent_activities
WHERE enterprise_id = '00000000-0000-0000-0000-000000000001'
  AND created_at > NOW() - INTERVAL '1 hour';

-- Test: Should NOT see Enterprise Beta activities
SELECT 
  '6b. agent_activities - Cannot see other enterprise' as test_name,
  COUNT(*) as beta_activities_visible,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: Cross-tenant isolation working'
    ELSE 'FAIL: Can see ' || COUNT(*)::TEXT || ' activities from other enterprise'
  END as result
FROM public.agent_activities
WHERE enterprise_id = '00000000-0000-0000-0000-000000000002';

-- =============================================================================
-- TEST 7: Index Usage Verification
-- =============================================================================

-- Test: Verify indexes are being used (not sequential scans)
SELECT 
  '7. Index Usage' as test_suite,
  schemaname,
  tablename,
  indexname,
  idx_scan,
  CASE 
    WHEN idx_scan > 0 THEN 'PASS: Index is being used'
    ELSE 'WARN: Index not yet used (may need warm-up)'
  END as result
FROM pg_stat_user_indexes
WHERE indexname LIKE '%_rls_lookup'
ORDER BY tablename;

-- =============================================================================
-- TEST 8: Performance Check
-- =============================================================================

-- Test: Query performance should be < 50ms
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) 
FROM public.partner_api_keys 
WHERE enterprise_id = '00000000-0000-0000-0000-000000000001';

-- Review "Execution Time" in output - should be < 50ms
-- Review "Seq Scan" vs "Index Scan" - should use Index Scan

-- =============================================================================
-- TEST 9: Security Event Logging
-- =============================================================================

-- Test: Verify no unauthorized context switch attempts
SELECT 
  '9. Security Events' as test_name,
  COUNT(*) as violation_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: No security violations'
    ELSE 'WARN: ' || COUNT(*)::TEXT || ' security violations detected'
  END as result
FROM public.agent_activities
WHERE action = 'unauthorized_context_switch_attempt'
  AND created_at > NOW() - INTERVAL '24 hours';

-- =============================================================================
-- CLEANUP: Remove Test Data
-- =============================================================================

-- Only run cleanup after all tests PASS

DELETE FROM public.agent_activities 
WHERE enterprise_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
AND agent = 'TestAgent';

DELETE FROM public.trusted_issuers 
WHERE id IN (
  '40000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000002'
);

DELETE FROM public.middleware_requests 
WHERE id IN (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002'
);

DELETE FROM public.partner_api_keys 
WHERE id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
);

DELETE FROM public.enterprises 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);

-- =============================================================================
-- TEST SUMMARY
-- =============================================================================

-- Run this to get a summary of all test results
SELECT 
  'PHASE 1 DEPLOYMENT TEST SUMMARY' as summary,
  'All tests must show PASS for deployment to be considered successful' as requirement;

-- Expected Results:
-- Test 1: All 4 tables PASS (policy + index active)
-- Test 3a: PASS (can see own enterprise)
-- Test 3b: PASS (cannot see other enterprise)
-- Test 4a: PASS (can see own requests)
-- Test 4b: PASS (cannot see other requests)
-- Test 5a: PASS (can see own issuers)
-- Test 5b: PASS (cannot see other issuers)
-- Test 6a: PASS (can see own activities)
-- Test 6b: PASS (cannot see other activities)
-- Test 7: PASS or WARN (index usage)
-- Test 8: < 50ms execution time
-- Test 9: PASS (no violations)

-- If ANY test shows FAIL, DO NOT proceed to production
-- Investigate and fix issues before continuing
