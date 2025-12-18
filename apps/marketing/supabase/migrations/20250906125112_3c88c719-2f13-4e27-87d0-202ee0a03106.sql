-- Fix all functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_user_workspaces(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT ARRAY_AGG(workspace_id) 
  FROM workspace_members 
  WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_enterprises(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT ARRAY_AGG(enterprise_id) 
  FROM user_roles 
  WHERE user_id = user_uuid AND enterprise_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(user_uuid uuid, workspace_uuid uuid, required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND workspace_id = workspace_uuid 
    AND role >= required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_enterprise_role(user_uuid uuid, enterprise_uuid uuid, required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND enterprise_id = enterprise_uuid 
    AND role >= required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_of_enterprise_or_workspace(enterprise_id uuid DEFAULT NULL::uuid, workspace_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Check if user is admin of specified enterprise
    IF enterprise_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND enterprise_id = is_admin_of_enterprise_or_workspace.enterprise_id
            AND role IN ('admin', 'owner')
        );
    END IF;
    
    -- Check if user is admin of specified workspace
    IF workspace_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM workspace_members
            WHERE user_id = auth.uid()
            AND workspace_id = is_admin_of_enterprise_or_workspace.workspace_id
            AND role IN ('admin', 'owner')
        );
    END IF;
    
    RETURN false;
END;
$$;