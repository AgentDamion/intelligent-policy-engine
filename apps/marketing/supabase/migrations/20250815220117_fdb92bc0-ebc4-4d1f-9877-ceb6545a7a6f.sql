-- Create a security definer function to get current user's organization ID
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users_enhanced WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view organization compliance metrics" ON public.compliance_metrics;
DROP POLICY IF EXISTS "Users can view organization agent statuses" ON public.agent_statuses;
DROP POLICY IF EXISTS "Users can view organization workflows" ON public.active_workflows;
DROP POLICY IF EXISTS "Users can view organization quick actions" ON public.quick_actions;

DROP POLICY IF EXISTS "Admins can manage compliance metrics" ON public.compliance_metrics;
DROP POLICY IF EXISTS "Admins can manage agent statuses" ON public.agent_statuses;
DROP POLICY IF EXISTS "Admins can manage workflows" ON public.active_workflows;
DROP POLICY IF EXISTS "Admins can manage quick actions" ON public.quick_actions;

-- Create new policies using the security definer function
CREATE POLICY "Users can view organization compliance metrics" 
ON public.compliance_metrics FOR SELECT 
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "Users can view organization agent statuses" 
ON public.agent_statuses FOR SELECT 
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "Users can view organization workflows" 
ON public.active_workflows FOR SELECT 
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "Users can view organization quick actions" 
ON public.quick_actions FOR SELECT 
USING (organization_id = public.get_current_user_organization_id());

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin_for_organization(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_enhanced 
    WHERE organization_id = org_id 
    AND id = auth.uid() 
    AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Admin policies using the new function
CREATE POLICY "Admins can manage compliance metrics" 
ON public.compliance_metrics FOR ALL 
USING (public.is_current_user_admin_for_organization(organization_id));

CREATE POLICY "Admins can manage agent statuses" 
ON public.agent_statuses FOR ALL 
USING (public.is_current_user_admin_for_organization(organization_id));

CREATE POLICY "Admins can manage workflows" 
ON public.active_workflows FOR ALL 
USING (public.is_current_user_admin_for_organization(organization_id));

CREATE POLICY "Admins can manage quick actions" 
ON public.quick_actions FOR ALL 
USING (public.is_current_user_admin_for_organization(organization_id));