-- Fix recursive RLS by rebuilding policies for enterprise_members and workspace_members
-- and ensure scopes has a safe SELECT policy using user_roles.

-- 1) ENTERPRISE MEMBERS ------------------------------------------------------
-- Enable RLS (idempotent)
ALTER TABLE public.enterprise_members ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on enterprise_members to avoid recursion issues
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'enterprise_members'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.enterprise_members', r.policyname);
  END LOOP;
END$$;

-- Safe SELECT: allow users to see
--  - their own membership rows, or
--  - any rows for enterprises where they have a role via user_roles
CREATE POLICY enterprise_members_select ON public.enterprise_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.enterprise_id = enterprise_members.enterprise_id
  )
);

-- INSERT: only enterprise admins/owners can manage enterprise members
CREATE POLICY enterprise_members_insert_admin ON public.enterprise_members
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.enterprise_id = enterprise_members.enterprise_id
      AND ur.role IN ('admin','owner')
  )
);

-- UPDATE: only enterprise admins/owners
CREATE POLICY enterprise_members_update_admin ON public.enterprise_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.enterprise_id = enterprise_members.enterprise_id
      AND ur.role IN ('admin','owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.enterprise_id = enterprise_members.enterprise_id
      AND ur.role IN ('admin','owner')
  )
);

-- DELETE: only enterprise admins/owners
CREATE POLICY enterprise_members_delete_admin ON public.enterprise_members
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.enterprise_id = enterprise_members.enterprise_id
      AND ur.role IN ('admin','owner')
  )
);


-- 2) WORKSPACE MEMBERS -------------------------------------------------------
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on workspace_members to avoid recursion issues
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'workspace_members'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.workspace_members', r.policyname);
  END LOOP;
END$$;

-- SELECT: users can view rows where
--  - they are the user in the row, or
--  - the workspace is in their accessible list via SECURITY DEFINER function get_user_workspaces
CREATE POLICY workspace_members_select ON public.workspace_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR workspace_id = ANY (public.get_user_workspaces(auth.uid()))
);

-- INSERT: only workspace admins/owners (checked via user_roles to avoid recursion)
CREATE POLICY workspace_members_insert_admin ON public.workspace_members
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.workspace_id = workspace_members.workspace_id
      AND ur.role IN ('admin','owner')
  )
);

-- UPDATE: only workspace admins/owners
CREATE POLICY workspace_members_update_admin ON public.workspace_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.workspace_id = workspace_members.workspace_id
      AND ur.role IN ('admin','owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.workspace_id = workspace_members.workspace_id
      AND ur.role IN ('admin','owner')
  )
);

-- DELETE: only workspace admins/owners
CREATE POLICY workspace_members_delete_admin ON public.workspace_members
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.workspace_id = workspace_members.workspace_id
      AND ur.role IN ('admin','owner')
  )
);


-- 3) SCOPES: ensure SELECT is allowed via user_roles (no enterprise_members dependency)
-- Keep existing insert/update/delete policies (already migrated earlier)
ALTER TABLE public.scopes ENABLE ROW LEVEL SECURITY;

-- Create safe SELECT policy if missing (idempotent pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='scopes' AND policyname='scopes_select'
  ) THEN
    CREATE POLICY scopes_select ON public.scopes
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.enterprise_id = scopes.enterprise_id
      )
    );
  END IF;
END$$;