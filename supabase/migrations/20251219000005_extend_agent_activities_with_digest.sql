-- =============================================================================
-- MIGRATION: 005_extend_agent_activities_with_digest
-- PURPOSE: Track which policy digest each agent decision was made under
-- =============================================================================

-- Extend agent_activities table
ALTER TABLE public.agent_activities
  ADD COLUMN IF NOT EXISTS policy_digest TEXT,
  ADD COLUMN IF NOT EXISTS trace_id TEXT,
  ADD COLUMN IF NOT EXISTS span_id TEXT;

-- Extend ai_agent_decisions table
ALTER TABLE public.ai_agent_decisions
  ADD COLUMN IF NOT EXISTS policy_digest TEXT,
  ADD COLUMN IF NOT EXISTS policy_artifact_reference TEXT;

-- Indexes for trace correlation on agent_activities
CREATE INDEX IF NOT EXISTS idx_agent_activities_trace_id 
  ON public.agent_activities(trace_id) WHERE trace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_activities_policy_digest 
  ON public.agent_activities(policy_digest) WHERE policy_digest IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_activities_span_id 
  ON public.agent_activities(span_id) WHERE span_id IS NOT NULL;

-- Indexes for ai_agent_decisions
CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_policy_digest 
  ON public.ai_agent_decisions(policy_digest) WHERE policy_digest IS NOT NULL;

COMMENT ON COLUMN public.agent_activities.policy_digest IS 'OCI digest of policy governing this agent execution';
COMMENT ON COLUMN public.agent_activities.trace_id IS 'W3C trace ID for distributed tracing correlation';
COMMENT ON COLUMN public.agent_activities.span_id IS 'W3C span ID for this specific operation';
COMMENT ON COLUMN public.ai_agent_decisions.policy_digest IS 'Immutable policy reference for decision audit trail';
COMMENT ON COLUMN public.ai_agent_decisions.policy_artifact_reference IS 'Full OCI reference (registry/repo@digest) for the governing policy';

-- =============================================================================
-- FUNCTION: Get all agent activities for a trace
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_agent_activities_by_trace(
  p_trace_id TEXT
)
RETURNS TABLE (
  activity_id BIGINT,
  agent TEXT,
  action TEXT,
  status TEXT,
  policy_digest TEXT,
  span_id TEXT,
  enterprise_id UUID,
  created_at TIMESTAMPTZ,
  details JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.id AS activity_id,
    aa.agent,
    aa.action,
    aa.status,
    aa.policy_digest,
    aa.span_id,
    aa.enterprise_id,
    aa.created_at,
    aa.details
  FROM public.agent_activities aa
  WHERE aa.trace_id = p_trace_id
  ORDER BY aa.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: Get all decisions for a policy digest
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_decisions_by_policy_digest(
  p_policy_digest TEXT,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  decision_id BIGINT,
  agent TEXT,
  action TEXT,
  outcome TEXT,
  risk TEXT,
  enterprise_id UUID,
  created_at TIMESTAMPTZ,
  details JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ad.id AS decision_id,
    ad.agent,
    ad.action,
    ad.outcome,
    ad.risk,
    ad.enterprise_id,
    ad.created_at,
    ad.details
  FROM public.ai_agent_decisions ad
  WHERE ad.policy_digest = p_policy_digest
  ORDER BY ad.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_agent_activities_by_trace IS 'Get all agent activities associated with a W3C trace ID';
COMMENT ON FUNCTION public.get_decisions_by_policy_digest IS 'Get all AI agent decisions made under a specific policy digest';



