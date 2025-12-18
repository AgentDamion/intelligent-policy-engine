-- Fix RLS Disabled in Public schema security issue
-- This migration enables RLS on all public tables that currently have it disabled

-- Enable RLS on tables that need it
ALTER TABLE public.agency_policy_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supabase_migrations ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for agency_policy_compliance (organization-scoped)
CREATE POLICY "Users can view organization agency compliance" 
ON public.agency_policy_compliance 
FOR SELECT 
USING (agency_id IN (
  SELECT id FROM users_enhanced 
  WHERE organization_id = get_current_user_organization_id()
));

CREATE POLICY "Admins can manage agency compliance" 
ON public.agency_policy_compliance 
FOR ALL 
USING (is_current_user_admin_for_organization(
  (SELECT organization_id FROM users_enhanced WHERE id = agency_id)
));

-- Add RLS policies for policy_distributions (organization-scoped)
CREATE POLICY "Users can view organization policy distributions" 
ON public.policy_distributions 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Admins can manage policy distributions" 
ON public.policy_distributions 
FOR ALL 
USING (is_current_user_admin_for_organization(organization_id));

-- Restrict supabase_migrations to prevent data exposure
CREATE POLICY "Only system can access migrations" 
ON public.supabase_migrations 
FOR ALL 
USING (false);

-- Fix function search_path security issues
CREATE OR REPLACE FUNCTION public.update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public';