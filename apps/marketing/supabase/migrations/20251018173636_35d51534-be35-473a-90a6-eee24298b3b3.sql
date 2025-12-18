-- Step 1: Fix RLS on enterprise_members to prevent recursion
-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Enterprise members can manage their membership" ON public.enterprise_members;
DROP POLICY IF EXISTS "Users can view enterprise members" ON public.enterprise_members;

-- Simple SELECT policy: users can view their own membership
CREATE POLICY "enterprise_members_select_self" ON public.enterprise_members
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- Admin UPDATE using user_roles (no recursion)
CREATE POLICY "enterprise_members_admin_update" ON public.enterprise_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.enterprise_id = enterprise_members.enterprise_id 
    AND ur.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.enterprise_id = enterprise_members.enterprise_id 
    AND ur.role IN ('admin', 'owner')
  )
);

-- Admin DELETE using user_roles
CREATE POLICY "enterprise_members_admin_delete" ON public.enterprise_members
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.enterprise_id = enterprise_members.enterprise_id 
    AND ur.role IN ('admin', 'owner')
  )
);

-- Self-INSERT policy
CREATE POLICY "enterprise_members_self_insert" ON public.enterprise_members
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Step 2: Fix RLS on workspace_members to prevent recursion
-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Workspace admins can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace members can view members" ON public.workspace_members;

-- Simple SELECT: users can view themselves or if they're admin via user_roles
CREATE POLICY "workspace_members_select" ON public.workspace_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.workspace_id = workspace_members.workspace_id 
    AND ur.role IN ('admin', 'owner')
  )
);

-- Admin UPDATE using user_roles
CREATE POLICY "workspace_members_admin_update" ON public.workspace_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.workspace_id = workspace_members.workspace_id 
    AND ur.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.workspace_id = workspace_members.workspace_id 
    AND ur.role IN ('admin', 'owner')
  )
);

-- Admin DELETE using user_roles
CREATE POLICY "workspace_members_admin_delete" ON public.workspace_members
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.workspace_id = workspace_members.workspace_id 
    AND ur.role IN ('admin', 'owner')
  )
);

-- Self-INSERT policy
CREATE POLICY "workspace_members_self_insert" ON public.workspace_members
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Step 3: Create policy_inheritance_mode enum
DO $$ BEGIN
  CREATE TYPE public.policy_inheritance_mode AS ENUM ('replace', 'merge', 'append');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 4: Create scoped_policies table
CREATE TABLE IF NOT EXISTS public.scoped_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id uuid NOT NULL,
  scope_id uuid NOT NULL REFERENCES public.scopes(id) ON DELETE CASCADE,
  policy_name text NOT NULL,
  inheritance_mode public.policy_inheritance_mode NOT NULL,
  parent_policy_id uuid REFERENCES public.scoped_policies(id) ON DELETE SET NULL,
  rules jsonb NOT NULL DEFAULT '{}',
  override_rules jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for scoped_policies
CREATE INDEX IF NOT EXISTS idx_scoped_policies_enterprise ON public.scoped_policies(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_scoped_policies_scope ON public.scoped_policies(scope_id);
CREATE INDEX IF NOT EXISTS idx_scoped_policies_parent ON public.scoped_policies(parent_policy_id);

-- Enable RLS on scoped_policies
ALTER TABLE public.scoped_policies ENABLE ROW LEVEL SECURITY;

-- RLS policies for scoped_policies
-- SELECT: Enterprise members can view
CREATE POLICY "scoped_policies_select" ON public.scoped_policies
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enterprise_members em 
    WHERE em.enterprise_id = scoped_policies.enterprise_id 
    AND em.user_id = auth.uid()
  )
);

-- INSERT: Enterprise admins can create
CREATE POLICY "scoped_policies_insert" ON public.scoped_policies
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.enterprise_id = scoped_policies.enterprise_id 
    AND ur.role IN ('admin', 'owner')
  )
);

-- UPDATE: Enterprise admins or creator can update
CREATE POLICY "scoped_policies_update" ON public.scoped_policies
FOR UPDATE TO authenticated
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.enterprise_id = scoped_policies.enterprise_id 
    AND ur.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.enterprise_id = scoped_policies.enterprise_id 
    AND ur.role IN ('admin', 'owner')
  )
);

-- DELETE: Enterprise admins can delete
CREATE POLICY "scoped_policies_delete" ON public.scoped_policies
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.enterprise_id = scoped_policies.enterprise_id 
    AND ur.role IN ('admin', 'owner')
  )
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_scoped_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_scoped_policies_updated_at ON public.scoped_policies;
CREATE TRIGGER update_scoped_policies_updated_at
  BEFORE UPDATE ON public.scoped_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scoped_policies_updated_at();