-- migrations/20250829150000_add_auth_metadata_functions.sql
-- This adds helper functions to manage user metadata consistently

-- Function to set enterprise context for a user
CREATE OR REPLACE FUNCTION public.set_user_enterprise_context(
  user_id UUID,
  enterprise_id UUID,
  role TEXT DEFAULT 'member',
  workspace_ids UUID[] DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_metadata JSONB;
BEGIN
  -- Update the user's app_metadata in auth.users
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'enterprise_id', enterprise_id,
    'enterprise_role', role,
    'workspace_ids', workspace_ids,
    'updated_at', NOW()
  )
  WHERE id = user_id
  RETURNING raw_app_meta_data INTO updated_metadata;
  
  -- Also ensure they exist in our enterprise_members table
  INSERT INTO public.enterprise_members (user_id, enterprise_id, role)
  VALUES (user_id, enterprise_id, role::enterprise_role_enum)
  ON CONFLICT (user_id, enterprise_id) 
  DO UPDATE SET role = EXCLUDED.role;
  
  RETURN updated_metadata;
END;
$$;

-- Function to get user's full context (called after login)
CREATE OR REPLACE FUNCTION public.get_user_context(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  context JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_id', u.id,
    'email', u.email,
    'enterprise_id', u.raw_app_meta_data->>'enterprise_id',
    'enterprise_role', u.raw_app_meta_data->>'enterprise_role',
    'enterprises', (
      SELECT jsonb_agg(jsonb_build_object(
        'enterprise_id', em.enterprise_id,
        'role', em.role,
        'name', e.name
      ))
      FROM public.enterprise_members em
      JOIN public.enterprises e ON e.id = em.enterprise_id
      WHERE em.user_id = u.id
    ),
    'workspaces', (
      SELECT jsonb_agg(jsonb_build_object(
        'workspace_id', wm.workspace_id,
        'role', wm.role,
        'name', w.name
      ))
      FROM public.workspace_members wm
      JOIN public.workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = u.id
    )
  ) INTO context
  FROM auth.users u
  WHERE u.id = user_id;
  
  RETURN context;
END;
$$;

-- Trigger to sync auth.users metadata with our tables
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When enterprise_members changes, update auth.users metadata
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
      'enterprise_id', NEW.enterprise_id,
      'enterprise_role', NEW.role::text
    )
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON public.enterprise_members;

-- Create the trigger
CREATE TRIGGER sync_user_metadata_trigger
AFTER INSERT OR UPDATE ON public.enterprise_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_metadata();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_user_enterprise_context(UUID, UUID, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO authenticated;
