-- Migration: 20251229000010_create_boundary_rls_policies.sql
-- Purpose: Create RLS policies for new boundary governance tables
-- Context Graph Phase 2: Context Capture Enhancement
--
-- This migration creates comprehensive RLS policies for:
-- - msa_visibility
-- - workflow_configs
-- - boundary_transitions
--
-- Follows the principle of least privilege while enabling
-- legitimate cross-enterprise data sharing.

BEGIN;

-- ============================================================
-- PART 1: RLS Policies for msa_visibility
-- ============================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "msa_visibility_enterprise_read" ON public.msa_visibility;
DROP POLICY IF EXISTS "msa_visibility_enterprise_write" ON public.msa_visibility;
DROP POLICY IF EXISTS "msa_visibility_service_role" ON public.msa_visibility;

-- Users can view MSA settings for relationships they're part of
CREATE POLICY "msa_visibility_enterprise_read"
ON public.msa_visibility
FOR SELECT
TO authenticated
USING (
  -- User is part of either the agency or client enterprise
  agency_enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  )
  OR
  client_enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  )
);

-- Only enterprise admins can modify MSA visibility settings
CREATE POLICY "msa_visibility_enterprise_write"
ON public.msa_visibility
FOR ALL
TO authenticated
USING (
  -- Must be admin/owner of the CLIENT enterprise (they set the rules)
  client_enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid() 
    AND role::text IN ('admin', 'owner')
  )
)
WITH CHECK (
  client_enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid() 
    AND role::text IN ('admin', 'owner')
  )
);

-- Service role has full access
CREATE POLICY "msa_visibility_service_role"
ON public.msa_visibility
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- PART 2: RLS Policies for workflow_configs
-- ============================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "workflow_configs_enterprise_read" ON public.workflow_configs;
DROP POLICY IF EXISTS "workflow_configs_enterprise_write" ON public.workflow_configs;
DROP POLICY IF EXISTS "workflow_configs_service_role" ON public.workflow_configs;

-- Users can view workflow configs for relationships they're part of
CREATE POLICY "workflow_configs_enterprise_read"
ON public.workflow_configs
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

-- Enterprise admins from either side can configure workflows
-- (MSA typically negotiates who has control)
CREATE POLICY "workflow_configs_enterprise_write"
ON public.workflow_configs
FOR ALL
TO authenticated
USING (
  -- Admin of either agency or client can modify
  (
    agency_enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid() 
      AND role::text IN ('admin', 'owner')
    )
  )
  OR
  (
    client_enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid() 
      AND role::text IN ('admin', 'owner')
    )
  )
)
WITH CHECK (
  (
    agency_enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid() 
      AND role::text IN ('admin', 'owner')
    )
  )
  OR
  (
    client_enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid() 
      AND role::text IN ('admin', 'owner')
    )
  )
);

-- Service role has full access
CREATE POLICY "workflow_configs_service_role"
ON public.workflow_configs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- PART 3: RLS Policies for boundary_transitions
-- ============================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "boundary_transitions_enterprise_read" ON public.boundary_transitions;
DROP POLICY IF EXISTS "boundary_transitions_insert" ON public.boundary_transitions;
DROP POLICY IF EXISTS "boundary_transitions_service_role" ON public.boundary_transitions;

-- Users can view boundary transitions they're part of
-- Note: Visibility is ALSO filtered by the visibility_level stored in the record
CREATE POLICY "boundary_transitions_enterprise_read"
ON public.boundary_transitions
FOR SELECT
TO authenticated
USING (
  from_enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  )
  OR
  to_enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  )
);

-- Only system/triggers can insert boundary transitions (immutable)
-- Users cannot directly insert
CREATE POLICY "boundary_transitions_insert"
ON public.boundary_transitions
FOR INSERT
TO authenticated
WITH CHECK (false);  -- Block direct user inserts

-- Service role has full access (for triggers)
CREATE POLICY "boundary_transitions_service_role"
ON public.boundary_transitions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- PART 4: Enhanced RLS for governance_actions with visibility
-- ============================================================

-- Create or replace policy for visibility-aware action access
DROP POLICY IF EXISTS "governance_actions_visibility_read" ON public.governance_actions;

CREATE POLICY "governance_actions_visibility_read"
ON public.governance_actions
FOR SELECT
TO authenticated
USING (
  -- User's enterprise is part of the thread
  thread_id IN (
    SELECT id FROM public.governance_threads 
    WHERE enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
    )
  )
  OR
  -- User is the actor
  actor_id = auth.uid()
  OR
  -- User's enterprise is involved in the action
  actor_enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  )
  OR
  viewing_enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
  )
);

-- ============================================================
-- PART 5: Helper function for visibility-filtered queries
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_visible_boundary_transitions(
  p_enterprise_id UUID,
  p_partner_enterprise_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  transition_id UUID,
  governance_action_id UUID,
  from_enterprise_id UUID,
  to_enterprise_id UUID,
  transition_type TEXT,
  visibility_level TEXT,
  -- Masked based on visibility
  actor_info JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    bt.id as transition_id,
    bt.governance_action_id,
    bt.from_enterprise_id,
    bt.to_enterprise_id,
    bt.transition_type,
    bt.visibility_snapshot->>'visibility_level' as visibility_level,
    -- Apply visibility masking to actor info
    CASE bt.visibility_snapshot->>'visibility_level'
      WHEN 'full_detail' THEN jsonb_build_object(
        'actor_id', ga.actor_id,
        'actor_role', ga.actor_role,
        'actor_name', u.raw_user_meta_data->>'full_name'
      )
      WHEN 'person_level' THEN jsonb_build_object(
        'actor_id', ga.actor_id,
        'actor_role', NULL,
        'actor_name', u.raw_user_meta_data->>'full_name'
      )
      ELSE jsonb_build_object(
        'actor_id', NULL,
        'actor_role', ga.actor_role,
        'actor_name', NULL
      )
    END as actor_info,
    bt.created_at
  FROM public.boundary_transitions bt
  JOIN public.governance_actions ga ON ga.id = bt.governance_action_id
  LEFT JOIN auth.users u ON u.id = ga.actor_id
  WHERE (
    bt.from_enterprise_id = p_enterprise_id OR
    bt.to_enterprise_id = p_enterprise_id
  )
  AND (
    p_partner_enterprise_id IS NULL OR
    bt.from_enterprise_id = p_partner_enterprise_id OR
    bt.to_enterprise_id = p_partner_enterprise_id
  )
  ORDER BY bt.created_at DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.get_visible_boundary_transitions IS 
'Returns boundary transitions with actor info masked according to visibility settings.
This is the primary API for cross-enterprise transition queries.';

-- ============================================================
-- PART 6: Audit logging for MSA changes
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_msa_visibility_change()
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
      WHEN 'INSERT' THEN 'msa_visibility.created'
      WHEN 'UPDATE' THEN 'msa_visibility.updated'
      WHEN 'DELETE' THEN 'msa_visibility.deleted'
    END,
    COALESCE(NEW.client_enterprise_id, OLD.client_enterprise_id),
    'human',
    auth.uid(),
    jsonb_build_object(
      'operation', TG_OP,
      'agency_enterprise_id', COALESCE(NEW.agency_enterprise_id, OLD.agency_enterprise_id),
      'client_enterprise_id', COALESCE(NEW.client_enterprise_id, OLD.client_enterprise_id),
      'old_visibility_level', OLD.visibility_level,
      'new_visibility_level', NEW.visibility_level,
      'old_overrides', OLD.overrides,
      'new_overrides', NEW.overrides
    ),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_msa_visibility ON public.msa_visibility;
CREATE TRIGGER trg_audit_msa_visibility
  AFTER INSERT OR UPDATE OR DELETE ON public.msa_visibility
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_msa_visibility_change();

-- ============================================================
-- PART 7: Comments for documentation
-- ============================================================

COMMENT ON POLICY "msa_visibility_enterprise_read" ON public.msa_visibility IS 
'Users can view MSA visibility settings for relationships their enterprise is part of.';

COMMENT ON POLICY "msa_visibility_enterprise_write" ON public.msa_visibility IS 
'Only client enterprise admins can modify MSA visibility settings.';

COMMENT ON POLICY "workflow_configs_enterprise_read" ON public.workflow_configs IS 
'Users can view workflow configs for relationships their enterprise is part of.';

COMMENT ON POLICY "workflow_configs_enterprise_write" ON public.workflow_configs IS 
'Admins from either agency or client can modify workflow configurations.';

COMMENT ON POLICY "boundary_transitions_enterprise_read" ON public.boundary_transitions IS 
'Users can view boundary transitions involving their enterprise.';

COMMENT ON POLICY "boundary_transitions_insert" ON public.boundary_transitions IS 
'Direct user inserts are blocked - only system triggers create boundary transitions.';

COMMIT;

