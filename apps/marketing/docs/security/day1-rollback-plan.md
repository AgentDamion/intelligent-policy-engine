# Day 1 Security Hardening - Emergency Rollback Plan

## 🚨 When to Use This Rollback

**ONLY rollback if:**
- Critical business logic breaks (users cannot submit declarations)
- Application becomes completely unusable
- Database performance degrades by >50%
- Multiple production incidents within first hour

**DO NOT rollback for:**
- Single user error messages
- Expected "unauthorized access" errors (these are correct behavior)
- Minor performance fluctuations
- Security events appearing in logs (this is the system working correctly)

---

## Pre-Rollback Checklist

Before rolling back, verify the issue is NOT caused by:

1. [ ] Expired API keys (check `partner_api_keys.expires_at`)
2. [ ] Incorrect partner-enterprise relationship configuration
3. [ ] Missing workspace memberships for legitimate users
4. [ ] Application code not updated with new `p_workspace_id` parameter
5. [ ] Cached old function signature in application layer

---

## Rollback Procedure (15 minutes)

### Step 1: Disable RESTRICTIVE Policy (2 minutes)

```sql
-- Connect to database
psql "postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres"

-- Disable the RESTRICTIVE policy (but keep PERMISSIVE policies)
DROP POLICY IF EXISTS tenant_isolation_restrictive ON public.asset_declarations;

-- Verify policy removed
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'asset_declarations';

-- Expected: tenant_isolation_restrictive should NOT appear in results
```

### Step 2: Revert set_current_context Function (3 minutes)

```sql
-- Restore simple version without authorization validation
CREATE OR REPLACE FUNCTION public.set_current_context(
  p_partner_id UUID,
  p_enterprise_id UUID
) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_partner_id', p_partner_id::text, false);
  PERFORM set_config('app.current_enterprise_id', p_enterprise_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify function signature
\df public.set_current_context

-- Expected: Should show 2 parameters (p_partner_id, p_enterprise_id)
```

### Step 3: Revert Application Code (5 minutes)

```typescript
// In supabase/functions/cursor-agent-adapter/agents/asset-declaration-agent.ts
// Revert lines 183-189 to:

if (context.partner_id && context.enterprise_id) {
  await this.supabase.rpc('set_current_context', {
    p_partner_id: context.partner_id as string,
    p_enterprise_id: context.enterprise_id as string
    // Remove p_workspace_id parameter
  });
}
```

Deploy updated edge function:
```bash
supabase functions deploy cursor-agent-adapter
```

### Step 4: Verify Application Functionality (5 minutes)

```bash
# Test partner declaration flow
curl -X POST https://[project-id].supabase.co/functions/v1/cursor-agent-adapter \
  -H "Authorization: Bearer [api-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "asset-declaration",
    "action": "declare_asset",
    "payload": {
      "file_hash": "test_hash_rollback",
      "enterprise_id": "[test-enterprise-id]",
      "partner_id": "[test-partner-id]",
      "tools_used": []
    }
  }'

# Expected: 200 OK with declaration_id
```

### Step 5: Monitor for Cross-Tenant Leakage (Ongoing)

⚠️ **CRITICAL**: After rollback, you have NO RESTRICTIVE safety net!

Run this query every hour to detect cross-tenant access:

```sql
-- Detect potential cross-tenant access patterns
SELECT 
  enterprise_id,
  COUNT(DISTINCT partner_id) as unique_partners,
  COUNT(*) as total_declarations,
  MAX(declared_at) as last_declaration
FROM public.asset_declarations
GROUP BY enterprise_id
HAVING COUNT(DISTINCT partner_id) > 5  -- Alert if >5 partners per enterprise
ORDER BY unique_partners DESC;

-- Check for anomalous access patterns
SELECT 
  ad.partner_id,
  ad.enterprise_id,
  COUNT(*) as declaration_count,
  array_agg(DISTINCT ad.file_hash ORDER BY ad.declared_at DESC) as recent_files
FROM public.asset_declarations ad
LEFT JOIN public.partner_api_keys pak 
  ON pak.partner_id = ad.partner_id 
  AND pak.enterprise_id = ad.enterprise_id
WHERE pak.id IS NULL  -- Partner-enterprise relationship doesn't exist
GROUP BY ad.partner_id, ad.enterprise_id;

-- Expected: ZERO rows (if any rows appear, you have data leakage)
```

---

## Post-Rollback Action Plan

After successfully rolling back:

1. **Incident Report** (within 2 hours):
   - Document what broke and why
   - Root cause analysis
   - Impact assessment (how many users affected)

2. **Fix Identification** (within 24 hours):
   - Identify specific code/config issue that caused rollback
   - Create isolated test case that reproduces the issue
   - Develop targeted fix (not full re-deployment)

3. **Staged Re-Deployment**:
   - Fix and test in staging environment for 48 hours
   - Deploy to 10% of production traffic (canary deployment)
   - Monitor for 24 hours before full rollout

4. **Security Audit**:
   - Review all cross-tenant access patterns during rollback period
   - Identify any data leakage incidents
   - Notify affected enterprises if breach occurred

---

## Rollback Verification Checklist

After completing rollback, verify:

- [ ] Partner declarations working (test 3+ partners)
- [ ] Enterprise dashboards loading (test 3+ enterprises)
- [ ] No "SECURITY_VIOLATION" errors in logs
- [ ] API response times back to baseline (<500ms p95)
- [ ] No spike in error rates
- [ ] All PERMISSIVE RLS policies still active
- [ ] Monitoring alerts configured for cross-tenant access detection

---

## Contact Information

**Security Incidents**: security@aicomply.io  
**On-Call Engineer**: [PagerDuty rotation]  
**Database Admin**: [Contact info]  
**Incident Commander**: [Contact info]

---

## Lessons Learned Template

After resolving the incident, document:

### What Went Wrong
- Root cause:
- Contributing factors:
- Detection time:

### What Went Right
- Response time:
- Rollback execution:
- Communication:

### Action Items
1. [ ] Fix identified issue
2. [ ] Update test suite to catch this regression
3. [ ] Improve staging environment parity
4. [ ] Update deployment checklist
5. [ ] Re-deploy security hardening with fix

---

## Prevention for Next Attempt

Before re-deploying Day 1 security hardening:

1. **Staging Soak Test**: Run for 7 days in staging with production-like load
2. **Canary Deployment**: Deploy to 5% → 25% → 50% → 100% over 4 days
3. **Feature Flag**: Implement `RESTRICTIVE_RLS_ENABLED` env var for instant rollback
4. **Automated Rollback**: Configure auto-rollback if error rate exceeds 5%
5. **Enhanced Monitoring**: Add custom metrics for RLS policy evaluation time

---

⚠️ **REMINDER**: Rolling back removes critical security protections. Expedite the fix and re-deployment to restore security posture as soon as possible.
