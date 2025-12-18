-- ============================================
-- CRITICAL: Secure workspaces table RLS
-- ============================================

-- Policy 1: Only enterprise admins can create workspaces
CREATE POLICY "Enterprise admins can create workspaces"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be admin/owner of the enterprise they're creating workspace in
  enterprise_id IN (
    SELECT ur.enterprise_id
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'owner')
  )
);

-- Policy 2: Only workspace admins can update workspace metadata
CREATE POLICY "Workspace admins can update workspaces"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (
  -- User is admin/owner of this workspace
  id IN (
    SELECT wm.workspace_id
    FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
      AND wm.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  -- Prevent changing enterprise_id to another enterprise
  enterprise_id IN (
    SELECT ur.enterprise_id
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'owner')
  )
);

-- Policy 3: Only enterprise owners can delete workspaces
CREATE POLICY "Enterprise owners can delete workspaces"
ON public.workspaces
FOR DELETE
TO authenticated
USING (
  -- User is owner of the enterprise
  enterprise_id IN (
    SELECT ur.enterprise_id
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
  )
);

-- ============================================
-- Add safety constraint: prevent enterprise_id changes
-- ============================================

-- Create trigger to prevent enterprise_id modification after creation
CREATE OR REPLACE FUNCTION prevent_enterprise_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.enterprise_id IS DISTINCT FROM NEW.enterprise_id THEN
    RAISE EXCEPTION 'Cannot change workspace enterprise_id after creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_enterprise_immutability
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION prevent_enterprise_change();

-- ============================================
-- Add audit logging for workspace operations
-- ============================================

CREATE OR REPLACE FUNCTION log_workspace_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_events (
    event_type,
    entity_type,
    entity_id,
    user_id,
    workspace_id,
    enterprise_id,
    details
  ) VALUES (
    TG_OP || '_WORKSPACE',
    'workspace',
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.enterprise_id, OLD.enterprise_id),
    jsonb_build_object(
      'operation', TG_OP,
      'old_name', OLD.name,
      'new_name', NEW.name,
      'workspace_type', COALESCE(NEW.workspace_type, OLD.workspace_type)
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_workspace_changes
AFTER INSERT OR UPDATE OR DELETE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION log_workspace_changes();