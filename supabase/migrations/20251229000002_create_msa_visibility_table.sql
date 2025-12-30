-- Migration: 20251229000002_create_msa_visibility_table.sql
-- Purpose: Create MSA visibility table for enterprise-partner boundary control
-- Context Graph Phase 1: Boundary Governance Foundation
--
-- This table controls what enterprises see about agency internals:
-- - role_only: Agency shows only role titles (not person names)
-- - person_level: Agency shows person names but not internal processes
-- - full_detail: Full transparency (rare in regulated industries)
--
-- This is the core of AICOMPLYR's differentiation - capturing both sides
-- of the enterprise-agency boundary with configurable visibility.

BEGIN;

-- ============================================================
-- PART 1: Create MSA visibility table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.msa_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship parties
  agency_enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  client_enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  -- Visibility configuration
  visibility_level TEXT NOT NULL DEFAULT 'role_only' CHECK (visibility_level IN (
    'role_only',        -- Agency shows only role titles (not person names)
    'person_level',     -- Agency shows person names but not internal processes  
    'full_detail'       -- Full transparency (rare in regulated industries)
  )),
  
  -- Override configurations per brand or role
  -- Structure: { "brands": { "Nexium": "full_detail" }, "roles": { "compliance_manager": "person_level" } }
  overrides JSONB DEFAULT '{}'::jsonb,
  
  -- MSA metadata
  msa_reference TEXT,              -- External MSA document reference
  effective_date DATE,             -- When this visibility config takes effect
  expiration_date DATE,            -- Optional expiration (for contract renewals)
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique relationship pair
  UNIQUE(agency_enterprise_id, client_enterprise_id),
  
  -- Ensure agency and client are different
  CONSTRAINT msa_visibility_different_enterprises 
    CHECK (agency_enterprise_id != client_enterprise_id)
);

-- ============================================================
-- PART 2: Indexes for efficient queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_msa_visibility_agency 
ON public.msa_visibility(agency_enterprise_id);

CREATE INDEX IF NOT EXISTS idx_msa_visibility_client 
ON public.msa_visibility(client_enterprise_id);

CREATE INDEX IF NOT EXISTS idx_msa_visibility_level 
ON public.msa_visibility(visibility_level);

CREATE INDEX IF NOT EXISTS idx_msa_visibility_effective 
ON public.msa_visibility(effective_date, expiration_date);

-- ============================================================
-- PART 3: Auto-update timestamp trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_msa_visibility_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_msa_visibility_updated
  BEFORE UPDATE ON public.msa_visibility
  FOR EACH ROW
  EXECUTE FUNCTION public.update_msa_visibility_timestamp();

-- ============================================================
-- PART 4: Helper function to get visibility level for a relationship
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_visibility_level(
  p_agency_enterprise_id UUID,
  p_client_enterprise_id UUID,
  p_brand_id TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COALESCE(
      -- Check brand-specific override first
      CASE WHEN p_brand_id IS NOT NULL THEN
        mv.overrides->'brands'->>p_brand_id
      END,
      -- Then check role-specific override
      CASE WHEN p_role IS NOT NULL THEN
        mv.overrides->'roles'->>p_role
      END,
      -- Fall back to default visibility level
      mv.visibility_level,
      -- Default if no MSA exists
      'role_only'
    )
  FROM public.msa_visibility mv
  WHERE mv.agency_enterprise_id = p_agency_enterprise_id
    AND mv.client_enterprise_id = p_client_enterprise_id
    AND (mv.effective_date IS NULL OR mv.effective_date <= CURRENT_DATE)
    AND (mv.expiration_date IS NULL OR mv.expiration_date > CURRENT_DATE);
$$;

COMMENT ON FUNCTION public.get_visibility_level IS 
'Returns the effective visibility level for an agency-client relationship.
Checks brand and role overrides before falling back to the default level.';

-- ============================================================
-- PART 5: Function to mask actor info based on visibility
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_visible_actor_info(
  p_actor_id UUID,
  p_actor_role TEXT,
  p_agency_enterprise_id UUID,
  p_client_enterprise_id UUID,
  p_brand_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH visibility AS (
    SELECT public.get_visibility_level(
      p_agency_enterprise_id, 
      p_client_enterprise_id, 
      p_brand_id, 
      p_actor_role
    ) as level
  )
  SELECT 
    CASE (SELECT level FROM visibility)
      WHEN 'full_detail' THEN jsonb_build_object(
        'actor_id', p_actor_id,
        'actor_name', u.raw_user_meta_data->>'full_name',
        'actor_email', u.email,
        'actor_role', p_actor_role,
        'visibility_level', 'full_detail'
      )
      WHEN 'person_level' THEN jsonb_build_object(
        'actor_id', p_actor_id,
        'actor_name', u.raw_user_meta_data->>'full_name',
        'actor_email', NULL,
        'actor_role', NULL,
        'visibility_level', 'person_level'
      )
      ELSE jsonb_build_object(
        'actor_id', NULL,
        'actor_name', NULL,
        'actor_email', NULL,
        'actor_role', p_actor_role,
        'visibility_level', 'role_only'
      )
    END
  FROM auth.users u
  WHERE u.id = p_actor_id;
$$;

COMMENT ON FUNCTION public.get_visible_actor_info IS 
'Returns actor information masked according to MSA visibility settings.
This is the core privacy-respecting function for cross-boundary data sharing.';

-- ============================================================
-- PART 6: Enable RLS (policies added in separate migration)
-- ============================================================

ALTER TABLE public.msa_visibility ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 7: Comments for documentation
-- ============================================================

COMMENT ON TABLE public.msa_visibility IS 
'Controls what enterprises see about agency internals per MSA agreement.
This is the core of AICOMPLYR''s boundary governance - enabling trust
between enterprises and agencies while protecting agency autonomy.';

COMMENT ON COLUMN public.msa_visibility.visibility_level IS 
'Default visibility level: role_only (most private), person_level, or full_detail (most transparent)';

COMMENT ON COLUMN public.msa_visibility.overrides IS 
'Brand or role-specific visibility overrides. Structure: { "brands": { "Nexium": "full_detail" }, "roles": { "compliance_manager": "person_level" } }';

COMMIT;

