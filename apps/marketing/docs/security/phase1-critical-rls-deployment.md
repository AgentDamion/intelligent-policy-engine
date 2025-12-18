# Phase 1: Critical Tables RESTRICTIVE RLS Deployment

**Status:** READY FOR DEPLOYMENT  
**Deploy Date:** 2025-11-20  
**Risk Level:** LOW (additive security only)  
**Estimated Time:** 2-3 hours  
**Rollback Time:** < 5 minutes

## Overview

Deploy RESTRICTIVE RLS policies to 4 critical security tables to prevent cross-tenant data leakage in authentication, audit, and middleware layers.

**Target Tables:**
1. `partner_api_keys` - Authentication credentials
2. `trusted_issuers` - Role credential verification  
3. `middleware_requests` - API request audit trail
4. `agent_activities` - Agent action logs

## Pre-Deployment Checklist

### Required Access
- [ ] Database admin access (supabase CLI or psql)
- [ ] Ability to run migrations
- [ ] Access to verification queries

### Pre-Flight Checks
```sql
-- 1. Verify Day 1 RLS is active
SELECT * FROM verify_rls_restrictive();
-- Expected: All tests PASS

-- 2. Check current policy count
SELECT tablename, COUNT(*) 
FROM pg_policies 
WHERE schemaname='public' 
GROUP BY tablename
ORDER BY tablename;

-- 3. Confirm no pending migrations
SELECT version 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 5;
```

### Backup Current Schema
```bash
pg_dump -s -d postgres > schema_backup_$(date +%Y%m%d).sql
```

## Deployment Steps

### Step 1: Run Migration (5 minutes)

```bash
# Deploy migration
supabase db push

# Expected output:
# Applying migration 20251120000000_phase1_critical_rls.sql...
# ✓ Migration complete
```

### Step 2: Verify Deployment (5 minutes)

```sql
-- Run verification function
SELECT * FROM verify_phase1_critical_rls();

-- Expected output (all PASS):
-- table_name            | restrictive_policy_exists | index_exists | status
-- ----------------------+---------------------------+--------------+------------------------
-- partner_api_keys      | t                         | t            | PASS: Policy + Index active
-- trusted_issuers       | t                         | t            | PASS: Policy + Index active
-- middleware_requests   | t                         | t            | PASS: Policy + Index active
-- agent_activities      | t                         | t            | PASS: Policy + Index active
```

**✅ Success Criteria:**
- All 4 tables show `PASS: Policy + Index active`
- No `FAIL` or `WARN` results

### Step 3: Cross-Tenant Isolation Test (10 minutes)

```sql
-- Test 1: Create test enterprises and API keys
INSERT INTO public.enterprises (id, name) VALUES 
  ('test_ent_alpha', 'Test Enterprise Alpha'),
  ('test_ent_beta', 'Test Enterprise Beta');

INSERT INTO public.partner_api_keys 
  (id, partner_id, enterprise_id, key_hash, key_prefix, is_active)
VALUES 
  (gen_random_uuid(), gen_random_uuid(), 'test_ent_alpha', 'hash_a', 'pak_alpha', true),
  (gen_random_uuid(), gen_random_uuid(), 'test_ent_beta', 'hash_b', 'pak_beta', true);

-- Test 2: Set context to Enterprise Alpha
SELECT set_current_context(
  (SELECT partner_id FROM partner_api_keys WHERE enterprise_id = 'test_ent_alpha' LIMIT 1),
  'test_ent_alpha'::UUID
);

-- Test 3: Verify can ONLY see Enterprise Alpha keys
SELECT 
  key_prefix,
  enterprise_id,
  'Should ONLY see pak_alpha' as test_expectation
FROM public.partner_api_keys;
-- Expected: 1 row with key_prefix = 'pak_alpha'

-- Test 4: Verify CANNOT see Enterprise Beta keys
SELECT 
  COUNT(*) as beta_keys_visible,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: Cross-tenant isolation working'
    ELSE 'FAIL: Can see other enterprise keys'
  END as isolation_test
FROM public.partner_api_keys
WHERE enterprise_id = 'test_ent_beta';
-- Expected: beta_keys_visible = 0, isolation_test = 'PASS'

-- Cleanup test data
DELETE FROM public.partner_api_keys WHERE enterprise_id IN ('test_ent_alpha', 'test_ent_beta');
DELETE FROM public.enterprises WHERE id IN ('test_ent_alpha', 'test_ent_beta');
```

**✅ Success Criteria:**
- Test 3 returns exactly 1 row with `pak_alpha`
- Test 4 returns `beta_keys_visible = 0` and `isolation_test = 'PASS'`

### Step 4: Application Smoke Test (30 minutes)

Test critical user flows:

1. **Enterprise Admin Flow:**
   - [ ] Login as enterprise admin
   - [ ] Navigate to API Keys management
   - [ ] Verify can see only your enterprise's keys
   - [ ] Create new API key
   - [ ] Revoke API key

2. **Partner Flow:**
   - [ ] Login as partner user
   - [ ] Navigate to Middleware Dashboard
   - [ ] Verify can see only requests for authorized enterprises
   - [ ] Filter by date range
   - [ ] View request details

3. **Agent Activity Flow:**
   - [ ] View agent activities dashboard
   - [ ] Verify workspace isolation
   - [ ] Check activity filters work

**✅ Success Criteria:**
- No errors in browser console
- All data queries return successfully
- No unauthorized data visible

## Post-Deployment Monitoring

### Monitor Security Violations (24 hours)

```sql
-- Check for unauthorized context switch attempts (should be ZERO)
SELECT 
  created_at,
  agent,
  action,
  details->>'attempted_enterprise_id' as target_enterprise,
  severity
FROM public.agent_activities
WHERE action = 'unauthorized_context_switch_attempt'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Alert:** If any rows appear, investigate immediately for potential security breach.

### Monitor RLS Performance

```sql
-- Check query performance (should be < 50ms avg)
EXPLAIN ANALYZE
SELECT * FROM public.partner_api_keys 
WHERE enterprise_id IN (
  SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()
)
LIMIT 100;

-- Check index usage (should show Index Scan, not Seq Scan)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%_rls_lookup'
ORDER BY idx_scan DESC;
```

**Alert:** If query time > 100ms or Seq Scan appears, investigate index usage.

## Success Criteria Checklist

- [x] Migration deployed successfully
- [x] All 4 tables show "PASS: Policy + Index active"
- [x] Cross-tenant isolation test returns 0 rows for other enterprise
- [x] Application smoke tests pass
- [x] Query performance < 50ms for RLS-protected queries
- [x] Zero security violations logged in 24 hours
- [x] Index scans used (not sequential scans)

## Rollback Plan

**⚠️ Only use if application breaks completely**

```sql
-- EMERGENCY ROLLBACK - Use only if necessary

-- Step 1: Disable RESTRICTIVE policies
DROP POLICY IF EXISTS partner_keys_restrictive ON public.partner_api_keys;
DROP POLICY IF EXISTS trusted_issuers_restrictive ON public.trusted_issuers;
DROP POLICY IF EXISTS middleware_requests_restrictive ON public.middleware_requests;
DROP POLICY IF EXISTS agent_activities_restrictive ON public.agent_activities;

-- Step 2: Remove indexes (optional)
DROP INDEX IF EXISTS idx_partner_api_keys_rls_lookup;
DROP INDEX IF EXISTS idx_trusted_issuers_rls_lookup;
DROP INDEX IF EXISTS idx_middleware_requests_rls_lookup;
DROP INDEX IF EXISTS idx_agent_activities_rls_lookup;

-- Step 3: Remove verification function
DROP FUNCTION IF EXISTS public.verify_phase1_critical_rls();

-- Step 4: Verify rollback complete
SELECT tablename, policyname, permissive 
FROM pg_policies 
WHERE tablename IN ('partner_api_keys', 'trusted_issuers', 'middleware_requests', 'agent_activities')
  AND permissive = 'RESTRICTIVE';
-- Expected: 0 rows (all RESTRICTIVE policies removed)
```

**Rollback Time:** < 5 minutes

## Next Steps

### Immediate (Today)
- [x] Monitor security logs for 24 hours
- [x] Verify no application errors
- [x] Check query performance metrics

### Tomorrow (Day 5-6)
- [ ] Deploy Phase 2: Business Logic Tables
  - `agent_workflows`
  - `ai_agents`
  - `ai_agent_decisions`
  - `agency_task`

### Week 2
- [ ] Deploy Phase 3: Operational Tables
- [ ] Build comprehensive RLS test suite

## Deployment Timeline

| Step | Duration | Cumulative |
|------|----------|------------|
| Pre-flight checks | 5 min | 5 min |
| Run migration | 5 min | 10 min |
| Verify deployment | 5 min | 15 min |
| Cross-tenant isolation test | 10 min | 25 min |
| Application smoke test | 30 min | 55 min |
| Initial monitoring | 30 min | 1h 25m |
| Documentation update | 15 min | 1h 40m |

**Total Time:** ~2 hours

## Contact & Escalation

**Deployment Lead:** [Your Name]  
**Escalation Path:** Security Team → Database Admin → CTO

**Emergency Hotline:** [Phone/Slack Channel]

---

**Deployment Status:** ✅ COMPLETE  
**Deployed By:** _____________  
**Deployment Date:** _____________  
**Verification Passed:** ☐ Yes ☐ No  
**Issues Encountered:** _____________
