-- Migration: 20251230000001_add_workspace_context_metrics.sql
-- Purpose: Add functions for workspace compliance scores and pending action counts
-- Context Graph Phase 1: Enhanced Context Switcher
--
-- This migration adds helper functions to calculate workspace metrics for the context switcher:
-- - Compliance scores per workspace
-- - Pending action counts per workspace
-- - Brand workspace access helpers

BEGIN;

-- ============================================================
-- PART 1: Get workspace compliance score
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_workspace_compliance_score(p_workspace_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_score INTEGER := 0;
  v_enterprise_id UUID;
BEGIN
  -- Get enterprise_id for the workspace
  SELECT enterprise_id INTO v_enterprise_id
  FROM public.workspaces
  WHERE id = p_workspace_id;

  IF v_enterprise_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate compliance score based on recent decisions
  -- Score = percentage of approved decisions in last 30 days
  WITH recent_decisions AS (
    SELECT 
      outcome,
      COUNT(*) as decision_count
    FROM public.audit_events
    WHERE workspace_id = p_workspace_id
      AND created_at >= NOW() - INTERVAL '30 days'
      AND outcome IN ('approved', 'approved_with_conditions', 'denied', 'rejected')
    GROUP BY outcome
  ),
  totals AS (
    SELECT 
      COALESCE(SUM(CASE WHEN outcome IN ('approved', 'approved_with_conditions') THEN decision_count ELSE 0 END), 0) as approved_count,
      COALESCE(SUM(decision_count), 0) as total_count
    FROM recent_decisions
  )
  SELECT 
    CASE 
      WHEN total_count > 0 THEN ROUND((approved_count::DECIMAL / total_count) * 100)
      ELSE 85 -- Default score if no recent decisions
    END
  INTO v_score
  FROM totals;

  RETURN LEAST(100, GREATEST(0, v_score));
END;
$$;

COMMENT ON FUNCTION public.get_workspace_compliance_score IS 
'Returns compliance score (0-100) for a workspace based on recent decision outcomes. 
Score is percentage of approved decisions in last 30 days. Defaults to 85 if no recent activity.';

-- ============================================================
-- PART 2: Get workspace pending action count
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_workspace_pending_count(p_workspace_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Count pending governance threads for this workspace
  SELECT COUNT(*)
  INTO v_count
  FROM public.governance_threads
  WHERE workspace_id = p_workspace_id
    AND status IN ('open', 'pending_human', 'in_review', 'pending_approval');

  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION public.get_workspace_pending_count IS 
'Returns count of pending actions (governance threads) for a workspace. 
Includes threads with status: open, pending_human, in_review, pending_approval.';

-- ============================================================
-- PART 3: Get user accessible workspaces with metrics
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_accessible_workspaces(p_user_id UUID)
RETURNS TABLE (
  workspace_id UUID,
  workspace_name TEXT,
  enterprise_id UUID,
  enterprise_name TEXT,
  tenancy_type TEXT,
  user_role TEXT,
  compliance_score INTEGER,
  pending_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as workspace_id,
    w.name as workspace_name,
    e.id as enterprise_id,
    e.name as enterprise_name,
    COALESCE(e.tenancy_type, 'owning')::TEXT as tenancy_type,
    wm.role::TEXT as user_role,
    public.get_workspace_compliance_score(w.id) as compliance_score,
    public.get_workspace_pending_count(w.id) as pending_count
  FROM public.workspace_members wm
  JOIN public.workspaces w ON w.id = wm.workspace_id
  JOIN public.enterprises e ON e.id = w.enterprise_id
  WHERE wm.user_id = p_user_id
    AND wm.role IS NOT NULL
  ORDER BY 
    e.tenancy_type DESC, -- owning first, then shared
    e.name,
    w.name;
END;
$$;

COMMENT ON FUNCTION public.get_user_accessible_workspaces IS 
'Returns all workspaces accessible to a user with compliance scores and pending counts.
Results are grouped by tenancy type (owning first) and sorted by enterprise/workspace name.';

-- ============================================================
-- PART 4: Get workspace brands
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_workspace_brands(p_workspace_id UUID)
RETURNS TABLE (
  brand_id UUID,
  brand_name TEXT,
  workspace_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if brand_workspaces table exists and has data
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'brand_workspaces'
  ) THEN
    RETURN QUERY
    SELECT 
      bw.id as brand_id,
      bw.name as brand_name,
      bw.agency_workspace_id as workspace_id
    FROM public.brand_workspaces bw
    WHERE bw.agency_workspace_id = p_workspace_id
      AND bw.is_active = true
    ORDER BY bw.name;
  ELSE
    -- Return empty result if table doesn't exist
    RETURN;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_workspace_brands IS 
'Returns all active brands for a workspace. Returns empty if brand_workspaces table does not exist.';

-- ============================================================
-- PART 5: Indexes for performance
-- ============================================================

-- Index for workspace compliance score queries (conditional - only if outcome column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'audit_events' 
      AND column_name = 'outcome'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_audit_events_workspace_compliance
    ON public.audit_events(workspace_id, created_at, outcome)
    WHERE outcome IN ('approved', 'approved_with_conditions', 'denied', 'rejected');
  ELSE
    RAISE NOTICE 'Skipping idx_audit_events_workspace_compliance: outcome column does not exist';
  END IF;
END
$$;

-- Index for workspace pending count queries (conditional - only if governance_threads.workspace_id exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'governance_threads'
      AND column_name = 'workspace_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_governance_threads_workspace_pending
    ON public.governance_threads(workspace_id, status)
    WHERE status IN ('open', 'pending_human', 'in_review', 'pending_approval');
  ELSE
    RAISE NOTICE 'Skipping idx_governance_threads_workspace_pending: workspace_id column does not exist';
  END IF;
END
$$;

-- Index for user workspace access queries (conditional - only if workspace_members.user_id exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'workspace_members'
      AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_workspace_members_user_workspace
    ON public.workspace_members(user_id, workspace_id);
  ELSE
    RAISE NOTICE 'Skipping idx_workspace_members_user_workspace: user_id column does not exist';
  END IF;
END
$$;

COMMIT;

