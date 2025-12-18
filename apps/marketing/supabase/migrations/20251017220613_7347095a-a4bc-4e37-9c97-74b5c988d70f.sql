-- Fix handle_new_user() to map account_type to existing app_role enum values
-- The app_role enum already exists with: ('owner', 'admin', 'member', 'viewer')
-- We need to map account_type values to these existing roles

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

  -- Map account_type to existing app_role enum values
  v_role := CASE v_account_type
    WHEN 'enterprise' THEN 'admin'::public.app_role
    WHEN 'partner' THEN 'member'::public.app_role
    WHEN 'vendor' THEN 'member'::public.app_role
    WHEN 'admin' THEN 'admin'::public.app_role
    ELSE 'member'::public.app_role
  END;

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