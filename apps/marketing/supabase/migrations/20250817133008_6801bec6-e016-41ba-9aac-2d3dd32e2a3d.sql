-- Fix confidential contract details security issue
-- Replace overly permissive RLS policy with role-based access controls

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view organization contracts" ON public.contracts;

-- Create more restrictive policies for contract access

-- Policy 1: Contract stakeholders can view contracts they're assigned to
CREATE POLICY "Contract stakeholders can view assigned contracts" 
ON public.contracts 
FOR SELECT 
USING (
  auth.uid() = business_owner_id OR 
  auth.uid() = legal_owner_id OR 
  auth.uid() = procurement_owner_id
);

-- Policy 2: Organization admins can view all organization contracts
CREATE POLICY "Admins can view organization contracts" 
ON public.contracts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users_enhanced 
    WHERE users_enhanced.organization_id = contracts.organization_id 
    AND users_enhanced.id = auth.uid() 
    AND users_enhanced.role = 'admin'
  )
);

-- Create enum type for roles (without IF NOT EXISTS syntax)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'contract_viewer', 'finance', 'legal', 'procurement');
    END IF;
END $$;

-- Create user_roles table for granular role management
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    organization_id uuid NOT NULL,
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role, organization_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.user_has_role(_user_id uuid, _role app_role, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND organization_id = _org_id
  )
$$;

-- Policy 3: Users with contract-related roles can view organization contracts
CREATE POLICY "Contract role users can view organization contracts" 
ON public.contracts 
FOR SELECT 
USING (
  user_has_role(auth.uid(), 'contract_viewer'::app_role, organization_id) OR
  user_has_role(auth.uid(), 'finance'::app_role, organization_id) OR
  user_has_role(auth.uid(), 'legal'::app_role, organization_id) OR
  user_has_role(auth.uid(), 'procurement'::app_role, organization_id)
);

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage organization roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users_enhanced 
    WHERE users_enhanced.organization_id = user_roles.organization_id 
    AND users_enhanced.id = auth.uid() 
    AND users_enhanced.role = 'admin'
  )
);