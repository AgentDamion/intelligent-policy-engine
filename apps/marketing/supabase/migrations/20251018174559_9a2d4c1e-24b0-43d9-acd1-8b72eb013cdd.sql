-- Drop the existing restrictive policy that uses has_role_in_scope
DROP POLICY IF EXISTS "scopes_admin_write" ON public.scopes;

-- Create separate explicit policies for INSERT, UPDATE, DELETE operations
-- These align with the scoped_policies RLS pattern and avoid scope_id NULL issues

-- INSERT: Allow enterprise admins to create scopes
CREATE POLICY "scopes_insert" ON public.scopes
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.enterprise_id = scopes.enterprise_id
    AND ur.role IN ('admin', 'owner')
  )
);

-- UPDATE: Allow enterprise admins to update scopes
CREATE POLICY "scopes_update" ON public.scopes
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.enterprise_id = scopes.enterprise_id
    AND ur.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.enterprise_id = scopes.enterprise_id
    AND ur.role IN ('admin', 'owner')
  )
);

-- DELETE: Allow enterprise admins to delete scopes
CREATE POLICY "scopes_delete" ON public.scopes
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.enterprise_id = scopes.enterprise_id
    AND ur.role IN ('admin', 'owner')
  )
);