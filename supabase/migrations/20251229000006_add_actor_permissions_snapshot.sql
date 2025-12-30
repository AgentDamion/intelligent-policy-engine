-- Migration: 20251229000006_add_actor_permissions_snapshot.sql
-- Purpose: Add actor_permissions snapshot to governance_actions
-- Context Graph Phase 2: Context Capture Enhancement
--
-- This captures the actor's permissions at the time of action:
-- - Enables decision replay with exact authority context
-- - Critical for auditing "did this person have permission to approve?"
-- - Supports FDA 21 CFR Part 11 authority verification

BEGIN;

-- ============================================================
-- PART 0: Create user_contexts table if it doesn't exist
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  agency_seat_id UUID,
  role TEXT NOT NULL DEFAULT 'contributor',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, enterprise_id, agency_seat_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_contexts_user ON public.user_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contexts_enterprise ON public.user_contexts(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_user_contexts_active ON public.user_contexts(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.user_contexts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_contexts_user_read" ON public.user_contexts;
CREATE POLICY "user_contexts_user_read"
ON public.user_contexts FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_contexts_service_role" ON public.user_contexts;
CREATE POLICY "user_contexts_service_role"
ON public.user_contexts FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- PART 1: Add actor_permissions column to governance_actions
-- ============================================================

ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS actor_permissions JSONB;

-- Index for permission analysis queries
CREATE INDEX IF NOT EXISTS idx_governance_actions_actor_permissions
ON public.governance_actions USING gin(actor_permissions jsonb_path_ops)
WHERE actor_permissions IS NOT NULL;

-- ============================================================
-- PART 2: Add actor_enterprise_id for context tracking
-- ============================================================

ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS actor_enterprise_id UUID REFERENCES public.enterprises(id);

CREATE INDEX IF NOT EXISTS idx_governance_actions_actor_enterprise
ON public.governance_actions(actor_enterprise_id)
WHERE actor_enterprise_id IS NOT NULL;

-- ============================================================
-- PART 3: Function to capture current user permissions
-- ============================================================

CREATE OR REPLACE FUNCTION public.capture_user_permissions(p_user_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'captured_at', NOW(),
    'user_id', p_user_id,
    'contexts', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'context_id', uc.id,
            'enterprise_id', uc.enterprise_id,
            'agency_seat_id', uc.agency_seat_id,
            'role', uc.role,
            'permissions', uc.permissions,
            'is_active', uc.is_active
          )
        )
        FROM public.user_contexts uc
        WHERE uc.user_id = p_user_id
          AND uc.is_active = true
      ),
      '[]'::jsonb
    ),
    'partner_contexts', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'context_id', pcc.id,
            'partner_enterprise_id', pcc.partner_enterprise_id,
            'client_enterprise_id', pcc.client_enterprise_id,
            'role', pcc.role,
            'permissions', pcc.permissions,
            'brand_scope', pcc.brand_scope,
            'is_active', pcc.is_active
          )
        )
        FROM public.partner_client_contexts pcc
        WHERE pcc.user_id = p_user_id
          AND pcc.is_active = true
      ),
      '[]'::jsonb
    )
  );
$$;

COMMENT ON FUNCTION public.capture_user_permissions IS 
'Captures a snapshot of a user''s current permissions across all contexts.
Used to record actor authority at the time of governance action.';

-- ============================================================
-- PART 4: Enhanced record_governance_action with permissions
-- ============================================================

-- Drop existing function to recreate with new parameters
DROP FUNCTION IF EXISTS public.record_governance_action_with_permissions(UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, JSONB, UUID, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.record_governance_action_with_permissions(
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
  -- Context snapshot
  p_context_snapshot JSONB DEFAULT NULL,
  -- NEW: Capture permissions
  p_capture_permissions BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
  v_before_state JSONB;
  v_after_state JSONB;
  v_current_status TEXT;
  v_existing_action UUID;
  v_enterprise_id UUID;
  v_actor_permissions JSONB;
BEGIN
  -- Check idempotency (if key provided)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_action
    FROM public.governance_actions
    WHERE idempotency_key = p_idempotency_key;
    
    IF v_existing_action IS NOT NULL THEN
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
  
  -- Capture actor permissions if requested and actor is human
  IF p_capture_permissions AND p_actor_type = 'human' AND p_actor_id IS NOT NULL THEN
    v_actor_permissions := public.capture_user_permissions(p_actor_id);
  END IF;
  
  -- Determine new status if not provided
  IF p_new_status IS NULL THEN
    p_new_status := CASE p_action_type
      WHEN 'approve' THEN 'approved'
      WHEN 'reject' THEN 'blocked'
      WHEN 'cancel' THEN 'cancelled'
      WHEN 'escalate' THEN 'escalated'
      WHEN 'request_info' THEN 'needs_info'
      WHEN 'auto_clear' THEN 'approved'
      WHEN 'draft_decision' THEN v_current_status
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
  
  -- Insert governance action with permissions snapshot
  INSERT INTO public.governance_actions (
    thread_id,
    action_type,
    actor_type,
    actor_id,
    actor_role,
    actor_enterprise_id,
    actor_permissions,
    agent_name,
    rationale,
    before_state,
    after_state,
    metadata,
    surface,
    mode,
    client,
    idempotency_key,
    context_snapshot
  )
  VALUES (
    p_thread_id,
    p_action_type,
    p_actor_type,
    p_actor_id,
    p_actor_role,
    v_enterprise_id,
    v_actor_permissions,
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
  
  -- Sync to audit events
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
      'has_context_snapshot', p_context_snapshot IS NOT NULL,
      'has_permissions_snapshot', v_actor_permissions IS NOT NULL
    ),
    NOW()
  );
  
  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.record_governance_action_with_permissions IS 
'Records a governance action with full permissions snapshot for FDA compliance.
Captures actor permissions at decision time for authority verification.';

-- ============================================================
-- PART 5: Comments for documentation
-- ============================================================

COMMENT ON COLUMN public.governance_actions.actor_permissions IS 
'Snapshot of actor''s permissions at time of action. Structure:
{
  "captured_at": "timestamp",
  "user_id": "uuid",
  "contexts": [...],
  "partner_contexts": [...]
}';

COMMENT ON COLUMN public.governance_actions.actor_enterprise_id IS 
'The enterprise context in which the actor performed this action.
Used for cross-enterprise boundary tracking.';

COMMIT;

