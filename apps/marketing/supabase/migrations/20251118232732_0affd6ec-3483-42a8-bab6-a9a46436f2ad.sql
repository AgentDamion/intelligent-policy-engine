-- Simulation Agent Database Functions and Indexes
-- Phase 1: Database Foundation for Simulation Agent

-- Function: analyze_historical_traffic
-- Analyzes middleware_requests for policy impact simulation
CREATE OR REPLACE FUNCTION analyze_historical_traffic(
  p_enterprise_id UUID,
  p_policy_id UUID,
  p_hours INTEGER DEFAULT 168
)
RETURNS TABLE (
  total_requests BIGINT,
  block_rate NUMERIC,
  total_cost_usd NUMERIC,
  avg_latency_ms NUMERIC,
  top_models JSONB,
  risk_distribution JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH request_stats AS (
    SELECT 
      COUNT(*) as req_count,
      COUNT(*) FILTER (WHERE policy_decision = 'block') as blocked_count,
      SUM(estimated_cost_usd) as total_cost,
      AVG(response_time_ms) as avg_latency,
      model,
      COALESCE((policy_evaluation->>'risk_level')::TEXT, 'UNKNOWN') as risk_level
    FROM middleware_requests
    WHERE enterprise_id = p_enterprise_id
      AND created_at >= NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY model, risk_level
  )
  SELECT 
    SUM(req_count)::BIGINT as total_requests,
    ROUND(SUM(blocked_count)::NUMERIC / NULLIF(SUM(req_count), 0), 4) as block_rate,
    ROUND(SUM(total_cost)::NUMERIC, 2) as total_cost_usd,
    ROUND(AVG(avg_latency)::NUMERIC, 2) as avg_latency_ms,
    jsonb_agg(
      jsonb_build_object(
        'model', model,
        'count', req_count,
        'cost', total_cost
      ) ORDER BY req_count DESC
    ) FILTER (WHERE model IS NOT NULL) as top_models,
    jsonb_object_agg(
      risk_level,
      req_count
    ) as risk_distribution
  FROM request_stats;
END;
$$;

-- Function: detect_cost_optimization_opportunities
CREATE OR REPLACE FUNCTION detect_cost_optimization_opportunities(
  p_enterprise_id UUID,
  p_min_savings_usd NUMERIC DEFAULT 1000
)
RETURNS TABLE (
  model_name TEXT,
  request_count BIGINT,
  current_cost_usd NUMERIC,
  suggested_model TEXT,
  estimated_savings_usd NUMERIC,
  risk_increase NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH model_costs AS (
    SELECT 
      model,
      COUNT(*) as req_count,
      SUM(estimated_cost_usd) as total_cost,
      AVG(estimated_cost_usd) as avg_cost,
      (policy_evaluation->>'risk_level')::TEXT as risk_level
    FROM middleware_requests
    WHERE enterprise_id = p_enterprise_id
      AND created_at >= NOW() - INTERVAL '30 days'
      AND policy_decision = 'allow'
      AND estimated_cost_usd IS NOT NULL
    GROUP BY model, (policy_evaluation->>'risk_level')::TEXT
  ),
  optimization_opportunities AS (
    SELECT 
      mc.model as current_model,
      mc.req_count,
      mc.total_cost,
      CASE 
        WHEN mc.model LIKE '%gpt-4%' AND mc.risk_level = 'LOW' THEN 'gpt-3.5-turbo'
        WHEN mc.model LIKE '%claude-3-opus%' AND mc.risk_level = 'LOW' THEN 'claude-3-sonnet'
        WHEN mc.model LIKE '%claude-3-sonnet%' AND mc.risk_level = 'LOW' THEN 'claude-3-haiku'
        ELSE NULL
      END as suggested_model,
      CASE 
        WHEN mc.model LIKE '%gpt-4%' AND mc.risk_level = 'LOW' THEN mc.total_cost * 0.60
        WHEN mc.model LIKE '%claude-3-opus%' AND mc.risk_level = 'LOW' THEN mc.total_cost * 0.70
        WHEN mc.model LIKE '%claude-3-sonnet%' AND mc.risk_level = 'LOW' THEN mc.total_cost * 0.50
        ELSE 0
      END as savings,
      0.05 as risk_increase_pct
    FROM model_costs mc
    WHERE mc.risk_level IN ('LOW', 'MEDIUM')
  )
  SELECT 
    oo.current_model::TEXT,
    oo.req_count,
    ROUND(oo.total_cost, 2),
    oo.suggested_model::TEXT,
    ROUND(oo.savings, 2),
    oo.risk_increase_pct
  FROM optimization_opportunities oo
  WHERE oo.suggested_model IS NOT NULL
    AND oo.savings >= p_min_savings_usd
  ORDER BY oo.savings DESC
  LIMIT 10;
END;
$$;

-- Function: analyze_deprecation_impact
CREATE OR REPLACE FUNCTION analyze_deprecation_impact(
  p_enterprise_id UUID,
  p_model_name TEXT,
  p_days_lookback INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH impact_analysis AS (
    SELECT 
      COUNT(DISTINCT partner_id) as affected_partners,
      COUNT(*) as total_requests,
      SUM(estimated_cost_usd) as total_cost_usd,
      COUNT(DISTINCT DATE(created_at)) as days_active,
      jsonb_agg(DISTINCT partner_id) as partner_list
    FROM middleware_requests
    WHERE enterprise_id = p_enterprise_id
      AND model = p_model_name
      AND created_at >= NOW() - (p_days_lookback || ' days')::INTERVAL
  )
  SELECT jsonb_build_object(
    'model_name', p_model_name,
    'affected_partners', affected_partners,
    'total_requests', total_requests,
    'total_cost_usd', ROUND(total_cost_usd::NUMERIC, 2),
    'avg_daily_requests', ROUND((total_requests::NUMERIC / NULLIF(days_active, 0)), 2),
    'partner_ids', partner_list,
    'recommendation', CASE 
      WHEN affected_partners > 10 THEN 'HIGH_IMPACT: Consider migration plan'
      WHEN affected_partners > 3 THEN 'MEDIUM_IMPACT: Notify partners'
      ELSE 'LOW_IMPACT: Safe to deprecate'
    END
  ) INTO v_result
  FROM impact_analysis;
  
  RETURN v_result;
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_middleware_requests_enterprise_created 
  ON middleware_requests(enterprise_id, created_at DESC, model, policy_decision)
  WHERE enterprise_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_middleware_requests_cost_analysis 
  ON middleware_requests(enterprise_id, model, estimated_cost_usd) 
  WHERE estimated_cost_usd IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_middleware_requests_policy_risk
  ON middleware_requests(enterprise_id, policy_decision, (policy_evaluation->>'risk_level'))
  WHERE policy_evaluation IS NOT NULL;

-- Grant permissions
GRANT EXECUTE ON FUNCTION analyze_historical_traffic(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_cost_optimization_opportunities(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_deprecation_impact(UUID, TEXT, INTEGER) TO authenticated;