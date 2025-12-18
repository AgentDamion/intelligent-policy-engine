-- Add subscription tier infrastructure for revenue protection

-- Create subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('foundation', 'enterprise', 'network_command');

-- Add subscription tier to enterprises table
ALTER TABLE public.enterprises 
ADD COLUMN subscription_tier subscription_tier DEFAULT 'foundation'::subscription_tier NOT NULL;

-- Create tier limits lookup table
CREATE TABLE public.subscription_tier_limits (
  tier subscription_tier PRIMARY KEY,
  max_partners integer NOT NULL,
  max_workspaces integer NOT NULL,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Insert tier limits
INSERT INTO public.subscription_tier_limits (tier, max_partners, max_workspaces, features) VALUES
('foundation', 10, 5, '{"audit_export": false, "tool_intelligence": false, "advanced_workflows": false}'::jsonb),
('enterprise', 50, 25, '{"audit_export": true, "tool_intelligence": false, "advanced_workflows": true}'::jsonb),
('network_command', 1000, 100, '{"audit_export": true, "tool_intelligence": true, "advanced_workflows": true}'::jsonb);

-- Create function to get current partner count for an enterprise
CREATE OR REPLACE FUNCTION public.get_enterprise_partner_count(enterprise_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(DISTINCT wm.user_id)::integer
  FROM workspace_members wm
  JOIN workspaces w ON w.id = wm.workspace_id
  WHERE w.enterprise_id = enterprise_id_param;
$$;

-- Create function to check if enterprise can add partners
CREATE OR REPLACE FUNCTION public.can_enterprise_add_partner(enterprise_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(public.get_enterprise_partner_count(enterprise_id_param), 0) < stl.max_partners
  FROM enterprises e
  JOIN subscription_tier_limits stl ON stl.tier = e.subscription_tier
  WHERE e.id = enterprise_id_param;
$$;

-- Enable RLS on new table
ALTER TABLE public.subscription_tier_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for tier limits (readable by all authenticated users)
CREATE POLICY "Subscription tier limits are viewable by authenticated users"
ON public.subscription_tier_limits
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add index for performance
CREATE INDEX idx_enterprises_subscription_tier ON public.enterprises(subscription_tier);
CREATE INDEX idx_workspaces_enterprise_id ON public.workspaces(enterprise_id);