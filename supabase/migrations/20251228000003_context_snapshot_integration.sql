-- Migration: 20251228000003_context_snapshot_integration.sql
-- Purpose: Week 3 - Wire up context snapshot capture to governance_actions
-- PRD Phase 1 Completion: Trust Foundation

BEGIN;

-- ============================================================
-- PART 1: Update record_governance_action to accept context_snapshot
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_governance_action(
  p_thread_id UUID,
  p_action_type TEXT,
  p_actor_type TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_agent_name TEXT DEFAULT NULL,
  p_rationale TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  -- Envelope fields
  p_idempotency_key UUID DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_surface TEXT DEFAULT NULL,
  p_mode TEXT DEFAULT NULL,
  p_client TEXT DEFAULT 'web',
  -- NEW: Context snapshot for FDA compliance
  p_context_snapshot JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
  v_before_state JSONB;
  v_after_state JSONB;
  v_current_status TEXT;
  v_existing_action UUID;
  v_enterprise_id UUID;
BEGIN
  -- Check idempotency (if key provided)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_action
    FROM public.governance_actions
    WHERE idempotency_key = p_idempotency_key;
    
    IF v_existing_action IS NOT NULL THEN
      -- Already processed, return existing action ID
      RETURN v_existing_action;
    END IF;
  END IF;

  -- Get current thread state and enterprise_id
  SELECT 
    jsonb_build_object(
      'status', status,
      'priority', priority,
      'severity', severity,
      'current_step', current_step,
      'owner_user_id', owner_user_id,
      'proof_bundle_id', proof_bundle_id
    ),
    status,
    enterprise_id
  INTO v_before_state, v_current_status, v_enterprise_id
  FROM public.governance_threads
  WHERE id = p_thread_id;
  
  IF v_before_state IS NULL THEN
    RAISE EXCEPTION 'Thread not found: %', p_thread_id;
  END IF;
  
  -- Determine new status if not provided
  IF p_new_status IS NULL THEN
    p_new_status := CASE p_action_type
      -- Legacy action mappings
      WHEN 'approve' THEN 'approved'
      WHEN 'reject' THEN 'blocked'
      WHEN 'cancel' THEN 'cancelled'
      WHEN 'escalate' THEN 'escalated'
      WHEN 'request_info' THEN 'needs_info'
      WHEN 'auto_clear' THEN 'approved'
      WHEN 'draft_decision' THEN v_current_status
      -- Action Catalog mappings
      WHEN 'HumanApproveDecision' THEN 'approved'
      WHEN 'HumanBlockDecision' THEN 'blocked'
      WHEN 'HumanApproveWithConditions' THEN 'approved_with_conditions'
      WHEN 'HumanRequestChanges' THEN 'needs_info'
      WHEN 'HumanEscalate' THEN 'escalated'
      WHEN 'AgentAutoApprove' THEN 'approved'
      WHEN 'AgentAutoBlock' THEN 'blocked'
      WHEN 'AgentEvaluate' THEN 'in_review'
      WHEN 'AgentRecommend' THEN 'proposed_resolution'
      ELSE v_current_status
    END;
  END IF;
  
  -- Update thread if status changes
  IF p_new_status != v_current_status THEN
    UPDATE public.governance_threads
    SET 
      status = p_new_status,
      updated_at = NOW(),
      resolved_at = CASE 
        WHEN p_new_status IN ('approved', 'blocked', 'approved_with_conditions', 'resolved', 'cancelled') 
        THEN NOW() 
        ELSE NULL 
      END,
      resolved_by = CASE 
        WHEN p_new_status IN ('approved', 'blocked', 'approved_with_conditions', 'resolved', 'cancelled') 
        THEN p_actor_id 
        ELSE NULL 
      END
    WHERE id = p_thread_id;
  END IF;
  
  -- Capture after state
  SELECT 
    jsonb_build_object(
      'status', status,
      'priority', priority,
      'severity', severity,
      'current_step', current_step,
      'owner_user_id', owner_user_id,
      'proof_bundle_id', proof_bundle_id
    )
  INTO v_after_state
  FROM public.governance_threads
  WHERE id = p_thread_id;
  
  -- Insert governance action with context snapshot
  INSERT INTO public.governance_actions (
    thread_id,
    action_type,
    actor_type,
    actor_id,
    actor_role,
    agent_name,
    rationale,
    before_state,
    after_state,
    metadata,
    surface,
    mode,
    client,
    idempotency_key,
    context_snapshot  -- NEW: Store context snapshot
  )
  VALUES (
    p_thread_id,
    p_action_type,
    p_actor_type,
    p_actor_id,
    p_actor_role,
    p_agent_name,
    p_rationale,
    v_before_state,
    v_after_state,
    p_metadata,
    p_surface,
    p_mode,
    p_client,
    p_idempotency_key,
    p_context_snapshot
  )
  RETURNING id INTO v_action_id;
  
  -- Sync to audit events for compliance trail
  INSERT INTO public.governance_audit_events (
    event_type,
    enterprise_id,
    actor_type,
    actor_id,
    event_payload,
    created_at
  )
  VALUES (
    'governance_action',
    v_enterprise_id,
    p_actor_type,
    p_actor_id,
    jsonb_build_object(
      'action_id', v_action_id,
      'thread_id', p_thread_id,
      'action_type', p_action_type,
      'rationale', p_rationale,
      'before_status', v_current_status,
      'after_status', p_new_status,
      'has_context_snapshot', p_context_snapshot IS NOT NULL
    ),
    NOW()
  );
  
  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.record_governance_action IS 
'Records a governance action with full context snapshot for FDA 21 CFR Part 11 compliance. 
Captures before/after state and syncs to audit trail.';

-- ============================================================
-- PART 2: Add index for context snapshot queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_governance_actions_has_context
ON public.governance_actions ((context_snapshot IS NOT NULL));

-- ============================================================
-- PART 3: Create helper function to get actions with context
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_actions_with_context(
  p_thread_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  action_id UUID,
  action_type TEXT,
  actor_type TEXT,
  actor_id UUID,
  agent_name TEXT,
  rationale TEXT,
  before_state JSONB,
  after_state JSONB,
  context_snapshot JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    id as action_id,
    action_type,
    actor_type,
    actor_id,
    agent_name,
    rationale,
    before_state,
    after_state,
    context_snapshot,
    metadata,
    created_at
  FROM public.governance_actions
  WHERE thread_id = p_thread_id
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.get_actions_with_context IS 
'Retrieves governance actions with full context snapshots for decision replay capability.';

-- ============================================================
-- PART 4: Add pg_trgm extension for precedent matching (Week 5)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMIT;

