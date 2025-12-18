# Day 2-3: Agent Authority Framework - Rollback Plan

## When to Rollback

Execute this rollback ONLY if:
- ✅ Critical bugs prevent agent execution
- ✅ Performance degradation > 2 seconds per agent action
- ✅ Database conflicts block all operations
- ✅ Security team identifies critical vulnerability

**DO NOT rollback for**:
- Minor bugs that can be hotfixed
- Expected conflicts during testing
- Performance < 500ms impact

---

## Pre-Rollback Checklist

1. **Export Current Data**
```sql
-- Backup agent action logs
COPY (
  SELECT * FROM public.agent_action_log
  WHERE created_at > NOW() - INTERVAL '7 days'
) TO '/tmp/agent_action_log_backup.csv' CSV HEADER;

-- Backup agent manifest
COPY (
  SELECT * FROM public.agent_manifest
) TO '/tmp/agent_manifest_backup.csv' CSV HEADER;
```

2. **Document Rollback Reason**
```bash
# Create incident log
cat > /tmp/rollback_incident.txt << EOF
Rollback Date: $(date)
Rollback Reason: [DESCRIBE CRITICAL ISSUE]
Affected Systems: [LIST SYSTEMS]
Deployed By: [YOUR NAME]
Approval: [MANAGER NAME]
EOF
```

3. **Notify Stakeholders**
- Post in #security-alerts Slack channel
- Email CTO and Security Lead
- Update status page

---

## Rollback Steps

### Step 1: Disable Agent Authority Checks (Immediate - 2 min)

```sql
-- Temporarily disable all agents in manifest
UPDATE public.agent_manifest
SET is_active = false;

-- Verify all agents disabled
SELECT agent_name, is_active FROM public.agent_manifest;
-- Expected: All rows show is_active = false
```

This immediately stops all authority validation while preserving data.

### Step 2: Remove Database Objects (5 minutes)

```sql
-- Drop views (safe - no data loss)
DROP VIEW IF EXISTS public.agent_conflict_analytics;
DROP VIEW IF EXISTS public.agent_authority_summary;

-- Drop functions (safe - no data loss)
DROP FUNCTION IF EXISTS public.check_auto_execution_allowed(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.detect_agent_conflict(TEXT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_agent_manifest_timestamp();

-- Drop trigger (safe - no data loss)
DROP TRIGGER IF EXISTS agent_manifest_update_timestamp ON public.agent_manifest;

-- Verify functions removed
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%agent%';
-- Expected: No rows (or only unrelated functions)
```

### Step 3: Archive Tables (Data Preservation - 3 minutes)

```sql
-- Rename tables instead of dropping to preserve audit trail
ALTER TABLE public.agent_action_log 
  RENAME TO agent_action_log_archived_20251120;

ALTER TABLE public.agent_manifest 
  RENAME TO agent_manifest_archived_20251120;

-- Verify tables archived
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%agent%';
-- Expected: Shows archived tables with timestamp suffix
```

### Step 4: Revert Edge Function (5 minutes)

```bash
# Remove authority validator from git
git rm supabase/functions/cursor-agent-adapter/agents/agent-authority-validator.ts

# Remove imports from asset-declaration-agent.ts
# (Revert to pre-Day 2-3 version)

# Redeploy without authority checks
supabase functions deploy cursor-agent-adapter

# Verify deployment
curl -X POST https://[project-id].supabase.co/functions/v1/cursor-agent-adapter \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"agent": "AssetDeclarationAgent", "action": "health_check"}'
# Expected: Returns 200 OK without authority validation
```

### Step 5: Verify System Recovery (10 minutes)

```sql
-- Test 1: Asset declarations work without authority checks
-- Attempt to create declaration (should succeed)

-- Test 2: Agent activities still logging
SELECT COUNT(*) FROM public.agent_activities
WHERE created_at > NOW() - INTERVAL '10 minutes';
-- Expected: > 0 (system still active)

-- Test 3: No lingering foreign key errors
-- Attempt normal operations in UI
```

---

## Post-Rollback Actions

### 1. Root Cause Analysis (Within 24 hours)

```markdown
## Incident Report Template

**Rollback Date**: [DATE]
**Rollback Time**: [TIME]
**Duration of Downtime**: [X minutes]

**Root Cause**:
- [What caused the need for rollback?]
- [Was it a code bug, database issue, or design flaw?]

**Impact**:
- [Which agents were affected?]
- [How many operations failed?]
- [Were any enterprises unable to declare assets?]

**Resolution**:
- [What needs to be fixed before re-deploying?]
- [Which tests need to be added?]

**Timeline**:
- [HH:MM] Issue detected
- [HH:MM] Rollback initiated
- [HH:MM] System recovered
- [HH:MM] Post-mortem completed

**Action Items**:
- [ ] Fix root cause bug
- [ ] Add regression test
- [ ] Update deployment checklist
- [ ] Re-deploy with fix (Day 2-3 v2)
```

### 2. Data Recovery (If Needed)

```sql
-- If you need to restore agent action logs for analysis
CREATE TABLE public.agent_action_log AS 
SELECT * FROM public.agent_action_log_archived_20251120;

-- Grant permissions
ALTER TABLE public.agent_action_log ENABLE ROW LEVEL SECURITY;
-- (Re-apply RLS policies from original migration)
```

### 3. Re-Deployment Plan

Before re-deploying Day 2-3:
1. ✅ Root cause fixed and tested in local environment
2. ✅ Regression tests added to prevent recurrence
3. ✅ Staged deployment plan approved
4. ✅ Rollback procedure tested in staging
5. ✅ Monitoring alerts configured

---

## Emergency Contacts

- **Database Team**: db-oncall@company.com
- **Security Lead**: security-lead@company.com
- **CTO**: cto@company.com
- **On-Call Engineer**: [PHONE NUMBER]

---

## Rollback Verification Checklist

After rollback, verify:

- [ ] All agents disabled in manifest
- [ ] Authority functions dropped
- [ ] Tables archived (not dropped)
- [ ] Edge function deployed without authority checks
- [ ] Asset declarations working
- [ ] No foreign key errors
- [ ] Incident report filed
- [ ] Stakeholders notified
- [ ] Root cause analysis initiated

---

## Re-Enabling After Fix

When ready to re-deploy Day 2-3:

```sql
-- 1. Restore archived tables (if needed)
ALTER TABLE public.agent_manifest_archived_20251120 
  RENAME TO agent_manifest;

ALTER TABLE public.agent_action_log_archived_20251120 
  RENAME TO agent_action_log;

-- 2. Re-deploy migration with fixes
-- (Use Day 2-3 v2 migration file)

-- 3. Re-enable agents one at a time
UPDATE public.agent_manifest
SET is_active = true
WHERE agent_name = 'AssetDeclarationAgent';

-- Monitor for 1 hour before enabling next agent

-- 4. Gradually enable remaining agents
```

---

**⚠️ CRITICAL**: This rollback removes all agent authority controls. System will operate without permission checks until Day 2-3 is re-deployed with fixes. Inform all stakeholders and expedite root cause resolution.
