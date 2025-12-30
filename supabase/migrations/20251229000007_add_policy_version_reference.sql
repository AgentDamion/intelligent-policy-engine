-- Migration: 20251229000007_add_policy_version_reference.sql
-- Purpose: Add policy_version_id reference to governance_actions
-- Context Graph Phase 2: Context Capture Enhancement
--
-- This captures the policy version in effect at decision time:
-- - Enables "what policy was applied when this decision was made?"
-- - Critical for decision replay with exact policy context
-- - Supports policy lineage intelligence

BEGIN;

-- ============================================================
-- PART 1: Add policy_version columns to governance_actions
-- ============================================================

-- Policy version ID at time of action
ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS policy_version_id UUID;

-- Policy snapshot for immutability (in case policy is deleted)
ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS policy_snapshot JSONB;

-- Tool version if action was tool-related
ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS tool_version TEXT;

-- ============================================================
-- PART 2: Add indexes for policy queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_governance_actions_policy_version
ON public.governance_actions(policy_version_id)
WHERE policy_version_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_governance_actions_policy_snapshot
ON public.governance_actions USING gin(policy_snapshot jsonb_path_ops)
WHERE policy_snapshot IS NOT NULL;

-- ============================================================
-- PART 3: Function to capture policy snapshot
-- ============================================================

-- Use plpgsql for better error handling with potentially missing columns
CREATE OR REPLACE FUNCTION public.capture_policy_snapshot(p_policy_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Try to get policy data - use to_jsonb to capture all columns dynamically
  SELECT jsonb_build_object(
    'captured_at', NOW(),
    'policy_id', p_policy_id,
    'policy_data', to_jsonb(p.*)
  ) INTO v_result
  FROM public.policies p
  WHERE p.id = p_policy_id;
  
  RETURN COALESCE(v_result, jsonb_build_object('policy_id', p_policy_id, 'captured_at', NOW(), 'error', 'Policy not found'));
EXCEPTION WHEN OTHERS THEN
  -- Return minimal info if table doesn't exist or query fails
  RETURN jsonb_build_object('policy_id', p_policy_id, 'captured_at', NOW(), 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.capture_policy_snapshot IS 
'Captures a complete snapshot of a policy for immutable audit records.
Ensures policy context is preserved even if policy is later modified.';

-- ============================================================
-- PART 4: Function to get policy at action time
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_policy_at_action_time(p_action_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COALESCE(
      ga.policy_snapshot,
      CASE WHEN ga.policy_version_id IS NOT NULL THEN
        public.capture_policy_snapshot(ga.policy_version_id)
      ELSE NULL END,
      '{}'::jsonb
    )
  FROM public.governance_actions ga
  WHERE ga.id = p_action_id;
$$;

COMMENT ON FUNCTION public.get_policy_at_action_time IS 
'Returns the policy that was in effect when a governance action was taken.
Prefers stored snapshot, falls back to current policy version if snapshot missing.';

-- ============================================================
-- PART 5: Add to governance threads for context
-- ============================================================

ALTER TABLE public.governance_threads
ADD COLUMN IF NOT EXISTS applicable_policy_ids UUID[];

CREATE INDEX IF NOT EXISTS idx_governance_threads_policy_ids
ON public.governance_threads USING gin(applicable_policy_ids)
WHERE applicable_policy_ids IS NOT NULL;

-- ============================================================
-- PART 6: Function to get policy lineage for a decision
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_decision_policy_lineage(p_thread_id UUID)
RETURNS TABLE (
  action_id UUID,
  action_type TEXT,
  action_timestamp TIMESTAMPTZ,
  policy_id UUID,
  policy_name TEXT,
  policy_version INTEGER,
  has_snapshot BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    ga.id as action_id,
    ga.action_type,
    ga.created_at as action_timestamp,
    COALESCE(
      (ga.policy_snapshot->>'policy_id')::UUID,
      ga.policy_version_id
    ) as policy_id,
    ga.policy_snapshot->>'policy_name' as policy_name,
    (ga.policy_snapshot->>'policy_version')::INTEGER as policy_version,
    ga.policy_snapshot IS NOT NULL as has_snapshot
  FROM public.governance_actions ga
  WHERE ga.thread_id = p_thread_id
  ORDER BY ga.created_at ASC;
$$;

COMMENT ON FUNCTION public.get_decision_policy_lineage IS 
'Returns the complete policy lineage for a governance thread.
Shows which policy version was in effect for each action.';

-- ============================================================
-- PART 7: Comments for documentation
-- ============================================================

COMMENT ON COLUMN public.governance_actions.policy_version_id IS 
'Reference to the policy version that was evaluated for this action.
Used for policy lineage tracking and decision replay.';

COMMENT ON COLUMN public.governance_actions.policy_snapshot IS 
'Immutable snapshot of policy at action time. Ensures audit integrity
even if the original policy is later modified or deleted.';

COMMENT ON COLUMN public.governance_actions.tool_version IS 
'Version of the AI tool being evaluated (if action is tool-related).
Format depends on tool, e.g., "claude-3-opus-20240229".';

COMMENT ON COLUMN public.governance_threads.applicable_policy_ids IS 
'Array of policy IDs that apply to this governance thread.
Determined at thread creation based on subject type and context.';

COMMIT;

