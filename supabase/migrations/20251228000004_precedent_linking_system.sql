-- Migration: 20251228000004_precedent_linking_system.sql
-- Purpose: Week 5 - Precedent Linking Algorithm
-- PRD Phase 2: Graph Intelligence Layer

BEGIN;

-- ============================================================
-- PART 1: Create text similarity function using pg_trgm
-- ============================================================

-- Ensure pg_trgm extension is enabled (should be from previous migration)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index for trigram similarity searches on rationale
CREATE INDEX IF NOT EXISTS idx_governance_actions_rationale_trgm
ON public.governance_actions USING gin(rationale gin_trgm_ops);

-- ============================================================
-- PART 2: Find similar governance decisions function
-- ============================================================

CREATE OR REPLACE FUNCTION public.find_similar_governance_decisions(
  p_thread_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_min_similarity NUMERIC DEFAULT 0.3,
  p_include_resolved BOOLEAN DEFAULT true,
  p_same_enterprise_only BOOLEAN DEFAULT true,
  p_time_window_days INTEGER DEFAULT 365
)
RETURNS TABLE (
  action_id UUID,
  thread_id UUID,
  action_type TEXT,
  rationale TEXT,
  outcome TEXT,
  similarity_score NUMERIC,
  decision_date TIMESTAMPTZ,
  enterprise_id UUID,
  brand TEXT,
  region TEXT,
  channel TEXT,
  tool_vendor TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_source_rationale TEXT;
  v_source_enterprise_id UUID;
  v_source_created_at TIMESTAMPTZ;
BEGIN
  -- Get source thread's latest action with decision rationale
  SELECT 
    ga.rationale,
    gt.enterprise_id,
    ga.created_at
  INTO v_source_rationale, v_source_enterprise_id, v_source_created_at
  FROM public.governance_actions ga
  JOIN public.governance_threads gt ON ga.thread_id = gt.id
  WHERE ga.thread_id = p_thread_id
    AND ga.action_type IN ('approve', 'reject', 'escalate', 'HumanApproveDecision', 
                           'HumanBlockDecision', 'AgentAutoApprove', 'AgentAutoBlock',
                           'draft_decision', 'auto_clear')
  ORDER BY ga.created_at DESC
  LIMIT 1;
  
  IF v_source_rationale IS NULL THEN
    RETURN; -- No source rationale found
  END IF;
  
  RETURN QUERY
  SELECT 
    ga.id as action_id,
    ga.thread_id,
    ga.action_type::TEXT,
    ga.rationale,
    CASE 
      WHEN ga.action_type IN ('approve', 'HumanApproveDecision', 'AgentAutoApprove', 'auto_clear') THEN 'approved'
      WHEN ga.action_type IN ('reject', 'HumanBlockDecision', 'AgentAutoBlock') THEN 'blocked'
      WHEN ga.action_type = 'escalate' THEN 'escalated'
      ELSE 'pending'
    END as outcome,
    similarity(ga.rationale, v_source_rationale) as similarity_score,
    ga.created_at as decision_date,
    gt.enterprise_id,
    (gt.metadata->>'brand')::TEXT as brand,
    (gt.metadata->>'region')::TEXT as region,
    (gt.metadata->>'channel')::TEXT as channel,
    (ga.metadata->>'tool_vendor')::TEXT as tool_vendor
  FROM public.governance_actions ga
  JOIN public.governance_threads gt ON ga.thread_id = gt.id
  WHERE 
    -- Don't match the source thread
    ga.thread_id != p_thread_id
    -- Only match decision actions
    AND ga.action_type IN ('approve', 'reject', 'escalate', 'HumanApproveDecision', 
                           'HumanBlockDecision', 'AgentAutoApprove', 'AgentAutoBlock',
                           'draft_decision', 'auto_clear')
    -- Filter by similarity threshold
    AND similarity(ga.rationale, v_source_rationale) >= p_min_similarity
    -- Filter by time window
    AND ga.created_at >= NOW() - (p_time_window_days || ' days')::INTERVAL
    -- Enterprise filter
    AND (NOT p_same_enterprise_only OR gt.enterprise_id = v_source_enterprise_id)
    -- Resolved filter
    AND (p_include_resolved OR gt.status NOT IN ('approved', 'blocked', 'resolved', 'cancelled'))
  ORDER BY 
    similarity(ga.rationale, v_source_rationale) DESC,
    ga.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.find_similar_governance_decisions IS 
'Finds similar governance decisions using trigram text similarity on rationale. 
Used for precedent linking and decision intelligence.';

-- ============================================================
-- PART 3: Get precedent chain function
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_precedent_chain(
  p_action_id UUID,
  p_max_depth INTEGER DEFAULT 5
)
RETURNS TABLE (
  action_id UUID,
  depth INTEGER,
  influence_score NUMERIC,
  rationale TEXT,
  outcome TEXT,
  decision_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE precedent_tree AS (
    -- Base case: direct precedents
    SELECT 
      unnest(ga.precedent_action_ids) as action_id,
      1 as depth,
      ga.precedent_influence_score as influence_score
    FROM public.governance_actions ga
    WHERE ga.id = p_action_id
      AND ga.precedent_action_ids IS NOT NULL
    
    UNION ALL
    
    -- Recursive case: precedents of precedents
    SELECT 
      unnest(ga.precedent_action_ids),
      pt.depth + 1,
      pt.influence_score * COALESCE(ga.precedent_influence_score, 0.5)
    FROM precedent_tree pt
    JOIN public.governance_actions ga ON ga.id = pt.action_id
    WHERE pt.depth < p_max_depth
      AND ga.precedent_action_ids IS NOT NULL
  )
  SELECT DISTINCT ON (pt.action_id)
    pt.action_id,
    pt.depth,
    pt.influence_score,
    ga.rationale,
    CASE 
      WHEN ga.action_type IN ('approve', 'HumanApproveDecision', 'AgentAutoApprove', 'auto_clear') THEN 'approved'
      WHEN ga.action_type IN ('reject', 'HumanBlockDecision', 'AgentAutoBlock') THEN 'blocked'
      WHEN ga.action_type = 'escalate' THEN 'escalated'
      ELSE 'pending'
    END as outcome,
    ga.created_at as decision_date
  FROM precedent_tree pt
  JOIN public.governance_actions ga ON ga.id = pt.action_id
  ORDER BY pt.action_id, pt.depth;
END;
$$;

COMMENT ON FUNCTION public.get_precedent_chain IS 
'Retrieves the full chain of precedent decisions that influenced an action.
Uses recursive CTE to traverse the precedent graph up to max_depth.';

-- ============================================================
-- PART 4: Calculate action similarity function
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_action_similarity(
  p_action1_id UUID,
  p_action2_id UUID
)
RETURNS NUMERIC
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT similarity(a1.rationale, a2.rationale)
  FROM public.governance_actions a1, public.governance_actions a2
  WHERE a1.id = p_action1_id AND a2.id = p_action2_id;
$$;

COMMENT ON FUNCTION public.calculate_action_similarity IS 
'Calculates trigram similarity between two governance action rationales.';

-- ============================================================
-- PART 5: Precedent statistics function
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_precedent_statistics(
  p_enterprise_id UUID
)
RETURNS TABLE (
  total_decisions INTEGER,
  decisions_with_precedents INTEGER,
  average_precedent_count NUMERIC,
  precedent_coverage NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COUNT(*)::INTEGER as total_decisions,
    COUNT(*) FILTER (WHERE ga.precedent_action_ids IS NOT NULL AND array_length(ga.precedent_action_ids, 1) > 0)::INTEGER as decisions_with_precedents,
    COALESCE(AVG(array_length(ga.precedent_action_ids, 1)) FILTER (WHERE ga.precedent_action_ids IS NOT NULL), 0) as average_precedent_count,
    COALESCE(
      (COUNT(*) FILTER (WHERE ga.precedent_action_ids IS NOT NULL AND array_length(ga.precedent_action_ids, 1) > 0)::NUMERIC / 
       NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
      0
    ) as precedent_coverage
  FROM public.governance_actions ga
  JOIN public.governance_threads gt ON ga.thread_id = gt.id
  WHERE gt.enterprise_id = p_enterprise_id
    AND ga.action_type IN ('approve', 'reject', 'escalate', 'HumanApproveDecision', 
                           'HumanBlockDecision', 'AgentAutoApprove', 'AgentAutoBlock',
                           'draft_decision', 'auto_clear');
$$;

COMMENT ON FUNCTION public.get_precedent_statistics IS 
'Returns precedent linking statistics for an enterprise for analytics dashboards.';

COMMIT;

