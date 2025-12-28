-- Migration: 20251228000005_agent_trace_enrichment.sql
-- Purpose: Week 8 - Agent Trace Enrichment
-- PRD Phase 2: Structured reasoning traces with alternatives

BEGIN;

-- ============================================================
-- PART 1: Add structured reasoning columns to agent_activities
-- ============================================================

ALTER TABLE public.agent_activities
ADD COLUMN IF NOT EXISTS reasoning_steps JSONB,
ADD COLUMN IF NOT EXISTS alternatives_considered JSONB,
ADD COLUMN IF NOT EXISTS confidence_factors JSONB,
ADD COLUMN IF NOT EXISTS precedents_consulted UUID[];

COMMENT ON COLUMN public.agent_activities.reasoning_steps IS 
'Structured array of reasoning steps: [{step, consideration, evidence, weight}]';

COMMENT ON COLUMN public.agent_activities.alternatives_considered IS 
'Array of rejected alternatives: [{option, reason, confidence}]';

COMMENT ON COLUMN public.agent_activities.confidence_factors IS 
'Breakdown of confidence calculation: {policy_match, precedent_alignment, risk_factors}';

COMMENT ON COLUMN public.agent_activities.precedents_consulted IS 
'Array of governance action IDs that were consulted as precedents';

-- ============================================================
-- PART 2: Add structured reasoning to ai_agent_decisions
-- ============================================================

ALTER TABLE public.ai_agent_decisions
ADD COLUMN IF NOT EXISTS reasoning_chain JSONB,
ADD COLUMN IF NOT EXISTS decision_factors JSONB,
ADD COLUMN IF NOT EXISTS alternative_outcomes JSONB;

COMMENT ON COLUMN public.ai_agent_decisions.reasoning_chain IS 
'Full chain of reasoning from input to decision';

COMMENT ON COLUMN public.ai_agent_decisions.decision_factors IS 
'Weighted factors that influenced the decision';

COMMENT ON COLUMN public.ai_agent_decisions.alternative_outcomes IS 
'Other possible outcomes that were considered and rejected';

-- ============================================================
-- PART 3: Create indexes for reasoning analysis
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_agent_activities_reasoning
ON public.agent_activities USING gin(reasoning_steps jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_agent_activities_alternatives
ON public.agent_activities USING gin(alternatives_considered jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_agent_activities_precedents
ON public.agent_activities USING gin(precedents_consulted);

-- ============================================================
-- PART 4: Add reasoning trace to governance_actions
-- ============================================================

ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS reasoning_trace JSONB;

COMMENT ON COLUMN public.governance_actions.reasoning_trace IS 
'Structured reasoning trace for agent-initiated actions';

-- ============================================================
-- PART 5: Create function to analyze reasoning patterns
-- ============================================================

CREATE OR REPLACE FUNCTION public.analyze_agent_reasoning_patterns(
  p_enterprise_id UUID,
  p_agent_name TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  pattern_type TEXT,
  pattern_count INTEGER,
  avg_confidence NUMERIC,
  common_factors JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH reasoning_data AS (
    SELECT 
      aa.agent_name,
      aa.action,
      aa.reasoning_steps,
      aa.confidence_factors,
      (aa.output->>'confidence')::NUMERIC as confidence
    FROM public.agent_activities aa
    WHERE aa.enterprise_id = p_enterprise_id
      AND aa.created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND (p_agent_name IS NULL OR aa.agent_name = p_agent_name)
      AND aa.reasoning_steps IS NOT NULL
  )
  SELECT 
    rd.action as pattern_type,
    COUNT(*)::INTEGER as pattern_count,
    AVG(rd.confidence) as avg_confidence,
    jsonb_agg(DISTINCT rd.confidence_factors) FILTER (WHERE rd.confidence_factors IS NOT NULL) as common_factors
  FROM reasoning_data rd
  GROUP BY rd.action
  ORDER BY pattern_count DESC;
$$;

COMMENT ON FUNCTION public.analyze_agent_reasoning_patterns IS 
'Analyzes reasoning patterns for agents to identify common decision factors and trends.';

COMMIT;

