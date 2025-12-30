-- Migration: 20251229000003_create_workflow_configs_table.sql
-- Purpose: Create workflow_configs table for MSA-specific approval chains
-- Context Graph Phase 1: Boundary Governance Foundation
--
-- This table stores per-relationship workflow configurations:
-- - Approval chains (sequential, parallel, conditional)
-- - Timeout and escalation rules
-- - Skip logic for trusted roles
-- - Brand-specific workflow variations

BEGIN;

-- ============================================================
-- PART 1: Create workflow_configs table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workflow_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship parties
  agency_enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  client_enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  -- Brand scope (NULL = all brands for this relationship)
  brand_id TEXT,
  
  -- Workflow configuration
  config JSONB NOT NULL DEFAULT '{
    "approval_chain": ["team_lead", "client_owner"],
    "parallel_approvals": false,
    "skip_preapproval": false,
    "escalation_timeout_hours": 24,
    "auto_approve_low_risk": false,
    "require_compliance_review": false,
    "require_legal_review": false
  }'::jsonb,
  
  -- Workflow metadata
  workflow_name TEXT,              -- Human-readable name for this config
  description TEXT,                -- Description of when this workflow applies
  priority INTEGER DEFAULT 0,      -- Higher priority configs take precedence
  is_active BOOLEAN DEFAULT true,  -- Can be disabled without deletion
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique per relationship + brand
  UNIQUE(agency_enterprise_id, client_enterprise_id, brand_id),
  
  -- Ensure agency and client are different
  CONSTRAINT workflow_configs_different_enterprises 
    CHECK (agency_enterprise_id != client_enterprise_id)
);

-- ============================================================
-- PART 2: Indexes for efficient queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_workflow_configs_agency 
ON public.workflow_configs(agency_enterprise_id);

CREATE INDEX IF NOT EXISTS idx_workflow_configs_client 
ON public.workflow_configs(client_enterprise_id);

CREATE INDEX IF NOT EXISTS idx_workflow_configs_brand 
ON public.workflow_configs(brand_id) WHERE brand_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_configs_active 
ON public.workflow_configs(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_workflow_configs_priority 
ON public.workflow_configs(agency_enterprise_id, client_enterprise_id, priority DESC);

-- ============================================================
-- PART 3: Auto-update timestamp trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_workflow_configs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workflow_configs_updated
  BEFORE UPDATE ON public.workflow_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workflow_configs_timestamp();

-- ============================================================
-- PART 4: Helper function to get effective workflow config
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_effective_workflow_config(
  p_agency_enterprise_id UUID,
  p_client_enterprise_id UUID,
  p_brand_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Get the most specific active config:
  -- 1. Brand-specific config (if brand_id provided and exists)
  -- 2. Relationship default config (brand_id IS NULL)
  -- 3. Fall back to default config if nothing exists
  SELECT COALESCE(
    (
      SELECT wc.config
      FROM public.workflow_configs wc
      WHERE wc.agency_enterprise_id = p_agency_enterprise_id
        AND wc.client_enterprise_id = p_client_enterprise_id
        AND wc.is_active = true
        AND (
          (p_brand_id IS NOT NULL AND wc.brand_id = p_brand_id) OR
          (wc.brand_id IS NULL)
        )
      ORDER BY 
        CASE WHEN wc.brand_id IS NOT NULL THEN 0 ELSE 1 END,
        wc.priority DESC
      LIMIT 1
    ),
    -- Default config if nothing exists
    '{
      "approval_chain": ["team_lead", "client_owner"],
      "parallel_approvals": false,
      "skip_preapproval": false,
      "escalation_timeout_hours": 24,
      "auto_approve_low_risk": false,
      "require_compliance_review": false,
      "require_legal_review": false
    }'::jsonb
  );
$$;

COMMENT ON FUNCTION public.get_effective_workflow_config IS 
'Returns the effective workflow configuration for an agency-client relationship.
Checks for brand-specific config first, then relationship default, then system default.';

-- ============================================================
-- PART 5: Function to validate submission against workflow
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_required_approvers(
  p_agency_enterprise_id UUID,
  p_client_enterprise_id UUID,
  p_brand_id TEXT DEFAULT NULL,
  p_risk_score NUMERIC DEFAULT 0.5,
  p_submission_type TEXT DEFAULT 'standard'
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_config JSONB;
  v_approval_chain TEXT[];
  v_require_compliance BOOLEAN;
  v_require_legal BOOLEAN;
  v_auto_approve_low_risk BOOLEAN;
BEGIN
  -- Get effective config
  v_config := public.get_effective_workflow_config(
    p_agency_enterprise_id, 
    p_client_enterprise_id, 
    p_brand_id
  );
  
  -- Extract config values
  v_approval_chain := ARRAY(SELECT jsonb_array_elements_text(v_config->'approval_chain'));
  v_require_compliance := COALESCE((v_config->>'require_compliance_review')::boolean, false);
  v_require_legal := COALESCE((v_config->>'require_legal_review')::boolean, false);
  v_auto_approve_low_risk := COALESCE((v_config->>'auto_approve_low_risk')::boolean, false);
  
  -- Auto-approve low risk if configured
  IF v_auto_approve_low_risk AND p_risk_score < 0.3 THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Add compliance reviewer if required
  IF v_require_compliance AND NOT 'compliance_manager' = ANY(v_approval_chain) THEN
    v_approval_chain := v_approval_chain || 'compliance_manager';
  END IF;
  
  -- Add legal reviewer if required
  IF v_require_legal AND NOT 'legal_counsel' = ANY(v_approval_chain) THEN
    v_approval_chain := v_approval_chain || 'legal_counsel';
  END IF;
  
  RETURN v_approval_chain;
END;
$$;

COMMENT ON FUNCTION public.get_required_approvers IS 
'Returns the list of required approver roles for a submission based on workflow config.
Considers risk score and submission type to determine if reviews can be skipped.';

-- ============================================================
-- PART 6: Enable RLS (policies added in separate migration)
-- ============================================================

ALTER TABLE public.workflow_configs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 7: Comments for documentation
-- ============================================================

COMMENT ON TABLE public.workflow_configs IS 
'MSA-specific workflow configurations per agency-client relationship.
Determines approval chains, escalation rules, and review requirements.';

COMMENT ON COLUMN public.workflow_configs.config IS 
'Workflow configuration JSON. Structure:
{
  "approval_chain": ["team_lead", "client_owner"],
  "parallel_approvals": false,
  "skip_preapproval": false,
  "escalation_timeout_hours": 24,
  "auto_approve_low_risk": false,
  "require_compliance_review": false,
  "require_legal_review": false
}';

COMMENT ON COLUMN public.workflow_configs.brand_id IS 
'Brand-specific configuration. NULL means this is the default for the relationship.';

COMMENT ON COLUMN public.workflow_configs.priority IS 
'Higher priority configs take precedence when multiple match.';

COMMIT;

