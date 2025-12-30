-- Migration: 20251229000014_create_anonymized_patterns_table.sql
-- Purpose: Create anonymized_patterns table with k-anonymity
-- Context Graph Phase 4: Network Intelligence Foundation
--
-- This is Layer 3 of the Context Graph:
-- - Aggregate patterns across all tenants (no PII)
-- - Per-agency patterns visible to client + agency
-- - Anonymized benchmarks power network intelligence
-- - k-anonymity ensures privacy (minimum 10 tenants per pattern)

BEGIN;

-- ============================================================
-- PART 1: Create anonymized_patterns table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.anonymized_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pattern classification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'approval_rate',           -- Approval/rejection rates by category
    'decision_velocity',       -- Time to decision metrics
    'risk_profile',            -- Risk score distributions
    'escalation_rate',         -- How often decisions escalate
    'tool_usage',              -- AI tool adoption patterns
    'policy_effectiveness',    -- Policy impact on outcomes
    'workflow_efficiency',     -- Workflow step timing
    'boundary_transition',     -- Cross-enterprise patterns
    'role_distribution',       -- How roles participate in decisions
    'compliance_trend'         -- Compliance score trends
  )),
  
  -- Aggregation scope
  scope TEXT NOT NULL DEFAULT 'network' CHECK (scope IN (
    'network',          -- All tenants (fully anonymized)
    'industry',         -- Industry vertical (pharma, finance, etc.)
    'enterprise_type',  -- Owning vs shared tenants
    'relationship'      -- Agency-client patterns (both can see)
  )),
  
  -- Pattern data (aggregated, anonymized)
  pattern_data JSONB NOT NULL,
  
  -- K-anonymity enforcement
  tenant_count INTEGER NOT NULL CHECK (tenant_count >= 10),
  data_point_count INTEGER NOT NULL DEFAULT 0,
  
  -- Time range for this pattern
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly' CHECK (period_type IN (
    'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  )),
  
  -- Metadata
  industry_vertical TEXT,  -- pharma, finance, healthcare, etc.
  benchmark_category TEXT, -- Maps to role archetype benchmark categories
  
  -- Computation metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  computation_version TEXT DEFAULT '1.0',
  is_current BOOLEAN DEFAULT true,
  
  -- Validity
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- ============================================================
-- PART 2: Indexes for efficient queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_anonymized_patterns_type
ON public.anonymized_patterns(pattern_type);

CREATE INDEX IF NOT EXISTS idx_anonymized_patterns_scope
ON public.anonymized_patterns(scope);

CREATE INDEX IF NOT EXISTS idx_anonymized_patterns_period
ON public.anonymized_patterns(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_anonymized_patterns_current
ON public.anonymized_patterns(is_current)
WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_anonymized_patterns_industry
ON public.anonymized_patterns(industry_vertical)
WHERE industry_vertical IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anonymized_patterns_benchmark
ON public.anonymized_patterns(benchmark_category)
WHERE benchmark_category IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_anonymized_patterns_lookup
ON public.anonymized_patterns(pattern_type, scope, is_current, period_type);

-- ============================================================
-- PART 3: Helper functions for pattern queries
-- ============================================================

-- Get current network benchmark for a pattern type
CREATE OR REPLACE FUNCTION public.get_network_benchmark(
  p_pattern_type TEXT,
  p_industry_vertical TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'pattern_id', ap.id,
    'pattern_type', ap.pattern_type,
    'pattern_data', ap.pattern_data,
    'tenant_count', ap.tenant_count,
    'data_point_count', ap.data_point_count,
    'period_start', ap.period_start,
    'period_end', ap.period_end,
    'computed_at', ap.computed_at
  )
  FROM public.anonymized_patterns ap
  WHERE ap.pattern_type = p_pattern_type
    AND ap.scope = 'network'
    AND ap.is_current = true
    AND (p_industry_vertical IS NULL OR ap.industry_vertical = p_industry_vertical)
  ORDER BY ap.computed_at DESC
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_network_benchmark IS 
'Returns the current network benchmark for a pattern type.
Optionally filtered by industry vertical.';

-- Compare enterprise to benchmark
CREATE OR REPLACE FUNCTION public.compare_to_benchmark(
  p_enterprise_id UUID,
  p_pattern_type TEXT,
  p_enterprise_value NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_pattern_data JSONB;
  v_tenant_count INTEGER;
BEGIN
  -- Get the most relevant benchmark (network-wide since we may not have industry info)
  SELECT ap.pattern_data, ap.tenant_count
  INTO v_pattern_data, v_tenant_count
  FROM public.anonymized_patterns ap
  WHERE ap.pattern_type = p_pattern_type
    AND ap.scope = 'network'
    AND ap.is_current = true
  ORDER BY ap.computed_at DESC
  LIMIT 1;

  IF v_pattern_data IS NULL THEN
    RETURN jsonb_build_object('error', 'No benchmark available for this pattern type');
  END IF;

  RETURN jsonb_build_object(
    'enterprise_value', p_enterprise_value,
    'benchmark_mean', (v_pattern_data->>'mean')::NUMERIC,
    'benchmark_median', (v_pattern_data->>'median')::NUMERIC,
    'benchmark_p25', (v_pattern_data->>'p25')::NUMERIC,
    'benchmark_p75', (v_pattern_data->>'p75')::NUMERIC,
    'benchmark_p90', (v_pattern_data->>'p90')::NUMERIC,
    'percentile_rank', 
      CASE 
        WHEN p_enterprise_value <= COALESCE((v_pattern_data->>'p25')::NUMERIC, 0) THEN 25
        WHEN p_enterprise_value <= COALESCE((v_pattern_data->>'median')::NUMERIC, 0) THEN 50
        WHEN p_enterprise_value <= COALESCE((v_pattern_data->>'p75')::NUMERIC, 0) THEN 75
        WHEN p_enterprise_value <= COALESCE((v_pattern_data->>'p90')::NUMERIC, 0) THEN 90
        ELSE 95
      END,
    'tenant_count', v_tenant_count,
    'status', 
      CASE 
        WHEN p_enterprise_value >= COALESCE((v_pattern_data->>'p75')::NUMERIC, 999) THEN 'above_average'
        WHEN p_enterprise_value >= COALESCE((v_pattern_data->>'median')::NUMERIC, 999) THEN 'average'
        WHEN p_enterprise_value >= COALESCE((v_pattern_data->>'p25')::NUMERIC, 999) THEN 'below_average'
        ELSE 'needs_attention'
      END
  );
END;
$$;

COMMENT ON FUNCTION public.compare_to_benchmark IS 
'Compares an enterprise value to the network benchmark.
Returns percentile rank and comparison status.';

-- ============================================================
-- PART 4: Relationship-specific pattern table
-- ============================================================

-- For patterns that are visible to both parties in a relationship
CREATE TABLE IF NOT EXISTS public.relationship_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship parties
  agency_enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  client_enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  -- Pattern data
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  
  -- Time range
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly',
  
  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT true,
  
  UNIQUE(agency_enterprise_id, client_enterprise_id, pattern_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_relationship_patterns_agency
ON public.relationship_patterns(agency_enterprise_id);

CREATE INDEX IF NOT EXISTS idx_relationship_patterns_client
ON public.relationship_patterns(client_enterprise_id);

CREATE INDEX IF NOT EXISTS idx_relationship_patterns_current
ON public.relationship_patterns(is_current)
WHERE is_current = true;

-- ============================================================
-- PART 5: RLS Policies
-- ============================================================

-- Network-wide patterns are readable by all authenticated users
-- (they're already anonymized)
ALTER TABLE public.anonymized_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anonymized_patterns_read"
ON public.anonymized_patterns
FOR SELECT
TO authenticated
USING (true);  -- All authenticated users can read anonymized patterns

-- Only service role can write (patterns are computed by backend jobs)
CREATE POLICY "anonymized_patterns_write"
ON public.anonymized_patterns
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Relationship patterns are only visible to involved parties
ALTER TABLE public.relationship_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relationship_patterns_read"
ON public.relationship_patterns
FOR SELECT
TO authenticated
USING (
  agency_enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  )
  OR
  client_enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "relationship_patterns_write"
ON public.relationship_patterns
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- PART 6: Comments
-- ============================================================

COMMENT ON TABLE public.anonymized_patterns IS 
'Layer 3 of the Context Graph: Anonymized network intelligence.
Aggregate patterns across all tenants with k-anonymity (minimum 10 tenants).
Powers benchmarking and predictive compliance features.';

COMMENT ON COLUMN public.anonymized_patterns.tenant_count IS 
'Number of tenants contributing to this pattern. Must be >= 10 for k-anonymity.';

COMMENT ON COLUMN public.anonymized_patterns.pattern_data IS 
'Aggregated pattern data. Structure varies by pattern_type. Example:
{
  "mean": 0.85,
  "median": 0.87,
  "p25": 0.75,
  "p75": 0.92,
  "p90": 0.96,
  "std_dev": 0.08,
  "sample_size": 1500
}';

COMMENT ON TABLE public.relationship_patterns IS 
'Per-relationship patterns visible to both agency and client.
Not anonymized but scoped to the specific relationship.';

COMMIT;

