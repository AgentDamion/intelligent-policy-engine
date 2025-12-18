-- ============================================================================
-- Phase 2.1: Database Schema Evolution for Boundary Governance
-- ============================================================================
-- This migration adds infrastructure for middleware-openai-proxy:
-- - Partner API key management
-- - Comprehensive request audit logging
-- - POM validation for boundary rules
-- - Analytics views for compliance dashboards
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DB-01: partner_api_keys - Partner Authentication
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT,
  scopes TEXT[] DEFAULT ARRAY['ai.request']::TEXT[],
  rate_limit_tier TEXT DEFAULT 'standard',
  
  -- Lifecycle
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT partner_enterprise_relationship CHECK (partner_id != enterprise_id),
  CONSTRAINT valid_rate_limit_tier CHECK (rate_limit_tier IN ('budget', 'standard', 'premium', 'enterprise'))
);

-- Indexes for fast authentication lookups
CREATE INDEX idx_partner_api_keys_hash ON public.partner_api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_partner_api_keys_partner ON public.partner_api_keys(partner_id);
CREATE INDEX idx_partner_api_keys_enterprise ON public.partner_api_keys(enterprise_id);

-- RLS Policies
ALTER TABLE public.partner_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enterprises can view their issued keys"
  ON public.partner_api_keys FOR SELECT
  USING (enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Enterprises can create keys for partners"
  ON public.partner_api_keys FOR INSERT
  WITH CHECK (enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Enterprises can revoke their issued keys"
  ON public.partner_api_keys FOR UPDATE
  USING (enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_partner_api_keys_updated_at
  BEFORE UPDATE ON public.partner_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- DB-02: middleware_requests - Comprehensive Audit Logging
-- ----------------------------------------------------------------------------
-- Rename existing table (preserves data if any exists)
ALTER TABLE IF EXISTS public.tool_usage_events 
  RENAME TO middleware_requests;

-- Add new columns for boundary governance
ALTER TABLE public.middleware_requests
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.enterprises(id),
  ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES public.enterprises(id),
  ADD COLUMN IF NOT EXISTS workspace_id UUID,
  
  -- Request metadata
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS completion_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS total_tokens INTEGER,
  
  -- Policy evaluation results
  ADD COLUMN IF NOT EXISTS policy_decision TEXT CHECK (policy_decision IN ('allow', 'block', 'warn')),
  ADD COLUMN IF NOT EXISTS policy_evaluation JSONB,
  ADD COLUMN IF NOT EXISTS context_analysis JSONB,
  
  -- Proof bundle (cryptographic audit trail)
  ADD COLUMN IF NOT EXISTS proof_bundle JSONB,
  
  -- Response metadata
  ADD COLUMN IF NOT EXISTS response_status INTEGER,
  ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
  ADD COLUMN IF NOT EXISTS openai_request_id TEXT,
  
  -- Cost tracking
  ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10, 6),
  
  -- Event type classification
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'ai_request' 
    CHECK (event_type IN ('ai_request', 'policy_evaluation', 'access_granted', 'access_denied'));

-- Update column comment
COMMENT ON COLUMN public.middleware_requests.body IS 'Legacy field: Original tool_usage_events.body (JSONB). Use structured columns for new data.';

-- New indexes for common queries
CREATE INDEX IF NOT EXISTS idx_middleware_requests_partner ON public.middleware_requests(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_middleware_requests_enterprise ON public.middleware_requests(enterprise_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_middleware_requests_decision ON public.middleware_requests(policy_decision, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_middleware_requests_model ON public.middleware_requests(model, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_middleware_requests_event_type ON public.middleware_requests(event_type);

-- Enable RLS if not already enabled
ALTER TABLE public.middleware_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own events" ON public.middleware_requests;
DROP POLICY IF EXISTS "Service role can manage tool usage events" ON public.middleware_requests;

-- Updated RLS policies
CREATE POLICY "Enterprises can view requests they govern"
  ON public.middleware_requests FOR SELECT
  USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
    )
    OR partner_id IN (
      SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Middleware can insert request logs"
  ON public.middleware_requests FOR INSERT
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- DB-03: POM Validation Function for Boundary Rules
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_boundary_pom(pom_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check for required boundary_rules structure
  IF NOT (pom_data ? 'boundary_rules') THEN
    RAISE NOTICE 'Missing boundary_rules in POM';
    RETURN false;
  END IF;
  
  -- Validate model_restrictions if present
  IF (pom_data->'boundary_rules' ? 'model_restrictions') THEN
    IF NOT (pom_data->'boundary_rules'->'model_restrictions' ? 'allowed_models') THEN
      RAISE NOTICE 'model_restrictions missing allowed_models array';
      RETURN false;
    END IF;
  END IF;
  
  -- Validate rate_limits if present
  IF (pom_data->'boundary_rules' ? 'rate_limits') THEN
    IF NOT (pom_data->'boundary_rules'->'rate_limits' ? 'max_requests_per_day') THEN
      RAISE NOTICE 'rate_limits missing max_requests_per_day';
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.validate_boundary_pom IS 'Validates that POM contains required boundary governance fields for middleware policies';

-- ----------------------------------------------------------------------------
-- DB-04: Helper Views for Middleware Dashboard
-- ----------------------------------------------------------------------------

-- View: Recent middleware activity by enterprise
CREATE OR REPLACE VIEW public.middleware_activity_summary AS
SELECT 
  mr.enterprise_id,
  e.name as enterprise_name,
  mr.partner_id,
  p.name as partner_name,
  mr.model,
  mr.policy_decision,
  COUNT(*) as request_count,
  SUM(mr.estimated_cost_usd) as total_cost_usd,
  AVG(mr.response_time_ms) as avg_response_time_ms,
  DATE_TRUNC('hour', mr.created_at) as time_bucket
FROM public.middleware_requests mr
LEFT JOIN public.enterprises e ON mr.enterprise_id = e.id
LEFT JOIN public.enterprises p ON mr.partner_id = p.id
WHERE mr.created_at > NOW() - INTERVAL '7 days'
GROUP BY 
  mr.enterprise_id, e.name, 
  mr.partner_id, p.name,
  mr.model, 
  mr.policy_decision,
  DATE_TRUNC('hour', mr.created_at)
ORDER BY time_bucket DESC;

COMMENT ON VIEW public.middleware_activity_summary IS 'Aggregated middleware request metrics for dashboard analytics';

-- View: Policy violations for compliance dashboard
CREATE OR REPLACE VIEW public.middleware_violations AS
SELECT 
  mr.id,
  mr.enterprise_id,
  mr.partner_id,
  mr.model,
  mr.policy_decision,
  mr.policy_evaluation->>'reasons' as violation_reasons,
  mr.policy_evaluation->>'violated_rules' as violated_rule_ids,
  mr.created_at
FROM public.middleware_requests mr
WHERE mr.policy_decision = 'block'
ORDER BY mr.created_at DESC;

COMMENT ON VIEW public.middleware_violations IS 'All blocked requests for compliance monitoring';