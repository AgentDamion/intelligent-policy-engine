-- =============================================================================
-- SECURITY VERIFICATION TEST - Day 1 RLS Hardening
-- Must be run as authenticated user with enterprise context
-- =============================================================================

-- =============================================================================
-- STEP 1: Automated Verification (Run First)
-- =============================================================================

-- This function tests all RLS protections
SELECT * FROM public.verify_rls_restrictive();

-- Expected Output:
-- test_name                | status | details
-- -------------------------+--------+--------------------------------------------------
-- Total Declarations       | INFO   | Total in DB: X, User can see: Y (Y <= X)
-- Cross-Tenant Isolation   | PASS   | RLS working correctly - no cross-tenant access
-- RESTRICTIVE Policy       | PASS   | Checking if tenant_isolation_restrictive policy is active

-- If ANY test returns FAIL, DO NOT PROCEED TO PRODUCTION

-- =============================================================================
-- STEP 2: Manual Cross-Tenant Access Test (Optional Deep Verification)
-- =============================================================================

-- Create test data (run as supabase_admin or service_role)
-- ONLY RUN THIS IN STAGING/DEV ENVIRONMENT

/*
BEGIN;

-- Insert test enterprises
INSERT INTO public.enterprises (id, name, created_at) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID, 'Test Enterprise A', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID, 'Test Enterprise B', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test partner API keys
INSERT INTO public.partner_api_keys 
  (id, partner_id, enterprise_id, key_hash, key_prefix, is_active, require_role_proof, created_at)
VALUES 
  (gen_random_uuid(), 'ppppppp1-pppp-pppp-pppp-pppppppppppp'::UUID, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID, crypt('test_key_a', gen_salt('bf')), 'pak_test_a', true, false, NOW()),
  (gen_random_uuid(), 'ppppppp2-pppp-pppp-pppp-pppppppppppp'::UUID, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID, crypt('test_key_b', gen_salt('bf')), 'pak_test_b', true, false, NOW())
ON CONFLICT DO NOTHING;

-- Insert test declarations
INSERT INTO public.asset_declarations 
  (id, file_hash, file_name, partner_id, enterprise_id, validation_status, aggregated_risk_tier, declared_at)
VALUES 
  (gen_random_uuid(), 'sha256_test_a1', 'file_enterprise_a.mp4', 'ppppppp1-pppp-pppp-pppp-pppppppppppp'::UUID, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID, 'compliant', 'LOW', NOW()),
  (gen_random_uuid(), 'sha256_test_b1', 'file_enterprise_b.mp4', 'ppppppp2-pppp-pppp-pppp-pppppppppppp'::UUID, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID, 'compliant', 'MEDIUM', NOW())
ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================================================
-- TEST 1: Verify as Enterprise A User
-- =============================================================================

-- Simulate authenticated user from Enterprise A
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', 
  '{"sub": "user_enterprise_a", "app_metadata": {"enterprise_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}}', 
  true);

-- Set context for Enterprise A
SELECT public.set_current_context(
  'ppppppp1-pppp-pppp-pppp-pppppppppppp'::UUID,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID
);

-- Should ONLY return enterprise_a data
SELECT 
  file_name,
  enterprise_id,
  '✅ Should see ONLY Enterprise A data' as test_expectation
FROM public.asset_declarations;

-- Expected: 1 row with file_name = 'file_enterprise_a.mp4'

-- This should return FALSE (cannot access Enterprise B)
SELECT 
  EXISTS(
    SELECT 1 FROM public.asset_declarations 
    WHERE file_name = 'file_enterprise_b.mp4'
  ) as can_access_enterprise_b,
  '❌ Should be FALSE - cannot see Enterprise B' as test_expectation;

-- Expected: FALSE

-- =============================================================================
-- TEST 2: Verify as Enterprise B User
-- =============================================================================

-- Switch to Enterprise B context
SELECT set_config('request.jwt.claims', 
  '{"sub": "user_enterprise_b", "app_metadata": {"enterprise_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}}', 
  true);

SELECT public.set_current_context(
  'ppppppp2-pppp-pppp-pppp-pppppppppppp'::UUID,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID
);

-- Should ONLY see Enterprise B data
SELECT 
  file_name,
  enterprise_id,
  '✅ Should see ONLY Enterprise B data' as test_expectation
FROM public.asset_declarations;

-- Expected: 1 row with file_name = 'file_enterprise_b.mp4'

-- This should return FALSE (cannot access Enterprise A)
SELECT 
  EXISTS(
    SELECT 1 FROM public.asset_declarations 
    WHERE file_name = 'file_enterprise_a.mp4'
  ) as can_access_enterprise_a,
  '❌ Should be FALSE - cannot see Enterprise A' as test_expectation;

-- Expected: FALSE

-- =============================================================================
-- TEST 3: Unauthorized Context Switch (Should FAIL)
-- =============================================================================

-- Attempt to set context for Enterprise A while authenticated as Enterprise B user
-- This should raise SECURITY_VIOLATION error

SELECT public.set_current_context(
  'ppppppp1-pppp-pppp-pppp-pppppppppppp'::UUID,  -- Partner for Enterprise A
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID   -- Enterprise A ID
);

-- Expected: ERROR: SECURITY_VIOLATION: Unauthorized context switch attempt
-- The error should be logged to agent_activities with severity='critical'

-- =============================================================================
-- TEST 4: Verify Security Event Logging
-- =============================================================================

-- Check that unauthorized access attempts are logged
SELECT 
  created_at,
  action,
  severity,
  details->>'attempted_partner_id' as attempted_partner,
  details->>'attempted_enterprise_id' as attempted_enterprise,
  details->>'user_id' as attacker_user_id,
  '🔴 CRITICAL: Security violation detected and logged' as alert
FROM public.agent_activities
WHERE action = 'unauthorized_context_switch_attempt'
  AND severity = 'critical'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Expected: At least 1 row showing the failed context switch attempt from TEST 3

-- =============================================================================
-- CLEANUP (After Verification Passes)
-- =============================================================================

-- Only run cleanup after all tests pass
-- DELETE FROM public.asset_declarations 
-- WHERE file_hash IN ('sha256_test_a1', 'sha256_test_b1');

-- DELETE FROM public.partner_api_keys 
-- WHERE key_prefix IN ('pak_test_a', 'pak_test_b');

-- DELETE FROM public.enterprises 
-- WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
*/

-- =============================================================================
-- PRODUCTION DEPLOYMENT CHECKLIST
-- =============================================================================

/*
✅ BEFORE DEPLOYING TO PRODUCTION:

1. [ ] Run verify_rls_restrictive() - all tests must PASS
2. [ ] Run manual cross-tenant access tests in staging - all should be blocked
3. [ ] Verify no "SECURITY_VIOLATION" errors in application logs
4. [ ] Test partner declaration flow still works
5. [ ] Test enterprise dashboard shows only their data
6. [ ] Verify unauthorized context switches are logged with severity='critical'
7. [ ] Set up monitoring alerts for agent_activities where severity='critical'
8. [ ] Document rollback procedure for on-call team
9. [ ] Backup current database before migration
10. [ ] Schedule deployment during low-traffic window

❌ DO NOT DEPLOY IF:
- Any verify_rls_restrictive() test returns FAIL
- Cross-tenant data access is possible in staging
- Application functionality is broken after staging deployment
- Security event logging is not working

🚨 POST-DEPLOYMENT MONITORING (First 48 Hours):
- Monitor agent_activities for unauthorized_context_switch_attempt events
- Alert on ANY cross-tenant access attempts (should be ZERO)
- Track application error rates for unexpected RLS denials
- Review Supabase logs for policy evaluation performance issues
*/
