-- Enable RLS on memberships table
-- Users can only see memberships for their own enterprises

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view memberships in enterprises they belong to
CREATE POLICY "Users can view memberships in their enterprises"
ON public.memberships
FOR SELECT
USING (
  enterprise_id IN (
    SELECT enterprise_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Users can create memberships in their enterprises (admin check could be added)
CREATE POLICY "Users can create memberships in their enterprises"
ON public.memberships
FOR INSERT
WITH CHECK (
  enterprise_id IN (
    SELECT enterprise_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- UPDATE: Users can update memberships in their enterprises
CREATE POLICY "Users can update memberships in their enterprises"
ON public.memberships
FOR UPDATE
USING (
  enterprise_id IN (
    SELECT enterprise_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- DELETE: Only admins can delete memberships
CREATE POLICY "Admins can delete memberships in their enterprises"
ON public.memberships
FOR DELETE
USING (
  enterprise_id IN (
    SELECT ur.enterprise_id 
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin')
  )
);