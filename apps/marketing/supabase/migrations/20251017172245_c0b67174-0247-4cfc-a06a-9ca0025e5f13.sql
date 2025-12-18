-- Create app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('enterprise', 'partner', 'vendor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table (separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role, enterprise_id, workspace_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- RLS policies
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user trigger to use user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type TEXT;
  v_role public.app_role;
  v_enterprise_id UUID;
  v_workspace_id UUID;
BEGIN
  -- Get account_type from metadata
  v_account_type := COALESCE(
    NEW.raw_user_meta_data->>'account_type',
    'enterprise'
  );

  -- Map account_type to app_role enum
  v_role := v_account_type::public.app_role;

  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, account_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    v_account_type::account_type
  );

  -- Assign to sample enterprise/workspace based on account type
  IF v_account_type = 'enterprise' THEN
    v_enterprise_id := '550e8400-e29b-41d4-a716-446655440001'; -- Acme Pharma
    v_workspace_id := '660e8400-e29b-41d4-a716-446655440001';
  ELSIF v_account_type = 'partner' THEN
    v_enterprise_id := '550e8400-e29b-41d4-a716-446655440002'; -- Digital Health Agency
    v_workspace_id := '660e8400-e29b-41d4-a716-446655440002';
  END IF;

  -- Insert role into user_roles table (SECURE - separate from profiles)
  IF v_enterprise_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, enterprise_id, workspace_id)
    VALUES (NEW.id, v_role, v_enterprise_id, v_workspace_id);
    
    -- Add to enterprise_members
    INSERT INTO public.enterprise_members (user_id, enterprise_id, role)
    VALUES (NEW.id, v_enterprise_id, 'member')
    ON CONFLICT (user_id, enterprise_id) DO NOTHING;
    
    -- Add to workspace_members
    INSERT INTO public.workspace_members (user_id, workspace_id, role)
    VALUES (NEW.id, v_workspace_id, 'admin')
    ON CONFLICT (user_id, workspace_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;