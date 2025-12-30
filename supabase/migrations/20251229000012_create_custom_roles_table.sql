-- Migration: 20251229000012_create_custom_roles_table.sql
-- Purpose: Create custom_roles table for tenant-specific role names
-- Context Graph Phase 3: Role Architecture Transformation
--
-- This enables agencies to define their own role names:
-- - "Creative Director" instead of "team_lead"
-- - "VP Client Services" instead of "client_owner"
-- - Maintains archetype mapping for network intelligence

BEGIN;

-- ============================================================
-- PART 1: Create custom_roles table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Enterprise that owns this custom role
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  -- Mapping to system archetype
  archetype_id TEXT NOT NULL REFERENCES public.role_archetypes(id),
  
  -- Custom display name
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Permissions (must be within archetype ceiling)
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- UI configuration
  icon TEXT,           -- Override archetype icon
  color TEXT,          -- Override archetype color
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,  -- Default role for new users in this enterprise
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique display name per enterprise
  UNIQUE(enterprise_id, display_name)
);

-- ============================================================
-- PART 2: Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_custom_roles_enterprise
ON public.custom_roles(enterprise_id);

CREATE INDEX IF NOT EXISTS idx_custom_roles_archetype
ON public.custom_roles(archetype_id);

CREATE INDEX IF NOT EXISTS idx_custom_roles_active
ON public.custom_roles(enterprise_id, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_custom_roles_default
ON public.custom_roles(enterprise_id, is_default)
WHERE is_default = true;

-- ============================================================
-- PART 3: Auto-update timestamp trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_custom_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_custom_roles_updated
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_roles_timestamp();

-- ============================================================
-- PART 4: Validation trigger (permissions within ceiling)
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_custom_role_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate permissions are within archetype ceiling
  IF NOT public.permissions_within_ceiling(NEW.permissions, NEW.archetype_id) THEN
    RAISE EXCEPTION 'Custom role permissions exceed archetype ceiling for %', NEW.archetype_id;
  END IF;
  
  -- Ensure only one default role per enterprise
  IF NEW.is_default = true THEN
    UPDATE public.custom_roles
    SET is_default = false
    WHERE enterprise_id = NEW.enterprise_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_custom_role
  BEFORE INSERT OR UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_custom_role_permissions();

-- ============================================================
-- PART 5: Helper functions
-- ============================================================

-- Get custom role with archetype info
CREATE OR REPLACE FUNCTION public.get_custom_role_with_archetype(p_role_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'role_id', cr.id,
    'display_name', cr.display_name,
    'description', cr.description,
    'permissions', cr.permissions,
    'archetype_id', cr.archetype_id,
    'archetype_name', ra.name,
    'archetype_description', ra.description,
    'permission_ceiling', ra.permission_ceiling,
    'benchmark_category', ra.benchmark_category,
    'icon', COALESCE(cr.icon, ra.icon),
    'color', COALESCE(cr.color, ra.color),
    'enterprise_id', cr.enterprise_id,
    'is_active', cr.is_active,
    'is_default', cr.is_default
  )
  FROM public.custom_roles cr
  JOIN public.role_archetypes ra ON ra.id = cr.archetype_id
  WHERE cr.id = p_role_id;
$$;

COMMENT ON FUNCTION public.get_custom_role_with_archetype IS 
'Returns a custom role with its archetype information merged.';

-- Get all custom roles for an enterprise
CREATE OR REPLACE FUNCTION public.get_enterprise_custom_roles(p_enterprise_id UUID)
RETURNS TABLE (
  role_id UUID,
  display_name TEXT,
  archetype_id TEXT,
  archetype_name TEXT,
  benchmark_category TEXT,
  permissions JSONB,
  is_active BOOLEAN,
  is_default BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    cr.id as role_id,
    cr.display_name,
    cr.archetype_id,
    ra.name as archetype_name,
    ra.benchmark_category,
    cr.permissions,
    cr.is_active,
    cr.is_default
  FROM public.custom_roles cr
  JOIN public.role_archetypes ra ON ra.id = cr.archetype_id
  WHERE cr.enterprise_id = p_enterprise_id
  ORDER BY ra.display_order, cr.display_name;
$$;

COMMENT ON FUNCTION public.get_enterprise_custom_roles IS 
'Returns all custom roles for an enterprise with archetype information.';

-- Get archetype for benchmarking from custom role
CREATE OR REPLACE FUNCTION public.get_role_benchmark_category(p_role_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ra.benchmark_category
  FROM public.custom_roles cr
  JOIN public.role_archetypes ra ON ra.id = cr.archetype_id
  WHERE cr.id = p_role_id;
$$;

COMMENT ON FUNCTION public.get_role_benchmark_category IS 
'Returns the benchmark category for a custom role.
Used for network intelligence across different role naming conventions.';

-- Create default roles for a new enterprise
CREATE OR REPLACE FUNCTION public.seed_default_enterprise_roles(p_enterprise_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert common role mappings
  INSERT INTO public.custom_roles (enterprise_id, archetype_id, display_name, description, is_default)
  VALUES
    (p_enterprise_id, 'governance_admin', 'Administrator', 'Full administrative access', false),
    (p_enterprise_id, 'client_owner', 'Account Director', 'Owns client relationships', false),
    (p_enterprise_id, 'team_lead', 'Creative Director', 'Leads creative team', false),
    (p_enterprise_id, 'contributor', 'Team Member', 'Individual contributor', true),
    (p_enterprise_id, 'internal_compliance', 'Compliance Manager', 'Internal compliance oversight', false)
  ON CONFLICT (enterprise_id, display_name) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.seed_default_enterprise_roles IS 
'Seeds default custom roles for a new enterprise.
Called during enterprise onboarding.';

-- ============================================================
-- PART 6: RLS Policies
-- ============================================================

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Users can view custom roles in their enterprise
CREATE POLICY "custom_roles_enterprise_read"
ON public.custom_roles
FOR SELECT
TO authenticated
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  )
);

-- Only enterprise admins can manage custom roles
CREATE POLICY "custom_roles_enterprise_write"
ON public.custom_roles
FOR ALL
TO authenticated
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid() 
    AND role::text IN ('admin', 'owner')
  )
)
WITH CHECK (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid() 
    AND role::text IN ('admin', 'owner')
  )
);

-- Service role has full access
CREATE POLICY "custom_roles_service_role"
ON public.custom_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- PART 7: Comments
-- ============================================================

COMMENT ON TABLE public.custom_roles IS 
'Enterprise-specific role names mapped to system archetypes.
Enables agencies to use their own terminology while maintaining benchmarking capability.';

COMMENT ON COLUMN public.custom_roles.archetype_id IS 
'Reference to the system archetype this custom role is based on.
Determines permission ceiling and benchmark category.';

COMMENT ON COLUMN public.custom_roles.display_name IS 
'The agency''s custom name for this role, e.g., "VP Client Services" for client_owner archetype.';

COMMENT ON COLUMN public.custom_roles.permissions IS 
'Specific permissions granted to this role. Must be within the archetype permission_ceiling.';

COMMIT;

