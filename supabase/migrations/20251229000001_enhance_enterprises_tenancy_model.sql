-- Migration: 20251229000001_enhance_enterprises_tenancy_model.sql
-- Purpose: Add tenancy model columns to enterprises table
-- Context Graph Phase 1: Boundary Governance Foundation
-- 
-- This enables the owning/shared tenant hierarchy where:
-- - Owning tenants: Enterprise (pharma) or large agency with full platform control
-- - Shared tenants: Agency working within enterprise relationship with guardrails

BEGIN;

-- ============================================================
-- PART 1: Add tenancy model columns to enterprises
-- ============================================================

-- Tenancy type: owning vs shared
ALTER TABLE public.enterprises
ADD COLUMN IF NOT EXISTS tenancy_type TEXT DEFAULT 'owning' 
  CHECK (tenancy_type IN ('owning', 'shared'));

-- Parent enterprise for shared tenants (enables tenant hierarchy)
ALTER TABLE public.enterprises
ADD COLUMN IF NOT EXISTS parent_enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE SET NULL;

-- Guardrails: Enterprise-mandated minimums that partners must comply with
-- Structure: { "min_approval_chain_length": 2, "require_compliance_review": true, ... }
ALTER TABLE public.enterprises
ADD COLUMN IF NOT EXISTS guardrails JSONB DEFAULT '{}'::jsonb;

-- Network intelligence opt-in flag
ALTER TABLE public.enterprises
ADD COLUMN IF NOT EXISTS network_intelligence_enabled BOOLEAN DEFAULT false;

-- ============================================================
-- PART 2: Add indexes for efficient queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_enterprises_tenancy_type 
ON public.enterprises(tenancy_type);

CREATE INDEX IF NOT EXISTS idx_enterprises_parent_enterprise_id 
ON public.enterprises(parent_enterprise_id) 
WHERE parent_enterprise_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enterprises_network_intelligence 
ON public.enterprises(network_intelligence_enabled) 
WHERE network_intelligence_enabled = true;

-- ============================================================
-- PART 3: Add constraint ensuring shared tenants have parent
-- ============================================================

-- Shared tenants should have a parent enterprise (enforced at application level)
-- We use a check constraint for data integrity
ALTER TABLE public.enterprises
ADD CONSTRAINT check_shared_tenant_has_parent
CHECK (
  tenancy_type = 'owning' OR 
  (tenancy_type = 'shared' AND parent_enterprise_id IS NOT NULL)
);

-- ============================================================
-- PART 4: Helper function to get effective guardrails
-- ============================================================

-- For shared tenants, merge parent guardrails with own guardrails
-- Parent guardrails take precedence (can't be overridden to less strict)
CREATE OR REPLACE FUNCTION public.get_effective_guardrails(p_enterprise_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH RECURSIVE enterprise_chain AS (
    SELECT 
      e.id,
      e.tenancy_type,
      e.parent_enterprise_id,
      e.guardrails,
      1 as depth
    FROM public.enterprises e
    WHERE e.id = p_enterprise_id
    
    UNION ALL
    
    SELECT 
      parent.id,
      parent.tenancy_type,
      parent.parent_enterprise_id,
      parent.guardrails,
      ec.depth + 1
    FROM enterprise_chain ec
    JOIN public.enterprises parent ON parent.id = ec.parent_enterprise_id
    WHERE ec.parent_enterprise_id IS NOT NULL AND ec.depth < 5 -- Prevent infinite loops
  )
  SELECT 
    COALESCE(
      jsonb_object_agg(key, value ORDER BY depth DESC),
      '{}'::jsonb
    )
  FROM (
    SELECT depth, key, value
    FROM enterprise_chain, jsonb_each(guardrails)
    ORDER BY depth DESC
  ) AS merged_guardrails;
$$;

COMMENT ON FUNCTION public.get_effective_guardrails IS 
'Returns the effective guardrails for an enterprise, merging parent guardrails for shared tenants.
Parent guardrails take precedence and cannot be overridden to be less strict.';

-- ============================================================
-- PART 5: Comments for documentation
-- ============================================================

COMMENT ON COLUMN public.enterprises.tenancy_type IS 
'Tenant type: owning (full platform control) or shared (operates within parent guardrails)';

COMMENT ON COLUMN public.enterprises.parent_enterprise_id IS 
'Parent enterprise for shared tenants. Enables tenant hierarchy for agency-client relationships.';

COMMENT ON COLUMN public.enterprises.guardrails IS 
'Enterprise-mandated governance minimums. For owning tenants, these apply to all shared tenants.
Structure: { "min_approval_chain_length": 2, "require_compliance_review": true, ... }';

COMMENT ON COLUMN public.enterprises.network_intelligence_enabled IS 
'Whether this enterprise opts into anonymized network intelligence benchmarking.';

COMMIT;

