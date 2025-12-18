-- Add risk profile taxonomy columns to sandbox_runs
ALTER TABLE public.sandbox_runs
  ADD COLUMN IF NOT EXISTS risk_profile_tier TEXT CHECK (risk_profile_tier IN ('minimal', 'low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS dimension_scores JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audit_checklist JSONB DEFAULT NULL;

-- Add risk profile taxonomy columns to ai_agent_decisions
ALTER TABLE public.ai_agent_decisions
  ADD COLUMN IF NOT EXISTS risk_profile_tier TEXT CHECK (risk_profile_tier IN ('minimal', 'low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS dimension_scores JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audit_checklist JSONB DEFAULT NULL;

-- Create risk_profile_assessments table for detailed tracking
CREATE TABLE IF NOT EXISTS public.risk_profile_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id BIGINT REFERENCES public.ai_agent_decisions(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  vendor_name TEXT,
  enterprise_id UUID REFERENCES public.enterprises(id),
  risk_profile_tier TEXT NOT NULL CHECK (risk_profile_tier IN ('minimal', 'low', 'medium', 'high', 'critical')),
  dimension_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  tier_rationale TEXT,
  audit_checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_controls JSONB DEFAULT '{}'::jsonb,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_risk_profile_tier ON public.risk_profile_assessments(risk_profile_tier);
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_risk_tier ON public.sandbox_runs(risk_profile_tier);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_risk_tier ON public.ai_agent_decisions(risk_profile_tier);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_enterprise ON public.risk_profile_assessments(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_created ON public.risk_profile_assessments(created_at DESC);

-- Enable RLS on risk_profile_assessments
ALTER TABLE public.risk_profile_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for risk_profile_assessments
CREATE POLICY "Enterprise members can view risk assessments"
  ON public.risk_profile_assessments
  FOR SELECT
  USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enterprise members can create risk assessments"
  ON public.risk_profile_assessments
  FOR INSERT
  WITH CHECK (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members
      WHERE user_id = auth.uid()
    )
  );

-- Comment for documentation
COMMENT ON TABLE public.risk_profile_assessments IS 'Stores detailed risk profile assessments from LLM-based 6-dimensional risk scoring';
COMMENT ON COLUMN public.sandbox_runs.risk_profile_tier IS 'Risk tier: minimal (0-20), low (21-40), medium (41-60), high (61-80), critical (81-100)';
COMMENT ON COLUMN public.sandbox_runs.dimension_scores IS 'JSONB object with 6 NIST-aligned dimension scores';
COMMENT ON COLUMN public.sandbox_runs.audit_checklist IS 'JSONB array of tier-specific audit requirements';