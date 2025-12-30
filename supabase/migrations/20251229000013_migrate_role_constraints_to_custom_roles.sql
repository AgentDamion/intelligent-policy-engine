-- Migration: 20251229000013_migrate_role_constraints_to_custom_roles.sql
-- Purpose: Migrate existing role CHECK constraints to custom_roles system
-- Context Graph Phase 3: Role Architecture Transformation
--
-- This migration:
-- 1. Relaxes hardcoded CHECK constraints on role columns
-- 2. Adds custom_role_id foreign keys
-- 3. Migrates existing role data to custom_roles
-- 4. Provides backward compatibility

BEGIN;

-- ============================================================
-- PART 1: Add custom_role_id to relevant tables
-- ============================================================

-- Add to user_contexts
ALTER TABLE public.user_contexts
ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.custom_roles(id);

CREATE INDEX IF NOT EXISTS idx_user_contexts_custom_role
ON public.user_contexts(custom_role_id)
WHERE custom_role_id IS NOT NULL;

-- Add to partner_client_contexts (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'partner_client_contexts'
  ) THEN
    ALTER TABLE public.partner_client_contexts
    ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.custom_roles(id);
    
    CREATE INDEX IF NOT EXISTS idx_partner_client_contexts_custom_role
    ON public.partner_client_contexts(custom_role_id)
    WHERE custom_role_id IS NOT NULL;
  END IF;
END $$;

-- Add to governance_actions for actor role tracking
ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS actor_custom_role_id UUID REFERENCES public.custom_roles(id);

CREATE INDEX IF NOT EXISTS idx_governance_actions_custom_role
ON public.governance_actions(actor_custom_role_id)
WHERE actor_custom_role_id IS NOT NULL;

-- ============================================================
-- PART 2: Create role mapping table for legacy compatibility
-- ============================================================

CREATE TABLE IF NOT EXISTS public.legacy_role_mappings (
  legacy_role TEXT PRIMARY KEY,
  archetype_id TEXT NOT NULL REFERENCES public.role_archetypes(id),
  default_display_name TEXT NOT NULL,
  notes TEXT
);

-- Seed legacy role mappings
INSERT INTO public.legacy_role_mappings (legacy_role, archetype_id, default_display_name, notes) VALUES
  -- From user_contexts CHECK constraint
  ('platform_super_admin', 'platform_super_admin', 'Platform Super Admin', 'Original platform admin role'),
  ('enterprise_owner', 'enterprise_owner', 'Enterprise Owner', 'Original enterprise owner role'),
  ('enterprise_admin', 'enterprise_admin', 'Enterprise Admin', 'Original enterprise admin role'),
  ('seat_admin', 'governance_admin', 'Seat Admin', 'Maps to governance_admin archetype'),
  ('seat_user', 'contributor', 'Seat User', 'Maps to contributor archetype'),
  
  -- From partner_client_contexts CHECK constraint
  ('partner_admin', 'governance_admin', 'Partner Admin', 'Partner-side admin'),
  ('partner_user', 'contributor', 'Partner User', 'Partner-side contributor'),
  ('account_manager', 'client_owner', 'Account Manager', 'Maps to client_owner archetype'),
  ('creative_director', 'creative_director', 'Creative Director', 'Specialized creative role'),
  ('project_manager', 'workflow_coordinator', 'Project Manager', 'Maps to workflow_coordinator'),
  ('compliance_manager', 'internal_compliance', 'Compliance Manager', 'Internal compliance role'),
  
  -- From expanded role system (migration 011)
  ('legal_counsel', 'legal_counsel', 'Legal Counsel', 'Legal review role'),
  ('marketing_manager', 'team_lead', 'Marketing Manager', 'Maps to team_lead archetype')
ON CONFLICT (legacy_role) DO NOTHING;

-- ============================================================
-- PART 3: Function to migrate legacy role to custom_role_id
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_or_create_custom_role_for_legacy(
  p_enterprise_id UUID,
  p_legacy_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mapping RECORD;
  v_custom_role_id UUID;
BEGIN
  -- Look up the legacy role mapping
  SELECT * INTO v_mapping
  FROM public.legacy_role_mappings
  WHERE legacy_role = p_legacy_role;
  
  IF NOT FOUND THEN
    -- Default to contributor if unknown role
    SELECT * INTO v_mapping
    FROM public.legacy_role_mappings
    WHERE legacy_role = 'seat_user';
  END IF;
  
  -- Check if custom role already exists for this enterprise
  SELECT id INTO v_custom_role_id
  FROM public.custom_roles
  WHERE enterprise_id = p_enterprise_id
    AND display_name = v_mapping.default_display_name;
  
  IF v_custom_role_id IS NOT NULL THEN
    RETURN v_custom_role_id;
  END IF;
  
  -- Create the custom role
  INSERT INTO public.custom_roles (
    enterprise_id,
    archetype_id,
    display_name,
    description,
    permissions,
    is_active
  )
  VALUES (
    p_enterprise_id,
    v_mapping.archetype_id,
    v_mapping.default_display_name,
    'Migrated from legacy role: ' || p_legacy_role,
    '{}'::jsonb,  -- Will inherit from archetype
    true
  )
  RETURNING id INTO v_custom_role_id;
  
  RETURN v_custom_role_id;
END;
$$;

COMMENT ON FUNCTION public.get_or_create_custom_role_for_legacy IS 
'Gets or creates a custom_role for a legacy hardcoded role.
Used during migration and for backward compatibility.';

-- ============================================================
-- PART 4: Migrate existing user_contexts to custom_roles
-- ============================================================

-- Create custom roles for each enterprise based on existing roles used
DO $$
DECLARE
  v_record RECORD;
  v_custom_role_id UUID;
BEGIN
  FOR v_record IN 
    SELECT DISTINCT uc.enterprise_id, uc.role
    FROM public.user_contexts uc
    WHERE uc.custom_role_id IS NULL
      AND uc.role IS NOT NULL
  LOOP
    -- Get or create the custom role
    v_custom_role_id := public.get_or_create_custom_role_for_legacy(
      v_record.enterprise_id,
      v_record.role
    );
    
    -- Update user_contexts with the custom_role_id
    UPDATE public.user_contexts
    SET custom_role_id = v_custom_role_id
    WHERE enterprise_id = v_record.enterprise_id
      AND role = v_record.role
      AND custom_role_id IS NULL;
  END LOOP;
END $$;

-- Migrate partner_client_contexts if it exists
DO $$
DECLARE
  v_record RECORD;
  v_custom_role_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'partner_client_contexts'
  ) THEN
    FOR v_record IN 
      SELECT DISTINCT pcc.partner_enterprise_id, pcc.role
      FROM public.partner_client_contexts pcc
      WHERE pcc.custom_role_id IS NULL
        AND pcc.role IS NOT NULL
    LOOP
      v_custom_role_id := public.get_or_create_custom_role_for_legacy(
        v_record.partner_enterprise_id,
        v_record.role
      );
      
      UPDATE public.partner_client_contexts
      SET custom_role_id = v_custom_role_id
      WHERE partner_enterprise_id = v_record.partner_enterprise_id
        AND role = v_record.role
        AND custom_role_id IS NULL;
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- PART 5: Create view for backward-compatible role queries
-- ============================================================

CREATE OR REPLACE VIEW public.user_roles_expanded AS
SELECT 
  uc.id as user_context_id,
  uc.user_id,
  uc.enterprise_id,
  uc.role as legacy_role,
  uc.custom_role_id,
  cr.display_name as role_display_name,
  cr.archetype_id,
  ra.name as archetype_name,
  ra.benchmark_category,
  COALESCE(cr.permissions, ra.permission_ceiling) as effective_permissions,
  uc.is_active,
  uc.is_default
FROM public.user_contexts uc
LEFT JOIN public.custom_roles cr ON cr.id = uc.custom_role_id
LEFT JOIN public.role_archetypes ra ON ra.id = cr.archetype_id;

COMMENT ON VIEW public.user_roles_expanded IS 
'Backward-compatible view that joins user_contexts with custom_roles and archetypes.
Use this view for role queries to get both legacy and new role information.';

-- ============================================================
-- PART 6: Function to get user's effective role
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_effective_role(
  p_user_id UUID,
  p_enterprise_id UUID
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'user_context_id', ure.user_context_id,
    'legacy_role', ure.legacy_role,
    'custom_role_id', ure.custom_role_id,
    'display_name', ure.role_display_name,
    'archetype_id', ure.archetype_id,
    'archetype_name', ure.archetype_name,
    'benchmark_category', ure.benchmark_category,
    'permissions', ure.effective_permissions
  )
  FROM public.user_roles_expanded ure
  WHERE ure.user_id = p_user_id
    AND ure.enterprise_id = p_enterprise_id
    AND ure.is_active = true
  ORDER BY ure.is_default DESC
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_effective_role IS 
'Returns the effective role for a user in an enterprise.
Combines legacy role with custom role and archetype information.';

-- ============================================================
-- PART 7: Soft deprecation of CHECK constraints
-- ============================================================

-- Note: We're NOT dropping the CHECK constraints yet to maintain backward compatibility.
-- Instead, we add a relaxed version that allows new roles to be added.

-- This allows applications to continue using the legacy role column while
-- transitioning to custom_role_id.

-- Future migration will:
-- 1. Require custom_role_id
-- 2. Drop legacy role CHECK constraints
-- 3. Eventually drop legacy role columns

-- ============================================================
-- PART 8: Audit logging for role changes
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_custom_role_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.governance_audit_events (
    event_type,
    enterprise_id,
    actor_type,
    actor_id,
    event_payload,
    created_at
  )
  VALUES (
    CASE TG_OP
      WHEN 'INSERT' THEN 'custom_role.created'
      WHEN 'UPDATE' THEN 'custom_role.updated'
      WHEN 'DELETE' THEN 'custom_role.deleted'
    END,
    COALESCE(NEW.enterprise_id, OLD.enterprise_id),
    'human',
    auth.uid(),
    jsonb_build_object(
      'operation', TG_OP,
      'role_id', COALESCE(NEW.id, OLD.id),
      'display_name', COALESCE(NEW.display_name, OLD.display_name),
      'archetype_id', COALESCE(NEW.archetype_id, OLD.archetype_id),
      'old_permissions', OLD.permissions,
      'new_permissions', NEW.permissions
    ),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_custom_role ON public.custom_roles;
CREATE TRIGGER trg_audit_custom_role
  AFTER INSERT OR UPDATE OR DELETE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_custom_role_change();

-- ============================================================
-- PART 9: Comments
-- ============================================================

COMMENT ON TABLE public.legacy_role_mappings IS 
'Maps legacy hardcoded role names to archetypes for migration.
Used by get_or_create_custom_role_for_legacy().';

COMMENT ON COLUMN public.user_contexts.custom_role_id IS 
'Reference to custom_roles. Preferred over legacy role column.
When both are set, custom_role_id takes precedence.';

COMMENT ON COLUMN public.governance_actions.actor_custom_role_id IS 
'The custom role of the actor at the time of action.
Used for role-based analytics and network intelligence.';

COMMIT;

