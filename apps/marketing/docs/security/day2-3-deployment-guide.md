# Day 2-3: Agent Authority Framework - Deployment Guide

## Overview
Implements agent permission system with auto-execution thresholds and conflict resolution.

## Prerequisites
- ✅ Day 1 security hardening deployed and verified
- Database access with migration privileges
- Service role access for function grants

---

## Deployment Steps

### Step 1: Deploy Migration (5 minutes)

```bash
# Create migration file
supabase migration new day2_3_agent_authority_framework

# Copy SQL content from docs/security/day2-3-migration-agent-authority.sql
# into the generated migration file

# Deploy to database
supabase db push
```

### Step 2: Verify Migration (3 minutes)

```sql
-- Verify agent_manifest table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'agent_manifest';

-- Verify default agents seeded
SELECT agent_name, agent_type, auto_execution_threshold 
FROM public.agent_manifest
WHERE is_active = true;

-- Expected output:
-- AssetDeclarationAgent | governance | auto_medium
-- ConfigurationAgent    | configuration | auto_low
-- PolicyMaintenanceAgent| governance | manual
-- SimulationAgent       | simulation | auto_medium
-- InboxAgent            | system | auto_low

-- Verify functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'detect_agent_conflict',
    'check_auto_execution_allowed'
  );
```

### Step 3: Test Authority Validation (10 minutes)

```sql
-- Test 1: Check auto-execution for low impact action
SELECT * FROM public.check_auto_execution_allowed(
  'AssetDeclarationAgent',
  'write',
  'low'
);
-- Expected: can_auto_execute = true (agent has auto_medium threshold)

-- Test 2: Check auto-execution for high impact action
SELECT * FROM public.check_auto_execution_allowed(
  'ConfigurationAgent',
  'write',
  'high'
);
-- Expected: can_auto_execute = false, requires_approval = true

-- Test 3: Check manual approval agent
SELECT * FROM public.check_auto_execution_allowed(
  'PolicyMaintenanceAgent',
  'execute',
  'medium'
);
-- Expected: can_auto_execute = false, requires_approval = true
```

### Step 4: Test Conflict Detection (10 minutes)

```sql
-- Create test asset declaration
INSERT INTO public.asset_declarations (
  id, file_hash, file_name, partner_id, enterprise_id, validation_status
) VALUES (
  'test-asset-123',
  'test_hash_123',
  'test_file.mp4',
  (SELECT id FROM public.partner_api_keys LIMIT 1),
  (SELECT enterprise_id FROM public.partner_api_keys LIMIT 1),
  'pending'
);

-- Simulate Agent A starting action
INSERT INTO public.agent_action_log (
  agent_name, action_type, resource_type, resource_id, execution_status
) VALUES (
  'AssetDeclarationAgent',
  'write',
  'asset_declaration',
  'test-asset-123',
  'executing'
);

-- Test conflict detection for Agent B trying same resource
SELECT * FROM public.detect_agent_conflict(
  'ConfigurationAgent',
  'asset_declaration',
  'test-asset-123',
  'write'
);
-- Expected: has_conflict = true, conflicting_agent = 'AssetDeclarationAgent'

-- Cleanup
DELETE FROM public.agent_action_log WHERE resource_id = 'test-asset-123';
DELETE FROM public.asset_declarations WHERE id = 'test-asset-123';
```

### Step 5: Deploy Edge Function Updates (5 minutes)

```bash
# Deploy updated cursor-agent-adapter with authority validator
supabase functions deploy cursor-agent-adapter
```

### Step 6: Verify Analytics Views (2 minutes)

```sql
-- Check agent activity summary
SELECT * FROM public.agent_authority_summary;

-- Check conflict analytics (will be empty initially)
SELECT * FROM public.agent_conflict_analytics;
```

---

## Integration Testing

### Test Authority Validation in AssetDeclarationAgent

Update your agent to use the validator:

```typescript
import { AgentAuthorityValidator } from './agent-authority-validator.ts';

// In your agent's process method:
const validator = new AgentAuthorityValidator(supabase);

const validation = await validator.validateAndLog({
  agentName: 'AssetDeclarationAgent',
  actionType: 'write',
  resourceType: 'asset_declaration',
  resourceId: assetId,
  resourceImpact: 'medium',
  enterpriseId: enterpriseId,
  workspaceId: workspaceId,
  actionPayload: { tools_used: toolsUsed }
});

if (!validation.authorized) {
  throw new Error(`Unauthorized: ${validation.reason}`);
}

if (validation.has_conflict) {
  console.log(`Conflict detected: ${validation.conflict_resolution}`);
  // Handle based on conflict_resolution_strategy
}

if (!validation.can_auto_execute) {
  // Route to InboxAgent for approval
  await inboxAgent.createTask({
    task_type: 'agent_approval',
    action_id: validation.action_id,
    ...
  });
  return; // Wait for approval
}

// Proceed with auto-execution
await validator.updateActionStatus(validation.action_id!, 'executing');

// ... perform action ...

await validator.updateActionStatus(validation.action_id!, 'completed');
```

---

## Post-Deployment Monitoring

### Monitor Agent Actions (First Week)

```sql
-- Daily: Check for conflicts
SELECT 
  DATE_TRUNC('day', created_at) as day,
  agent_name,
  COUNT(*) as conflict_count
FROM public.agent_action_log
WHERE conflict_detected = true
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY day, agent_name
ORDER BY day DESC;

-- Daily: Check approval rates
SELECT 
  agent_name,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN execution_status = 'completed' THEN 1 END) as auto_executed,
  COUNT(CASE WHEN execution_status = 'pending' THEN 1 END) as pending_approval,
  ROUND(
    100.0 * COUNT(CASE WHEN execution_status = 'completed' THEN 1 END) / COUNT(*),
    2
  ) as auto_execution_rate
FROM public.agent_action_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY agent_name;

-- Daily: Check for unauthorized attempts
SELECT 
  created_at,
  agent_name,
  action_type,
  resource_type,
  error_message
FROM public.agent_action_log
WHERE execution_status = 'rejected'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## Success Criteria

- ✅ All 5 default agents present in `agent_manifest`
- ✅ `check_auto_execution_allowed()` correctly enforces thresholds
- ✅ `detect_agent_conflict()` identifies concurrent actions
- ✅ Agent actions logged to `agent_action_log`
- ✅ Analytics views return data
- ✅ No cross-agent conflicts during 24-hour test period

---

## Troubleshooting

### Issue: Function not found
```sql
-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.detect_agent_conflict(TEXT, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_auto_execution_allowed(TEXT, TEXT, TEXT) TO service_role;
```

### Issue: Agents not appearing in manifest
```sql
-- Check if insert succeeded
SELECT COUNT(*) FROM public.agent_manifest;
-- Expected: 5

-- If missing, re-run seed data section from migration
```

### Issue: RLS blocking reads
```sql
-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'agent_manifest';
-- Should see: agent_manifest_users_view policy
```

---

## Rollback Plan

```sql
-- Drop views
DROP VIEW IF EXISTS public.agent_conflict_analytics;
DROP VIEW IF EXISTS public.agent_authority_summary;

-- Drop functions
DROP FUNCTION IF EXISTS public.check_auto_execution_allowed(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.detect_agent_conflict(TEXT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_agent_manifest_timestamp();

-- Drop triggers
DROP TRIGGER IF EXISTS agent_manifest_update_timestamp ON public.agent_manifest;

-- Drop tables (CASCADE removes foreign keys)
DROP TABLE IF EXISTS public.agent_action_log CASCADE;
DROP TABLE IF EXISTS public.agent_manifest CASCADE;
```

**⚠️ WARNING**: Rollback removes all agent authority controls. Only use if critical bug blocks system.

---

## Next Steps

After Day 2-3 verification complete:
- **Day 4**: Cursor-based pagination for unbounded queries
- **Day 5-6**: Role proof enforcement with grace periods
- **Day 7**: Proof bundle verification CLI
