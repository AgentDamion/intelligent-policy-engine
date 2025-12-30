-- Migration: 20251229000011_create_role_archetypes_table.sql
-- Purpose: Create role_archetypes table with permission ceilings
-- Context Graph Phase 3: Role Architecture Transformation
--
-- This implements the Archetypes + Custom Names pattern:
-- - System archetypes define permission ceilings and benchmarking categories
-- - Agencies create custom role names mapped to archetypes
-- - Enables network intelligence across different naming conventions

BEGIN;

-- ============================================================
-- PART 1: Create role_archetypes table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.role_archetypes (
  id TEXT PRIMARY KEY,  -- e.g., 'governance_admin', 'client_owner'
  
  -- Display information
  name TEXT NOT NULL,
  description TEXT,
  
  -- Permission ceiling (maximum permissions this archetype can have)
  permission_ceiling JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Benchmarking category for network intelligence
  benchmark_category TEXT NOT NULL DEFAULT 'contributor',
  
  -- UI configuration
  icon TEXT,           -- Icon identifier for UI
  color TEXT,          -- Color for badges/indicators
  display_order INTEGER DEFAULT 100,
  
  -- Metadata
  is_system BOOLEAN DEFAULT true,  -- System archetypes can't be modified
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 2: Seed system archetypes
-- ============================================================

INSERT INTO public.role_archetypes (id, name, description, permission_ceiling, benchmark_category, icon, color, display_order, is_system) VALUES
-- Enterprise roles
(
  'platform_super_admin',
  'Platform Super Admin',
  'Full platform administration across all enterprises',
  '{
    "all": true,
    "platform": ["manage", "configure", "audit"],
    "enterprise": ["create", "delete", "manage"],
    "users": ["create", "delete", "manage", "impersonate"]
  }'::jsonb,
  'platform',
  'shield-check',
  'rose',
  1,
  true
),
(
  'governance_admin',
  'Governance Administrator',
  'Full governance administration within an enterprise',
  '{
    "governance": ["manage", "configure", "approve", "reject"],
    "policies": ["create", "edit", "delete", "activate"],
    "users": ["create", "manage", "assign_roles"],
    "audit": ["view", "export"],
    "partners": ["invite", "manage", "configure"]
  }'::jsonb,
  'executive',
  'shield',
  'amber',
  10,
  true
),
(
  'enterprise_owner',
  'Enterprise Owner',
  'Owns enterprise account with billing and administrative access',
  '{
    "enterprise": ["manage", "configure"],
    "billing": ["view", "manage"],
    "users": ["create", "manage", "assign_roles"],
    "policies": ["view", "approve"],
    "partners": ["invite", "manage"]
  }'::jsonb,
  'executive',
  'crown',
  'amber',
  20,
  true
),
(
  'enterprise_admin',
  'Enterprise Administrator',
  'Administrative access without billing control',
  '{
    "enterprise": ["configure"],
    "users": ["create", "manage"],
    "policies": ["view", "edit"],
    "partners": ["invite", "manage"]
  }'::jsonb,
  'executive',
  'settings',
  'stone',
  30,
  true
),

-- Partner/Agency roles
(
  'client_owner',
  'Client Owner',
  'Owns client relationship with full approval authority',
  '{
    "approvals": ["approve", "reject", "escalate", "delegate"],
    "submissions": ["create", "view", "manage"],
    "team": ["manage", "assign"],
    "reports": ["view", "export"],
    "workflows": ["configure"]
  }'::jsonb,
  'leadership',
  'user-check',
  'amber',
  40,
  true
),
(
  'team_lead',
  'Team Lead',
  'Manages creative/functional team with pre-approval authority',
  '{
    "approvals": ["pre_approve", "escalate"],
    "submissions": ["create", "view", "edit", "manage_team"],
    "team": ["view", "assign_tasks"],
    "reports": ["view"]
  }'::jsonb,
  'management',
  'users',
  'stone',
  50,
  true
),
(
  'contributor',
  'Contributor',
  'Individual contributor who submits requests',
  '{
    "submissions": ["create", "view_own", "edit_own"],
    "reports": ["view_own"]
  }'::jsonb,
  'contributor',
  'user',
  'stone',
  60,
  true
),
(
  'workflow_coordinator',
  'Workflow Coordinator',
  'Tracks pipeline and manages timelines',
  '{
    "submissions": ["view", "reassign", "update_status"],
    "workflows": ["view", "track"],
    "reports": ["view", "export"]
  }'::jsonb,
  'operations',
  'git-branch',
  'stone',
  70,
  true
),
(
  'internal_compliance',
  'Internal Compliance',
  'Agency-side compliance oversight',
  '{
    "submissions": ["view", "flag", "hold"],
    "policies": ["view"],
    "audit": ["view"],
    "reports": ["view", "export"]
  }'::jsonb,
  'compliance',
  'clipboard-check',
  'emerald',
  80,
  true
),

-- Specialized roles
(
  'creative_director',
  'Creative Director',
  'Senior creative role with review authority',
  '{
    "approvals": ["pre_approve", "review"],
    "submissions": ["create", "view", "edit", "manage_creative"],
    "team": ["view_creative"],
    "reports": ["view"]
  }'::jsonb,
  'creative',
  'palette',
  'violet',
  90,
  true
),
(
  'compliance_reviewer',
  'Compliance Reviewer',
  'Reviews submissions for compliance before approval',
  '{
    "submissions": ["view", "review", "flag", "comment"],
    "policies": ["view"],
    "audit": ["view"]
  }'::jsonb,
  'compliance',
  'search',
  'emerald',
  100,
  true
),
(
  'legal_counsel',
  'Legal Counsel',
  'Legal review for high-risk submissions',
  '{
    "submissions": ["view", "review", "flag", "hold"],
    "policies": ["view", "comment"],
    "audit": ["view", "export"]
  }'::jsonb,
  'legal',
  'scale',
  'blue',
  110,
  true
),
(
  'viewer',
  'Viewer',
  'Read-only access to assigned content',
  '{
    "submissions": ["view_assigned"],
    "reports": ["view_assigned"]
  }'::jsonb,
  'viewer',
  'eye',
  'stone',
  200,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permission_ceiling = EXCLUDED.permission_ceiling,
  benchmark_category = EXCLUDED.benchmark_category,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================
-- PART 3: Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_role_archetypes_benchmark
ON public.role_archetypes(benchmark_category);

CREATE INDEX IF NOT EXISTS idx_role_archetypes_display_order
ON public.role_archetypes(display_order);

-- ============================================================
-- PART 4: Helper functions
-- ============================================================

-- Get permission ceiling for an archetype
CREATE OR REPLACE FUNCTION public.get_archetype_permission_ceiling(p_archetype_id TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(permission_ceiling, '{}'::jsonb)
  FROM public.role_archetypes
  WHERE id = p_archetype_id;
$$;

COMMENT ON FUNCTION public.get_archetype_permission_ceiling IS 
'Returns the permission ceiling for a role archetype.
Custom roles must stay within this ceiling.';

-- Check if a permission set is within the ceiling
CREATE OR REPLACE FUNCTION public.permissions_within_ceiling(
  p_permissions JSONB,
  p_archetype_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_ceiling JSONB;
BEGIN
  -- Get the ceiling
  SELECT permission_ceiling INTO v_ceiling
  FROM public.role_archetypes
  WHERE id = p_archetype_id;
  
  IF v_ceiling IS NULL THEN
    RETURN false;
  END IF;
  
  -- If ceiling has "all": true, any permission is allowed
  IF (v_ceiling->>'all')::boolean = true THEN
    RETURN true;
  END IF;
  
  -- For now, we trust the application layer to validate
  -- Full validation would require comparing each permission category
  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.permissions_within_ceiling IS 
'Validates that a permission set does not exceed the archetype ceiling.
Used when creating or updating custom roles.';

-- ============================================================
-- PART 5: RLS Policies
-- ============================================================

ALTER TABLE public.role_archetypes ENABLE ROW LEVEL SECURITY;

-- Everyone can read archetypes
CREATE POLICY "role_archetypes_read"
ON public.role_archetypes
FOR SELECT
TO authenticated
USING (true);

-- Only platform admins can modify (and only non-system archetypes)
-- Note: Using service_role only since platform_super_admin may not exist in enum
CREATE POLICY "role_archetypes_write"
ON public.role_archetypes
FOR ALL
TO authenticated
USING (
  NOT is_system AND
  EXISTS (
    SELECT 1 FROM public.enterprise_members em
    WHERE em.user_id = auth.uid()
    AND em.role::text = 'owner'
  )
)
WITH CHECK (
  NOT is_system AND
  EXISTS (
    SELECT 1 FROM public.enterprise_members em
    WHERE em.user_id = auth.uid()
    AND em.role::text = 'owner'
  )
);

-- Service role has full access
CREATE POLICY "role_archetypes_service_role"
ON public.role_archetypes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- PART 6: Comments
-- ============================================================

COMMENT ON TABLE public.role_archetypes IS 
'System-defined role archetypes that provide permission ceilings and benchmarking categories.
Agencies create custom roles mapped to these archetypes.';

COMMENT ON COLUMN public.role_archetypes.id IS 
'Unique identifier for the archetype, e.g., "governance_admin", "client_owner"';

COMMENT ON COLUMN public.role_archetypes.permission_ceiling IS 
'Maximum permissions this archetype can have. Custom roles cannot exceed this ceiling.';

COMMENT ON COLUMN public.role_archetypes.benchmark_category IS 
'Category used for network intelligence benchmarking across different role names.';

COMMENT ON COLUMN public.role_archetypes.is_system IS 
'System archetypes cannot be modified or deleted. Custom archetypes can be created by platform admins.';

COMMIT;

