-- Template: Enable RLS for tenant-scoped tables
-- Copy this and customize for each table

-- Step 1: Enable RLS
ALTER TABLE public.YOUR_TABLE_NAME ENABLE ROW LEVEL SECURITY;

-- Step 2: Create helper function (only need once, in a separate migration)
-- CREATE OR REPLACE FUNCTION public.get_user_enterprise_ids()
-- RETURNS SETOF uuid
-- LANGUAGE sql
-- SECURITY DEFINER
-- STABLE
-- AS $$
--   SELECT enterprise_id FROM public.user_roles WHERE user_id = auth.uid()
-- $$;

-- Step 3: Create policies

-- SELECT policy (users can read their enterprise's data)
CREATE POLICY "Users can view own enterprise data"
ON public.YOUR_TABLE_NAME
FOR SELECT
USING (
  enterprise_id IN (SELECT public.get_user_enterprise_ids())
);

-- INSERT policy
CREATE POLICY "Users can insert to own enterprise"
ON public.YOUR_TABLE_NAME
FOR INSERT
WITH CHECK (
  enterprise_id IN (SELECT public.get_user_enterprise_ids())
);

-- UPDATE policy
CREATE POLICY "Users can update own enterprise data"
ON public.YOUR_TABLE_NAME
FOR UPDATE
USING (
  enterprise_id IN (SELECT public.get_user_enterprise_ids())
);

-- DELETE policy (be careful - maybe restrict to admins)
CREATE POLICY "Admins can delete own enterprise data"
ON public.YOUR_TABLE_NAME
FOR DELETE
USING (
  enterprise_id IN (SELECT public.get_user_enterprise_ids())
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);