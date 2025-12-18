-- Migration: Add policy_insights table and supporting functions for PolicyMaintenanceAgent

-- Create policy_insights table
CREATE TABLE IF NOT EXISTS policy_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('anomaly', 'optimization', 'compliance', 'cleanup')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_policies UUID[] NOT NULL DEFAULT '{}',
  affected_partners UUID[] DEFAULT '{}',
  data_evidence JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_insights_enterprise_status ON policy_insights(enterprise_id, status);
CREATE INDEX IF NOT EXISTS idx_policy_insights_severity_created ON policy_insights(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_insights_type ON policy_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_policy_insights_affected_policies ON policy_insights USING GIN(affected_policies);

-- Enable RLS
ALTER TABLE policy_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view insights for their enterprise"
  ON policy_insights FOR SELECT
  USING (
    enterprise_id IN (
      SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update insights for their enterprise"
  ON policy_insights FOR UPDATE
  USING (
    enterprise_id IN (
      SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all insights"
  ON policy_insights FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create view for policy health summary
CREATE OR REPLACE VIEW policy_health_summary AS
SELECT 
  enterprise_id,
  COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'active') as critical_issues,
  COUNT(*) FILTER (WHERE severity = 'warning' AND status = 'active') as warnings,
  COUNT(*) FILTER (WHERE insight_type = 'optimization' AND status = 'active') as optimization_suggestions,
  COUNT(*) FILTER (WHERE insight_type = 'cleanup' AND status = 'active') as cleanup_recommendations,
  MAX(created_at) as last_analysis_at
FROM policy_insights
GROUP BY enterprise_id;

-- Helper function: Get middleware hourly stats
CREATE OR REPLACE FUNCTION get_middleware_hourly_stats(
  p_enterprise_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  hour TIMESTAMPTZ,
  total_requests BIGINT,
  blocked_requests BIGINT,
  block_rate NUMERIC,
  total_cost NUMERIC,
  avg_latency NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE policy_decision = 'block') as blocked_requests,
    ROUND(COUNT(*) FILTER (WHERE policy_decision = 'block')::NUMERIC / NULLIF(COUNT(*), 0), 3) as block_rate,
    ROUND(SUM(estimated_cost_usd)::NUMERIC, 4) as total_cost,
    ROUND(AVG(response_time_ms)::NUMERIC, 0) as avg_latency
  FROM middleware_requests
  WHERE enterprise_id = p_enterprise_id
    AND created_at > NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY DATE_TRUNC('hour', created_at)
  ORDER BY hour DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get policy effectiveness stats
CREATE OR REPLACE FUNCTION get_policy_effectiveness(
  p_enterprise_id UUID,
  p_hours INTEGER DEFAULT 720, -- 30 days default
  p_policy_id UUID DEFAULT NULL
)
RETURNS TABLE (
  policy_id TEXT,
  request_count BIGINT,
  block_rate NUMERIC,
  avg_cost NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_array_elements_text(policy_evaluation->'policy_ids') as policy_id,
    COUNT(*) as request_count,
    ROUND(COUNT(*) FILTER (WHERE policy_decision = 'block')::NUMERIC / NULLIF(COUNT(*), 0), 3) as block_rate,
    ROUND(AVG(estimated_cost_usd)::NUMERIC, 4) as avg_cost
  FROM middleware_requests
  WHERE enterprise_id = p_enterprise_id
    AND created_at > NOW() - (p_hours || ' hours')::INTERVAL
    AND (p_policy_id IS NULL OR policy_evaluation->'policy_ids' @> to_jsonb(p_policy_id::TEXT))
  GROUP BY policy_id
  HAVING COUNT(*) > 5; -- Only include policies with meaningful data
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get policy usage stats
CREATE OR REPLACE FUNCTION get_policy_usage_stats(
  p_enterprise_id UUID,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  policy_id UUID,
  policy_name TEXT,
  request_count BIGINT,
  last_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as policy_id,
    p.name as policy_name,
    COUNT(mr.id) as request_count,
    MAX(mr.created_at) as last_used_at,
    p.updated_at
  FROM policy_instances p
  LEFT JOIN middleware_requests mr 
    ON mr.policy_evaluation @> jsonb_build_object('policy_ids', jsonb_build_array(p.id::TEXT))
    AND mr.created_at > NOW() - (p_days || ' days')::INTERVAL
  WHERE p.enterprise_id = p_enterprise_id
    AND p.is_active = true
  GROUP BY p.id, p.name, p.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_policy_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_policy_insights_updated_at
  BEFORE UPDATE ON policy_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_insights_updated_at();