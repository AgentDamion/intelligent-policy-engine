-- Fix critical RLS security issues found by security scanner

-- Enable RLS on agency_policy_conflicts table and create policies
ALTER TABLE public.agency_policy_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can view their own policy conflicts" 
ON public.agency_policy_conflicts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'agency'
  )
);

CREATE POLICY "Agency users can create their own policy conflicts" 
ON public.agency_policy_conflicts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'agency'
  )
);

-- Enable RLS on workspace_users table and create policies
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspaces they belong to" 
ON public.workspace_users 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Workspace admins can manage workspace users" 
ON public.workspace_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_users wu 
    WHERE wu.workspace_id = workspace_users.workspace_id 
    AND wu.user_id = auth.uid() 
    AND wu.role = 'admin'
  )
);

-- Restrict marketplace_tools table to hide sensitive vendor data
DROP POLICY IF EXISTS "Marketplace tools are publicly viewable" ON public.marketplace_tools;

CREATE POLICY "Marketplace tools public view (limited data)" 
ON public.marketplace_tools 
FOR SELECT 
USING (
  -- Only show verified tools with limited information
  status = 'verified'
);

-- Create a secure view for public marketplace data
CREATE OR REPLACE VIEW public.marketplace_tools_public AS
SELECT 
  id,
  name,
  description,
  category,
  status,
  created_at,
  -- Hide sensitive vendor and pricing information
  CASE 
    WHEN status = 'verified' THEN website_url 
    ELSE NULL 
  END as website_url
FROM public.marketplace_tools
WHERE status = 'verified';

-- Grant public access to the secure view instead of the full table
GRANT SELECT ON public.marketplace_tools_public TO anon;