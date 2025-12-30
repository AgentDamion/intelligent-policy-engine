-- Migration: 20251229000015_create_pattern_aggregation_functions.sql
-- Purpose: Create pattern aggregation functions for network intelligence
-- Context Graph Phase 4: Network Intelligence Foundation
--
-- These functions compute anonymized patterns from governance data:
-- - Approval rates by industry, role, tool type
-- - Decision velocity metrics
-- - Risk profile distributions
-- - All with k-anonymity enforcement

BEGIN;

-- ============================================================
-- PART 1: Core aggregation function for approval rates
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_approval_rate_patterns(
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_period_type TEXT DEFAULT 'monthly',
  p_min_tenant_count INTEGER DEFAULT 10
)
RETURNS INTEGER  -- Returns number of patterns created
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_patterns_created INTEGER := 0;
  v_pattern_data JSONB;
  v_tenant_count INTEGER;
  v_data_points INTEGER;
BEGIN
  -- Mark old patterns as not current
  UPDATE public.anonymized_patterns
  SET is_current = false
  WHERE pattern_type = 'approval_rate'
    AND is_current = true;

  -- Compute network-wide approval rate
  WITH approval_stats AS (
    SELECT 
      gt.enterprise_id,
      COUNT(*) as total_decisions,
      COUNT(*) FILTER (WHERE ga.action_type IN ('approve', 'HumanApproveDecision', 'AgentAutoApprove')) as approvals,
      COUNT(*) FILTER (WHERE ga.action_type IN ('reject', 'HumanBlockDecision', 'AgentAutoBlock')) as rejections
    FROM public.governance_actions ga
    JOIN public.governance_threads gt ON gt.id = ga.thread_id
    WHERE ga.created_at BETWEEN p_period_start AND p_period_end
      AND ga.action_type IN (
        'approve', 'reject', 
        'HumanApproveDecision', 'HumanBlockDecision',
        'AgentAutoApprove', 'AgentAutoBlock'
      )
    GROUP BY gt.enterprise_id
  ),
  enterprise_rates AS (
    SELECT 
      enterprise_id,
      CASE WHEN total_decisions > 0 
        THEN approvals::NUMERIC / total_decisions 
        ELSE 0 
      END as approval_rate,
      total_decisions
    FROM approval_stats
    WHERE total_decisions >= 5  -- Minimum decisions for inclusion
  )
  SELECT 
    COUNT(DISTINCT enterprise_id),
    SUM(total_decisions),
    jsonb_build_object(
      'mean', ROUND(AVG(approval_rate)::NUMERIC, 4),
      'median', ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY approval_rate)::NUMERIC, 4),
      'p25', ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY approval_rate)::NUMERIC, 4),
      'p75', ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY approval_rate)::NUMERIC, 4),
      'p90', ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY approval_rate)::NUMERIC, 4),
      'std_dev', ROUND(STDDEV(approval_rate)::NUMERIC, 4),
      'min', ROUND(MIN(approval_rate)::NUMERIC, 4),
      'max', ROUND(MAX(approval_rate)::NUMERIC, 4)
    )
  INTO v_tenant_count, v_data_points, v_pattern_data
  FROM enterprise_rates;

  -- Only insert if we meet k-anonymity threshold
  IF v_tenant_count >= p_min_tenant_count THEN
    INSERT INTO public.anonymized_patterns (
      pattern_type, scope, pattern_data, tenant_count, data_point_count,
      period_start, period_end, period_type, is_current
    ) VALUES (
      'approval_rate', 'network', v_pattern_data, v_tenant_count, v_data_points,
      p_period_start, p_period_end, p_period_type, true
    );
    v_patterns_created := v_patterns_created + 1;
  END IF;

  -- Compute by industry vertical
  FOR v_pattern_data, v_tenant_count, v_data_points IN
    WITH approval_stats AS (
      SELECT 
        gt.enterprise_id,
        e.tenancy_type as industry,  -- Use tenancy_type since type may not exist
        COUNT(*) as total_decisions,
        COUNT(*) FILTER (WHERE ga.action_type IN ('approve', 'HumanApproveDecision', 'AgentAutoApprove')) as approvals
      FROM public.governance_actions ga
      JOIN public.governance_threads gt ON gt.id = ga.thread_id
      JOIN public.enterprises e ON e.id = gt.enterprise_id
      WHERE ga.created_at BETWEEN p_period_start AND p_period_end
        AND ga.action_type IN (
          'approve', 'reject', 
          'HumanApproveDecision', 'HumanBlockDecision',
          'AgentAutoApprove', 'AgentAutoBlock'
        )
      GROUP BY gt.enterprise_id, e.tenancy_type
    ),
    enterprise_rates AS (
      SELECT 
        enterprise_id,
        industry,
        CASE WHEN total_decisions > 0 
          THEN approvals::NUMERIC / total_decisions 
          ELSE 0 
        END as approval_rate,
        total_decisions
      FROM approval_stats
      WHERE total_decisions >= 5
    ),
    industry_patterns AS (
      SELECT
        industry,
        COUNT(DISTINCT enterprise_id) as tenant_count,
        SUM(total_decisions) as data_points,
        jsonb_build_object(
          'mean', ROUND(AVG(approval_rate)::NUMERIC, 4),
          'median', ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY approval_rate)::NUMERIC, 4),
          'p25', ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY approval_rate)::NUMERIC, 4),
          'p75', ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY approval_rate)::NUMERIC, 4),
          'p90', ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY approval_rate)::NUMERIC, 4),
          'industry', industry
        ) as pattern_data
      FROM enterprise_rates
      GROUP BY industry
    )
    SELECT pattern_data, tenant_count, data_points
    FROM industry_patterns
    WHERE tenant_count >= p_min_tenant_count
  LOOP
    INSERT INTO public.anonymized_patterns (
      pattern_type, scope, pattern_data, tenant_count, data_point_count,
      period_start, period_end, period_type, industry_vertical, is_current
    ) VALUES (
      'approval_rate', 'industry', v_pattern_data, v_tenant_count, v_data_points,
      p_period_start, p_period_end, p_period_type, v_pattern_data->>'industry', true
    );
    v_patterns_created := v_patterns_created + 1;
  END LOOP;

  RETURN v_patterns_created;
END;
$$;

COMMENT ON FUNCTION public.compute_approval_rate_patterns IS 
'Computes anonymized approval rate patterns across the network.
Creates patterns for network-wide and per-industry with k-anonymity enforcement.';

-- ============================================================
-- PART 2: Decision velocity patterns
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_decision_velocity_patterns(
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_period_type TEXT DEFAULT 'monthly',
  p_min_tenant_count INTEGER DEFAULT 10
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_patterns_created INTEGER := 0;
  v_pattern_data JSONB;
  v_tenant_count INTEGER;
  v_data_points INTEGER;
BEGIN
  -- Mark old patterns as not current
  UPDATE public.anonymized_patterns
  SET is_current = false
  WHERE pattern_type = 'decision_velocity'
    AND is_current = true;

  -- Compute decision velocity (time from submission to resolution)
  WITH thread_velocities AS (
    SELECT 
      gt.enterprise_id,
      gt.id as thread_id,
      EXTRACT(EPOCH FROM (gt.resolved_at - gt.created_at)) / 3600 as hours_to_resolution
    FROM public.governance_threads gt
    WHERE gt.resolved_at IS NOT NULL
      AND gt.created_at BETWEEN p_period_start AND p_period_end
      AND gt.resolved_at BETWEEN p_period_start AND (p_period_end + INTERVAL '7 days')
  ),
  enterprise_velocities AS (
    SELECT 
      enterprise_id,
      AVG(hours_to_resolution) as avg_hours,
      COUNT(*) as decision_count
    FROM thread_velocities
    GROUP BY enterprise_id
    HAVING COUNT(*) >= 5
  )
  SELECT 
    COUNT(DISTINCT enterprise_id),
    SUM(decision_count),
    jsonb_build_object(
      'mean_hours', ROUND(AVG(avg_hours)::NUMERIC, 2),
      'median_hours', ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY avg_hours)::NUMERIC, 2),
      'p25_hours', ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY avg_hours)::NUMERIC, 2),
      'p75_hours', ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY avg_hours)::NUMERIC, 2),
      'p90_hours', ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY avg_hours)::NUMERIC, 2),
      'std_dev_hours', ROUND(STDDEV(avg_hours)::NUMERIC, 2)
    )
  INTO v_tenant_count, v_data_points, v_pattern_data
  FROM enterprise_velocities;

  IF v_tenant_count >= p_min_tenant_count THEN
    INSERT INTO public.anonymized_patterns (
      pattern_type, scope, pattern_data, tenant_count, data_point_count,
      period_start, period_end, period_type, is_current
    ) VALUES (
      'decision_velocity', 'network', v_pattern_data, v_tenant_count, v_data_points,
      p_period_start, p_period_end, p_period_type, true
    );
    v_patterns_created := v_patterns_created + 1;
  END IF;

  RETURN v_patterns_created;
END;
$$;

COMMENT ON FUNCTION public.compute_decision_velocity_patterns IS 
'Computes anonymized decision velocity patterns (time to resolution).';

-- ============================================================
-- PART 3: Escalation rate patterns
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_escalation_rate_patterns(
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_period_type TEXT DEFAULT 'monthly',
  p_min_tenant_count INTEGER DEFAULT 10
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_patterns_created INTEGER := 0;
  v_pattern_data JSONB;
  v_tenant_count INTEGER;
  v_data_points INTEGER;
BEGIN
  UPDATE public.anonymized_patterns
  SET is_current = false
  WHERE pattern_type = 'escalation_rate'
    AND is_current = true;

  WITH escalation_stats AS (
    SELECT 
      gt.enterprise_id,
      COUNT(*) as total_threads,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM public.governance_actions ga 
        WHERE ga.thread_id = gt.id 
        AND ga.action_type IN ('escalate', 'HumanEscalate')
      )) as escalated_threads
    FROM public.governance_threads gt
    WHERE gt.created_at BETWEEN p_period_start AND p_period_end
    GROUP BY gt.enterprise_id
    HAVING COUNT(*) >= 10
  ),
  enterprise_rates AS (
    SELECT 
      enterprise_id,
      escalated_threads::NUMERIC / total_threads as escalation_rate,
      total_threads
    FROM escalation_stats
  )
  SELECT 
    COUNT(DISTINCT enterprise_id),
    SUM(total_threads),
    jsonb_build_object(
      'mean', ROUND(AVG(escalation_rate)::NUMERIC, 4),
      'median', ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY escalation_rate)::NUMERIC, 4),
      'p25', ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY escalation_rate)::NUMERIC, 4),
      'p75', ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY escalation_rate)::NUMERIC, 4),
      'p90', ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY escalation_rate)::NUMERIC, 4)
    )
  INTO v_tenant_count, v_data_points, v_pattern_data
  FROM enterprise_rates;

  IF v_tenant_count >= p_min_tenant_count THEN
    INSERT INTO public.anonymized_patterns (
      pattern_type, scope, pattern_data, tenant_count, data_point_count,
      period_start, period_end, period_type, is_current
    ) VALUES (
      'escalation_rate', 'network', v_pattern_data, v_tenant_count, v_data_points,
      p_period_start, p_period_end, p_period_type, true
    );
    v_patterns_created := v_patterns_created + 1;
  END IF;

  RETURN v_patterns_created;
END;
$$;

COMMENT ON FUNCTION public.compute_escalation_rate_patterns IS 
'Computes anonymized escalation rate patterns.';

-- ============================================================
-- PART 4: Relationship pattern computation
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_relationship_patterns(
  p_agency_enterprise_id UUID,
  p_client_enterprise_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_period_type TEXT DEFAULT 'monthly'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pattern_data JSONB;
BEGIN
  -- Mark old patterns as not current
  UPDATE public.relationship_patterns
  SET is_current = false
  WHERE agency_enterprise_id = p_agency_enterprise_id
    AND client_enterprise_id = p_client_enterprise_id
    AND is_current = true;

  -- Compute approval rate for this relationship
  WITH transitions AS (
    SELECT 
      bt.transition_type,
      bt.decision_confidence,
      bt.risk_score,
      bt.transition_latency_ms
    FROM public.boundary_transitions bt
    WHERE (
      (bt.from_enterprise_id = p_agency_enterprise_id AND bt.to_enterprise_id = p_client_enterprise_id) OR
      (bt.from_enterprise_id = p_client_enterprise_id AND bt.to_enterprise_id = p_agency_enterprise_id)
    )
    AND bt.created_at BETWEEN p_period_start AND p_period_end
  )
  SELECT jsonb_build_object(
    'total_transitions', COUNT(*),
    'submissions', COUNT(*) FILTER (WHERE transition_type = 'submission'),
    'approvals', COUNT(*) FILTER (WHERE transition_type = 'approval'),
    'rejections', COUNT(*) FILTER (WHERE transition_type = 'rejection'),
    'escalations', COUNT(*) FILTER (WHERE transition_type = 'escalation'),
    'approval_rate', 
      CASE WHEN COUNT(*) FILTER (WHERE transition_type IN ('approval', 'rejection')) > 0
        THEN ROUND(
          COUNT(*) FILTER (WHERE transition_type = 'approval')::NUMERIC /
          COUNT(*) FILTER (WHERE transition_type IN ('approval', 'rejection')),
          4
        )
        ELSE NULL
      END,
    'avg_confidence', ROUND(AVG(decision_confidence)::NUMERIC, 4),
    'avg_risk_score', ROUND(AVG(risk_score)::NUMERIC, 4),
    'avg_latency_ms', ROUND(AVG(transition_latency_ms)::NUMERIC, 0)
  )
  INTO v_pattern_data
  FROM transitions;

  -- Only insert if there's data
  IF (v_pattern_data->>'total_transitions')::INTEGER > 0 THEN
    INSERT INTO public.relationship_patterns (
      agency_enterprise_id, client_enterprise_id,
      pattern_type, pattern_data,
      period_start, period_end, period_type, is_current
    ) VALUES (
      p_agency_enterprise_id, p_client_enterprise_id,
      'relationship_health', v_pattern_data,
      p_period_start, p_period_end, p_period_type, true
    )
    ON CONFLICT (agency_enterprise_id, client_enterprise_id, pattern_type, period_start)
    DO UPDATE SET
      pattern_data = EXCLUDED.pattern_data,
      computed_at = NOW(),
      is_current = true;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.compute_relationship_patterns IS 
'Computes patterns for a specific agency-client relationship.
These patterns are visible to both parties.';

-- ============================================================
-- PART 5: Master computation function
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_all_patterns(
  p_period_start TIMESTAMPTZ DEFAULT NULL,
  p_period_end TIMESTAMPTZ DEFAULT NULL,
  p_period_type TEXT DEFAULT 'monthly'
)
RETURNS TABLE (
  pattern_type TEXT,
  patterns_created INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_approval_count INTEGER;
  v_velocity_count INTEGER;
  v_escalation_count INTEGER;
BEGIN
  -- Default to last month if not specified
  v_end := COALESCE(p_period_end, date_trunc('month', NOW()));
  v_start := COALESCE(p_period_start, v_end - INTERVAL '1 month');

  -- Compute each pattern type
  v_approval_count := public.compute_approval_rate_patterns(v_start, v_end, p_period_type);
  v_velocity_count := public.compute_decision_velocity_patterns(v_start, v_end, p_period_type);
  v_escalation_count := public.compute_escalation_rate_patterns(v_start, v_end, p_period_type);

  -- Return results
  RETURN QUERY SELECT 'approval_rate'::TEXT, v_approval_count;
  RETURN QUERY SELECT 'decision_velocity'::TEXT, v_velocity_count;
  RETURN QUERY SELECT 'escalation_rate'::TEXT, v_escalation_count;
END;
$$;

COMMENT ON FUNCTION public.compute_all_patterns IS 
'Master function to compute all anonymized pattern types.
Should be called by a scheduled job (e.g., daily or weekly).';

-- ============================================================
-- PART 6: Intelligence query functions for UI
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_enterprise_intelligence_dashboard(
  p_enterprise_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_enterprise RECORD;
  v_approval_benchmark JSONB;
  v_velocity_benchmark JSONB;
  v_enterprise_approval_rate NUMERIC;
  v_enterprise_velocity NUMERIC;
BEGIN
  -- Get enterprise info
  SELECT * INTO v_enterprise
  FROM public.enterprises
  WHERE id = p_enterprise_id;

  -- Get benchmarks
  v_approval_benchmark := public.get_network_benchmark('approval_rate', NULL);  -- Don't filter by industry
  v_velocity_benchmark := public.get_network_benchmark('decision_velocity', NULL);

  -- Calculate enterprise's own metrics
  SELECT 
    CASE WHEN COUNT(*) > 0 
      THEN COUNT(*) FILTER (WHERE ga.action_type IN ('approve', 'HumanApproveDecision'))::NUMERIC / COUNT(*)
      ELSE 0
    END
  INTO v_enterprise_approval_rate
  FROM public.governance_actions ga
  JOIN public.governance_threads gt ON gt.id = ga.thread_id
  WHERE gt.enterprise_id = p_enterprise_id
    AND ga.created_at >= NOW() - INTERVAL '30 days'
    AND ga.action_type IN ('approve', 'reject', 'HumanApproveDecision', 'HumanBlockDecision');

  SELECT 
    AVG(EXTRACT(EPOCH FROM (gt.resolved_at - gt.created_at)) / 3600)
  INTO v_enterprise_velocity
  FROM public.governance_threads gt
  WHERE gt.enterprise_id = p_enterprise_id
    AND gt.resolved_at IS NOT NULL
    AND gt.created_at >= NOW() - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'enterprise_id', p_enterprise_id,
    'enterprise_name', v_enterprise.name,
    'industry', v_enterprise.tenancy_type,
    'metrics', jsonb_build_object(
      'approval_rate', jsonb_build_object(
        'value', ROUND(v_enterprise_approval_rate, 4),
        'benchmark', v_approval_benchmark->'pattern_data',
        'comparison', public.compare_to_benchmark(p_enterprise_id, 'approval_rate', v_enterprise_approval_rate)
      ),
      'decision_velocity_hours', jsonb_build_object(
        'value', ROUND(v_enterprise_velocity, 2),
        'benchmark', v_velocity_benchmark->'pattern_data'
      )
    ),
    'computed_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.get_enterprise_intelligence_dashboard IS 
'Returns intelligence dashboard data for an enterprise with benchmark comparisons.
Used by the Intelligence Hub UI component.';

-- ============================================================
-- PART 7: Comments
-- ============================================================

COMMENT ON FUNCTION public.compute_approval_rate_patterns IS 
'Computes anonymized approval rate patterns with k-anonymity enforcement.
Creates network-wide and per-industry patterns.';

COMMIT;

