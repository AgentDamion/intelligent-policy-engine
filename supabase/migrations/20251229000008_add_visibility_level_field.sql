-- Migration: 20251229000008_add_visibility_level_field.sql
-- Purpose: Add visibility_level field to governance_actions
-- Context Graph Phase 2: Context Capture Enhancement
--
-- This records the MSA visibility level at action time:
-- - Enables MSA-compliant context sharing
-- - Supports cross-enterprise benchmarking with privacy
-- - Records what visibility was in effect when action occurred

BEGIN;

-- ============================================================
-- PART 1: Add visibility_level column to governance_actions
-- ============================================================

ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS visibility_level TEXT 
  CHECK (visibility_level IS NULL OR visibility_level IN ('role_only', 'person_level', 'full_detail'));

-- Index for visibility queries
CREATE INDEX IF NOT EXISTS idx_governance_actions_visibility
ON public.governance_actions(visibility_level)
WHERE visibility_level IS NOT NULL;

-- ============================================================
-- PART 2: Add cross-enterprise context columns
-- ============================================================

-- The enterprise that can view this action (if different from actor's enterprise)
ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS viewing_enterprise_id UUID REFERENCES public.enterprises(id);

-- Whether this action crosses an enterprise boundary
ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS is_boundary_action BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_governance_actions_boundary
ON public.governance_actions(is_boundary_action)
WHERE is_boundary_action = true;

-- ============================================================
-- PART 3: Trigger to auto-populate visibility fields
-- ============================================================

CREATE OR REPLACE FUNCTION public.populate_action_visibility()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_enterprise_id UUID;
  v_actor_enterprise_id UUID;
  v_visibility TEXT;
BEGIN
  -- Get thread's enterprise
  SELECT enterprise_id INTO v_thread_enterprise_id
  FROM public.governance_threads
  WHERE id = NEW.thread_id;
  
  -- Get actor's enterprise (if human)
  IF NEW.actor_type = 'human' AND NEW.actor_id IS NOT NULL THEN
    SELECT uc.enterprise_id INTO v_actor_enterprise_id
    FROM public.user_contexts uc
    WHERE uc.user_id = NEW.actor_id
      AND uc.is_active = true
      AND uc.is_default = true
    LIMIT 1;
  END IF;
  
  -- Determine if this is a boundary action
  IF v_actor_enterprise_id IS NOT NULL AND v_actor_enterprise_id != v_thread_enterprise_id THEN
    NEW.is_boundary_action := true;
    NEW.viewing_enterprise_id := v_thread_enterprise_id;
    
    -- Look up visibility level from MSA
    SELECT mv.visibility_level INTO v_visibility
    FROM public.msa_visibility mv
    WHERE (
      (mv.agency_enterprise_id = v_actor_enterprise_id AND mv.client_enterprise_id = v_thread_enterprise_id) OR
      (mv.agency_enterprise_id = v_thread_enterprise_id AND mv.client_enterprise_id = v_actor_enterprise_id)
    )
    AND (mv.effective_date IS NULL OR mv.effective_date <= CURRENT_DATE)
    AND (mv.expiration_date IS NULL OR mv.expiration_date > CURRENT_DATE)
    LIMIT 1;
    
    NEW.visibility_level := COALESCE(v_visibility, 'role_only');
  ELSE
    NEW.is_boundary_action := false;
    NEW.visibility_level := 'full_detail';  -- Same enterprise = full visibility
  END IF;
  
  -- Set actor_enterprise_id if not already set
  IF NEW.actor_enterprise_id IS NULL THEN
    NEW.actor_enterprise_id := COALESCE(v_actor_enterprise_id, v_thread_enterprise_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.populate_action_visibility IS 
'Auto-populates visibility fields on governance actions based on MSA settings.
Determines if action crosses enterprise boundary and applies appropriate visibility.';

-- Create the trigger (only if msa_visibility table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'msa_visibility'
  ) THEN
    DROP TRIGGER IF EXISTS trg_populate_action_visibility ON public.governance_actions;
    CREATE TRIGGER trg_populate_action_visibility
      BEFORE INSERT ON public.governance_actions
      FOR EACH ROW
      EXECUTE FUNCTION public.populate_action_visibility();
  END IF;
END $$;

-- ============================================================
-- PART 4: View for cross-enterprise action summary
-- ============================================================

CREATE OR REPLACE VIEW public.boundary_actions_summary AS
SELECT 
  ga.id as action_id,
  ga.thread_id,
  ga.action_type,
  ga.actor_type,
  ga.is_boundary_action,
  ga.visibility_level,
  ga.actor_enterprise_id,
  ga.viewing_enterprise_id,
  ae_actor.name as actor_enterprise_name,
  ae_viewer.name as viewing_enterprise_name,
  ga.created_at
FROM public.governance_actions ga
LEFT JOIN public.enterprises ae_actor ON ae_actor.id = ga.actor_enterprise_id
LEFT JOIN public.enterprises ae_viewer ON ae_viewer.id = ga.viewing_enterprise_id
WHERE ga.is_boundary_action = true;

COMMENT ON VIEW public.boundary_actions_summary IS 
'Summary of actions that cross enterprise boundaries.
Useful for analyzing cross-enterprise governance patterns.';

-- ============================================================
-- PART 5: Function to get visible actions for an enterprise
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_visible_actions_for_enterprise(
  p_enterprise_id UUID,
  p_thread_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  action_id UUID,
  thread_id UUID,
  action_type TEXT,
  actor_type TEXT,
  actor_info JSONB,
  rationale TEXT,
  visibility_level TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    ga.id as action_id,
    ga.thread_id,
    ga.action_type,
    ga.actor_type,
    -- Apply visibility masking
    CASE ga.visibility_level
      WHEN 'full_detail' THEN jsonb_build_object(
        'actor_id', ga.actor_id,
        'actor_role', ga.actor_role,
        'actor_enterprise_id', ga.actor_enterprise_id
      )
      WHEN 'person_level' THEN jsonb_build_object(
        'actor_id', ga.actor_id,
        'actor_role', NULL,
        'actor_enterprise_id', ga.actor_enterprise_id
      )
      ELSE jsonb_build_object(
        'actor_id', NULL,
        'actor_role', ga.actor_role,
        'actor_enterprise_id', ga.actor_enterprise_id
      )
    END as actor_info,
    ga.rationale,
    ga.visibility_level,
    ga.created_at
  FROM public.governance_actions ga
  JOIN public.governance_threads gt ON gt.id = ga.thread_id
  WHERE gt.enterprise_id = p_enterprise_id
    AND (p_thread_id IS NULL OR ga.thread_id = p_thread_id)
  ORDER BY ga.created_at DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.get_visible_actions_for_enterprise IS 
'Returns governance actions visible to an enterprise with MSA visibility applied.
Actor information is masked according to the visibility_level.';

-- ============================================================
-- PART 6: Comments for documentation
-- ============================================================

COMMENT ON COLUMN public.governance_actions.visibility_level IS 
'MSA visibility level in effect when this action occurred.
Determines what cross-enterprise viewers can see about this action.';

COMMENT ON COLUMN public.governance_actions.viewing_enterprise_id IS 
'The enterprise that can view this action (if different from actor''s enterprise).
NULL for same-enterprise actions.';

COMMENT ON COLUMN public.governance_actions.is_boundary_action IS 
'True if this action crosses an enterprise boundary.
Boundary actions are the core of AICOMPLYR''s differentiation.';

COMMIT;

