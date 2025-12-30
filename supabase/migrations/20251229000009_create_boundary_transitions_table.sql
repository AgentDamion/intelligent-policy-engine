-- Migration: 20251229000009_create_boundary_transitions_table.sql
-- Purpose: Create boundary_transitions table for cross-enterprise tracking
-- Context Graph Phase 2: Context Capture Enhancement
--
-- This is the CORE of AICOMPLYR's differentiation:
-- - Explicit record of every enterprise-partner boundary crossing
-- - Captures the "seam" that no GRC incumbent can see
-- - Enables network intelligence across the boundary

BEGIN;

-- ============================================================
-- PART 1: Create boundary_transitions table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.boundary_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to governance action that triggered this transition
  governance_action_id UUID NOT NULL REFERENCES public.governance_actions(id) ON DELETE CASCADE,
  
  -- The enterprises involved
  from_enterprise_id UUID NOT NULL REFERENCES public.enterprises(id),
  to_enterprise_id UUID NOT NULL REFERENCES public.enterprises(id),
  
  -- Type of transition
  transition_type TEXT NOT NULL CHECK (transition_type IN (
    'submission',       -- Partner → Enterprise (request for approval)
    'approval',         -- Enterprise → Partner (decision granted)
    'rejection',        -- Enterprise → Partner (decision denied)
    'escalation',       -- Partner → Enterprise (exception/override request)
    'delegation',       -- Enterprise → Partner (authority grant)
    'information',      -- Either direction (info request/response)
    'notification'      -- Either direction (status update)
  )),
  
  -- Visibility snapshot at transition time (immutable record)
  visibility_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Context at transition
  brand_id TEXT,
  workflow_step TEXT,
  
  -- Metrics for intelligence
  transition_latency_ms INTEGER,     -- Time from trigger to transition
  decision_confidence NUMERIC(5,4),  -- 0.0000 to 1.0000
  risk_score NUMERIC(5,4),           -- 0.0000 to 1.0000
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure from and to are different
  CONSTRAINT boundary_different_enterprises 
    CHECK (from_enterprise_id != to_enterprise_id)
);

-- ============================================================
-- PART 2: Indexes for efficient queries
-- ============================================================

-- Primary lookup patterns
CREATE INDEX IF NOT EXISTS idx_boundary_transitions_action
ON public.boundary_transitions(governance_action_id);

CREATE INDEX IF NOT EXISTS idx_boundary_transitions_from
ON public.boundary_transitions(from_enterprise_id);

CREATE INDEX IF NOT EXISTS idx_boundary_transitions_to
ON public.boundary_transitions(to_enterprise_id);

-- Composite index for relationship queries
CREATE INDEX IF NOT EXISTS idx_boundary_transitions_relationship
ON public.boundary_transitions(from_enterprise_id, to_enterprise_id, transition_type);

-- Time-based queries for analytics
CREATE INDEX IF NOT EXISTS idx_boundary_transitions_created
ON public.boundary_transitions(created_at DESC);

-- Brand-specific queries
CREATE INDEX IF NOT EXISTS idx_boundary_transitions_brand
ON public.boundary_transitions(brand_id)
WHERE brand_id IS NOT NULL;

-- Transition type analytics
CREATE INDEX IF NOT EXISTS idx_boundary_transitions_type
ON public.boundary_transitions(transition_type);

-- ============================================================
-- PART 3: Trigger to auto-create boundary transitions
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_boundary_transition()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_enterprise_id UUID;
  v_visibility_snapshot JSONB;
  v_msa_record RECORD;
  v_transition_type TEXT;
BEGIN
  -- Only process boundary actions
  IF NOT COALESCE(NEW.is_boundary_action, false) THEN
    RETURN NEW;
  END IF;
  
  -- Get thread's enterprise
  SELECT enterprise_id INTO v_thread_enterprise_id
  FROM public.governance_threads
  WHERE id = NEW.thread_id;
  
  -- Determine transition type from action type
  v_transition_type := CASE NEW.action_type
    WHEN 'submit' THEN 'submission'
    WHEN 'approve' THEN 'approval'
    WHEN 'HumanApproveDecision' THEN 'approval'
    WHEN 'AgentAutoApprove' THEN 'approval'
    WHEN 'reject' THEN 'rejection'
    WHEN 'HumanBlockDecision' THEN 'rejection'
    WHEN 'AgentAutoBlock' THEN 'rejection'
    WHEN 'escalate' THEN 'escalation'
    WHEN 'HumanEscalate' THEN 'escalation'
    WHEN 'request_info' THEN 'information'
    WHEN 'HumanRequestChanges' THEN 'information'
    WHEN 'provide_info' THEN 'information'
    ELSE 'notification'
  END;
  
  -- Get MSA visibility settings
  SELECT 
    jsonb_build_object(
      'visibility_level', mv.visibility_level,
      'overrides', mv.overrides,
      'effective_date', mv.effective_date,
      'msa_reference', mv.msa_reference
    ) INTO v_visibility_snapshot
  FROM public.msa_visibility mv
  WHERE (
    (mv.agency_enterprise_id = NEW.actor_enterprise_id AND mv.client_enterprise_id = v_thread_enterprise_id) OR
    (mv.agency_enterprise_id = v_thread_enterprise_id AND mv.client_enterprise_id = NEW.actor_enterprise_id)
  )
  AND (mv.effective_date IS NULL OR mv.effective_date <= CURRENT_DATE)
  AND (mv.expiration_date IS NULL OR mv.expiration_date > CURRENT_DATE)
  LIMIT 1;
  
  -- Default visibility snapshot if no MSA found
  v_visibility_snapshot := COALESCE(v_visibility_snapshot, jsonb_build_object(
    'visibility_level', 'role_only',
    'overrides', '{}'::jsonb,
    'note', 'No MSA visibility configuration found'
  ));
  
  -- Add capture timestamp
  v_visibility_snapshot := v_visibility_snapshot || jsonb_build_object('captured_at', NOW());
  
  -- Insert the boundary transition
  INSERT INTO public.boundary_transitions (
    governance_action_id,
    from_enterprise_id,
    to_enterprise_id,
    transition_type,
    visibility_snapshot,
    workflow_step,
    decision_confidence,
    risk_score
  )
  VALUES (
    NEW.id,
    NEW.actor_enterprise_id,
    v_thread_enterprise_id,
    v_transition_type,
    v_visibility_snapshot,
    (NEW.metadata->>'workflow_step'),
    (NEW.metadata->>'confidence')::NUMERIC,
    (NEW.metadata->>'risk_score')::NUMERIC
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_boundary_transition IS 
'Auto-creates boundary transition records when governance actions cross enterprise boundaries.
This is the core data structure for AICOMPLYR''s cross-boundary intelligence.';

-- Create the AFTER INSERT trigger
DROP TRIGGER IF EXISTS trg_create_boundary_transition ON public.governance_actions;
CREATE TRIGGER trg_create_boundary_transition
  AFTER INSERT ON public.governance_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_boundary_transition();

-- ============================================================
-- PART 4: Analytics functions
-- ============================================================

-- Get transition statistics for a relationship
CREATE OR REPLACE FUNCTION public.get_boundary_transition_stats(
  p_from_enterprise_id UUID,
  p_to_enterprise_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  transition_type TEXT,
  transition_count INTEGER,
  avg_latency_ms NUMERIC,
  avg_confidence NUMERIC,
  avg_risk_score NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    bt.transition_type,
    COUNT(*)::INTEGER as transition_count,
    AVG(bt.transition_latency_ms) as avg_latency_ms,
    AVG(bt.decision_confidence) as avg_confidence,
    AVG(bt.risk_score) as avg_risk_score
  FROM public.boundary_transitions bt
  WHERE bt.from_enterprise_id = p_from_enterprise_id
    AND bt.to_enterprise_id = p_to_enterprise_id
    AND bt.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY bt.transition_type
  ORDER BY transition_count DESC;
$$;

COMMENT ON FUNCTION public.get_boundary_transition_stats IS 
'Returns transition statistics for an enterprise relationship.
Used for partnership health monitoring and compliance scoring.';

-- Get approval rate for a relationship
CREATE OR REPLACE FUNCTION public.get_approval_rate(
  p_agency_enterprise_id UUID,
  p_client_enterprise_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_submissions INTEGER,
  total_approvals INTEGER,
  total_rejections INTEGER,
  approval_rate NUMERIC,
  avg_decision_time_hours NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH transitions AS (
    SELECT 
      bt.transition_type,
      bt.created_at,
      LAG(bt.created_at) OVER (
        PARTITION BY bt.governance_action_id 
        ORDER BY bt.created_at
      ) as prev_transition_at
    FROM public.boundary_transitions bt
    WHERE (
      (bt.from_enterprise_id = p_agency_enterprise_id AND bt.to_enterprise_id = p_client_enterprise_id) OR
      (bt.from_enterprise_id = p_client_enterprise_id AND bt.to_enterprise_id = p_agency_enterprise_id)
    )
    AND bt.created_at >= NOW() - (p_days || ' days')::INTERVAL
  )
  SELECT 
    COUNT(*) FILTER (WHERE transition_type = 'submission')::INTEGER as total_submissions,
    COUNT(*) FILTER (WHERE transition_type = 'approval')::INTEGER as total_approvals,
    COUNT(*) FILTER (WHERE transition_type = 'rejection')::INTEGER as total_rejections,
    CASE 
      WHEN COUNT(*) FILTER (WHERE transition_type IN ('approval', 'rejection')) > 0 THEN
        ROUND(
          COUNT(*) FILTER (WHERE transition_type = 'approval')::NUMERIC / 
          COUNT(*) FILTER (WHERE transition_type IN ('approval', 'rejection'))::NUMERIC,
          4
        )
      ELSE 0
    END as approval_rate,
    AVG(
      EXTRACT(EPOCH FROM (created_at - prev_transition_at)) / 3600
    ) FILTER (WHERE transition_type IN ('approval', 'rejection')) as avg_decision_time_hours
  FROM transitions;
$$;

COMMENT ON FUNCTION public.get_approval_rate IS 
'Calculates approval rate and decision timing for an agency-client relationship.
Core metric for partnership compliance scoring.';

-- ============================================================
-- PART 5: Enable RLS (policies added in separate migration)
-- ============================================================

ALTER TABLE public.boundary_transitions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 6: Comments for documentation
-- ============================================================

COMMENT ON TABLE public.boundary_transitions IS 
'Records every crossing of the enterprise-partner boundary.
This is the CORE of AICOMPLYR''s differentiation - the explicit record
of every boundary crossing that no GRC incumbent captures.';

COMMENT ON COLUMN public.boundary_transitions.visibility_snapshot IS 
'Immutable snapshot of MSA visibility settings at transition time.
Ensures audit integrity even if MSA is later modified.';

COMMENT ON COLUMN public.boundary_transitions.transition_type IS 
'Type of boundary crossing: submission, approval, rejection, escalation, delegation, information, notification';

COMMIT;

