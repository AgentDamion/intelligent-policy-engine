-- =====================================================
-- DROP EXISTING FUNCTIONS WITH CASCADE
-- =====================================================

DROP FUNCTION IF EXISTS public.has_enterprise_role(uuid, uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_enterprise_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_workspace_role(uuid, uuid, enterprise_role_enum) CASCADE;
DROP FUNCTION IF EXISTS public.is_workspace_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_enterprise_ids(uuid) CASCADE;

-- =====================================================
-- SECURITY DEFINER FUNCTIONS TO PREVENT RLS RECURSION
-- =====================================================

-- Function to check if user has specific enterprise role
CREATE FUNCTION public.has_enterprise_role(
  _user_id uuid,
  _enterprise_id uuid,
  _role app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enterprise_members
    WHERE user_id = _user_id
      AND enterprise_id = _enterprise_id
      AND role = _role
  )
$$;

-- Function to check if user is member of enterprise
CREATE FUNCTION public.is_enterprise_member(
  _user_id uuid,
  _enterprise_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enterprise_members
    WHERE user_id = _user_id
      AND enterprise_id = _enterprise_id
  )
$$;

-- Function to check if user has specific workspace role
CREATE FUNCTION public.has_workspace_role(
  _user_id uuid,
  _workspace_id uuid,
  _role enterprise_role_enum
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND role = _role
  )
$$;

-- Function to check if user is workspace member
CREATE FUNCTION public.is_workspace_member(
  _user_id uuid,
  _workspace_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
  )
$$;

-- Function to get user's enterprise IDs
CREATE FUNCTION public.get_user_enterprise_ids(
  _user_id uuid
)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(enterprise_id)
  FROM public.enterprise_members
  WHERE user_id = _user_id
$$;

-- =====================================================
-- RECREATE ENTERPRISE_MEMBERS RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view their own memberships"
ON public.enterprise_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Enterprise owners can manage all members"
ON public.enterprise_members
FOR ALL
TO authenticated
USING (
  public.has_enterprise_role(auth.uid(), enterprise_id, 'owner'::app_role)
)
WITH CHECK (
  public.has_enterprise_role(auth.uid(), enterprise_id, 'owner'::app_role)
);

CREATE POLICY "Users can insert themselves as members"
ON public.enterprise_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- RECREATE WORKSPACE_MEMBERS RLS POLICIES
-- =====================================================

CREATE POLICY "Users can view workspace members in their workspaces"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(auth.uid(), workspace_id)
);

CREATE POLICY "Workspace admins can manage members"
ON public.workspace_members
FOR ALL
TO authenticated
USING (
  public.has_workspace_role(auth.uid(), workspace_id, 'admin'::enterprise_role_enum)
  OR public.has_workspace_role(auth.uid(), workspace_id, 'owner'::enterprise_role_enum)
)
WITH CHECK (
  public.has_workspace_role(auth.uid(), workspace_id, 'admin'::enterprise_role_enum)
  OR public.has_workspace_role(auth.uid(), workspace_id, 'owner'::enterprise_role_enum)
);

-- =====================================================
-- RECREATE DEPENDENT POLICIES ON OTHER TABLES
-- =====================================================

-- Recreate policies on enterprises table
CREATE POLICY "Enterprise admins can update enterprises"
ON public.enterprises
FOR UPDATE
TO authenticated
USING (
  public.has_enterprise_role(auth.uid(), id, 'admin'::app_role)
  OR public.has_enterprise_role(auth.uid(), id, 'owner'::app_role)
)
WITH CHECK (
  public.has_enterprise_role(auth.uid(), id, 'admin'::app_role)
  OR public.has_enterprise_role(auth.uid(), id, 'owner'::app_role)
);

-- Recreate policies on policies table
CREATE POLICY "Enterprise members can create policies"
ON public.policies
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_enterprise_role(auth.uid(), enterprise_id, 'member'::app_role)
);

CREATE POLICY "Policy creators and enterprise admins can update policies"
ON public.policies
FOR UPDATE
TO authenticated
USING (
  (created_by = auth.uid()) OR
  public.has_enterprise_role(auth.uid(), enterprise_id, 'admin'::app_role)
)
WITH CHECK (
  (created_by = auth.uid()) OR
  public.has_enterprise_role(auth.uid(), enterprise_id, 'admin'::app_role)
);

-- Recreate policies on policy_distributions table
CREATE POLICY "Enterprise members can distribute policies"
ON public.policy_distributions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM policy_versions pv
    JOIN policies p ON p.id = pv.policy_id
    WHERE pv.id = policy_version_id
    AND public.has_enterprise_role(auth.uid(), p.enterprise_id, 'member'::app_role)
  )
);

-- Recreate policies on decisions table
CREATE POLICY "Enterprise reviewers can create decisions"
ON public.decisions
FOR INSERT
TO authenticated
WITH CHECK (
  (submission_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM submissions s
    JOIN policy_versions pv ON pv.id = s.policy_version_id
    JOIN policies p ON p.id = pv.policy_id
    WHERE s.id = submission_id
    AND public.has_enterprise_role(auth.uid(), p.enterprise_id, 'member'::app_role)
  ))
  OR
  (submission_item_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM submission_items si
    JOIN submissions s ON s.id = si.submission_id
    JOIN policy_versions pv ON pv.id = s.policy_version_id
    JOIN policies p ON p.id = pv.policy_id
    WHERE si.id = submission_item_id
    AND public.has_enterprise_role(auth.uid(), p.enterprise_id, 'member'::app_role)
  ))
);

-- Recreate policies on user_roles table
CREATE POLICY "Users can view roles in their enterprises and workspaces"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_enterprise_role(auth.uid(), enterprise_id, 'admin'::app_role)
);

-- =====================================================
-- GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.has_enterprise_role(uuid, uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_enterprise_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(uuid, uuid, enterprise_role_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_enterprise_ids(uuid) TO authenticated;