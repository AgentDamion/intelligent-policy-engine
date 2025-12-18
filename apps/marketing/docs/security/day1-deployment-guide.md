# Day 1 Security Hardening - Deployment Guide

## 🚀 Quick Deployment (30 minutes)

### Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Database backup completed
- Access to production database credentials
- Staging environment tested (recommended)

---

## Step 1: Create Migration (5 minutes)

```bash
# Navigate to project root
cd /path/to/aicomply-platform

# Create new migration
supabase migration new day1_rls_security_hardening

# This will create a file like:
# supabase/migrations/20251120000000_day1_rls_security_hardening.sql

# Copy the SQL from docs/security/day1-migration-rls-hardening.sql into this file
```

---

## Step 2: Test in Local/Staging (10 minutes)

```bash
# Start local Supabase (if testing locally)
supabase start

# Apply migration
supabase db push

# Run verification
supabase db query "SELECT * FROM public.verify_rls_restrictive();"

# Expected output:
# test_name              | status | details
# -----------------------+--------+------------------------------------------
# Total Declarations     | INFO   | Total in DB: X, User can see: Y
# Cross-Tenant Isolation | PASS   | RLS working correctly...
# RESTRICTIVE Policy     | PASS   | Checking if tenant_isolation_restrictive...

# If ANY test shows FAIL, DO NOT proceed to production
```

---

## Step 3: Deploy to Production (5 minutes)

```bash
# Link to production project
supabase link --project-ref [your-project-ref]

# Apply migration to production
supabase db push

# Verify deployment
supabase db query "
  SELECT policyname, cmd, permissive 
  FROM pg_policies 
  WHERE tablename = 'asset_declarations' 
  AND policyname = 'tenant_isolation_restrictive';
"

# Expected: 1 row with cmd='*' and permissive='NO'
```

---

## Step 4: Deploy Edge Function Updates (5 minutes)

```bash
# Deploy updated cursor-agent-adapter with p_workspace_id support
supabase functions deploy cursor-agent-adapter

# Verify deployment
curl -X POST https://[project-ref].supabase.co/functions/v1/cursor-agent-adapter \
  -H "Authorization: Bearer [test-api-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "asset-declaration",
    "action": "list_asset_declarations",
    "filters": {}
  }'

# Expected: 200 OK (may return empty array if no declarations)
```

---

## Step 5: Verify Production Functionality (5 minutes)

### Test 1: Partner Declaration Still Works
```bash
curl -X POST https://[project-ref].supabase.co/functions/v1/cursor-agent-adapter \
  -H "Authorization: Bearer [partner-api-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "asset-declaration",
    "action": "declare_asset",
    "payload": {
      "file_hash": "sha256_test_production_verification",
      "enterprise_id": "[your-test-enterprise-id]",
      "partner_id": "[your-test-partner-id]",
      "tools_used": [
        {
          "tool_id": "openai-gpt4",
          "tool_name": "OpenAI GPT-4",
          "how_used": "Test declaration"
        }
      ],
      "usage_description": "Production verification test"
    }
  }'

# Expected: 200 OK with declaration_id
```

### Test 2: Verify RLS Isolation
```bash
# Connect to production database
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Run verification as authenticated user
SELECT * FROM public.verify_rls_restrictive();

# Expected: All tests PASS
```

### Test 3: Check Security Event Logging
```sql
-- Check for any unauthorized context switch attempts
SELECT 
  created_at,
  severity,
  details->>'attempted_partner_id' as partner,
  details->>'attempted_enterprise_id' as enterprise
FROM public.agent_activities
WHERE action = 'unauthorized_context_switch_attempt'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Expected: 0 rows (no unauthorized attempts yet)
```

---

## Post-Deployment Monitoring (First 48 Hours)

### Set Up Alerts

Create monitoring queries to run every hour:

```sql
-- Alert 1: Detect cross-tenant access attempts
CREATE OR REPLACE FUNCTION check_security_violations()
RETURNS TABLE (alert_message TEXT, severity TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Unauthorized context switch attempts detected'::TEXT,
    'CRITICAL'::TEXT,
    COUNT(*)
  FROM public.agent_activities
  WHERE action = 'unauthorized_context_switch_attempt'
    AND created_at > NOW() - INTERVAL '1 hour'
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql;

-- Run every hour via cron or external monitoring
SELECT * FROM check_security_violations();
```

### Dashboard Metrics to Monitor

1. **RLS Policy Performance** (should be <50ms):
```sql
EXPLAIN ANALYZE
SELECT * FROM public.asset_declarations LIMIT 100;
-- Check "Execution Time" in output
```

2. **Error Rate** (should be <1%):
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'error') * 100.0 / COUNT(*) as error_rate_pct
FROM public.agent_activities
WHERE created_at > NOW() - INTERVAL '1 hour';
```

3. **Context Switch Success Rate** (should be 100%):
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate
FROM public.agent_activities
WHERE action = 'context_switch'
  AND created_at > NOW() - INTERVAL '1 hour';
```

---

## Rollback Procedure (If Issues Arise)

If critical issues occur within first hour:

1. **Immediate**: See `docs/security/day1-rollback-plan.md`
2. **Quick Rollback Command**:
```bash
# Drop RESTRICTIVE policy only (keeps PERMISSIVE policies)
supabase db query "
  DROP POLICY IF EXISTS tenant_isolation_restrictive 
  ON public.asset_declarations;
"
```

3. **Monitor for 30 minutes**: If issues resolved, document root cause
4. **Schedule Fix**: Plan re-deployment with fix within 7 days

---

## Success Criteria Checklist

Before marking deployment as successful:

- [ ] Migration applied without errors
- [ ] `verify_rls_restrictive()` returns PASS for all tests
- [ ] Partner declaration flow works (tested with 3+ partners)
- [ ] Enterprise dashboards load correctly (tested with 3+ enterprises)
- [ ] No "SECURITY_VIOLATION" errors in application logs (except legitimate violations)
- [ ] API response times remain <500ms p95
- [ ] No spike in error rates (stays below 1%)
- [ ] Security event logging working (context switches logged)
- [ ] Monitoring alerts configured
- [ ] On-call team briefed on rollback procedure

---

## Troubleshooting Common Issues

### Issue 1: "function set_current_context already exists"
**Solution**: Function signature changed (added `p_workspace_id`). The migration uses `CREATE OR REPLACE` which should handle this. If error persists:
```sql
DROP FUNCTION IF EXISTS public.set_current_context(UUID, UUID);
-- Then re-run migration
```

### Issue 2: Partners cannot submit declarations
**Check**: Ensure `partner_api_keys` has valid relationship:
```sql
SELECT * FROM public.partner_api_keys 
WHERE partner_id = '[failing-partner-id]'
  AND enterprise_id = '[target-enterprise-id]';
-- Expected: 1 row with is_active=true, expires_at=NULL or future date
```

### Issue 3: "SECURITY_VIOLATION" on legitimate requests
**Check**: Context is being set correctly:
```sql
SELECT 
  details->>'partner_id',
  details->>'enterprise_id',
  details->>'workspace_id'
FROM public.agent_activities
WHERE action = 'context_switch'
  AND status = 'success'
ORDER BY created_at DESC
LIMIT 10;
-- Verify these match expected partner-enterprise relationships
```

---

## Contact Information

**Security Team**: security@aicomply.io  
**On-Call Engineer**: [PagerDuty/On-call rotation]  
**Incident Commander**: [Contact]  

**Escalation Path**:
1. Check `docs/security/day1-rollback-plan.md`
2. Contact on-call engineer
3. If no response in 15 minutes, escalate to incident commander
4. Document all actions in incident log

---

## Next Steps After Successful Deployment

1. **Day 2-3**: Proceed with Agent Authority Framework
2. **Day 4**: Implement cursor-based pagination
3. **Day 5-6**: Role proof enforcement configuration
4. **Day 7**: Deploy proof bundle verification CLI
5. **Day 8**: API versioning implementation
6. **Day 9**: Load testing
7. **Day 10**: Final security audit

---

## Deployment Log Template

```
=== Day 1 Security Hardening Deployment ===
Date: 2025-11-20
Environment: [staging/production]
Deployed by: [Your Name]
Start time: [HH:MM UTC]
End time: [HH:MM UTC]

✅ Migration applied successfully
✅ RLS verification PASSED
✅ Edge function deployed
✅ Production tests PASSED
✅ Monitoring configured

Issues encountered: [None / List issues]
Rollback required: [No / Yes - See incident log]

Next deployment: Day 2-3 Agent Authority Framework
```
