-- Custom JWT Claims Hook for Supabase Auth
-- This function adds user's enterprises, workspaces, and roles to the JWT token
-- Reduces database queries by embedding context in the token itself

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.custom_access_token_hook(event jsonb);

-- Create the custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_id uuid;
  user_enterprises uuid[];
  user_workspaces uuid[];
  user_account_type text;
  primary_enterprise uuid;
  primary_workspace uuid;
  is_admin boolean;
BEGIN
  -- Extract user ID from the event
  user_id := (event->>'user_id')::uuid;
  
  -- Get user's account type from profiles
  SELECT account_type::text
  INTO user_account_type
  FROM profiles
  WHERE id = user_id;
  
  -- Get all enterprises the user belongs to
  SELECT ARRAY_AGG(DISTINCT enterprise_id)
  INTO user_enterprises
  FROM enterprise_members
  WHERE user_id = user_id;
  
  -- Get all workspaces the user belongs to
  SELECT ARRAY_AGG(DISTINCT workspace_id)
  INTO user_workspaces
  FROM workspace_members
  WHERE user_id = user_id;
  
  -- Get primary enterprise (first one, or null)
  SELECT enterprise_id
  INTO primary_enterprise
  FROM enterprise_members
  WHERE user_id = user_id
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Get primary workspace (first one, or null)
  SELECT workspace_id
  INTO primary_workspace
  FROM workspace_members
  WHERE user_id = user_id
  ORDER BY joined_at ASC
  LIMIT 1;
  
  -- Check if user has admin role in any context
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = user_id
    AND role IN ('admin', 'owner')
  ) INTO is_admin;
  
  -- Build the custom claims object
  claims := jsonb_build_object(
    'enterprises', COALESCE(user_enterprises, ARRAY[]::uuid[]),
    'workspaces', COALESCE(user_workspaces, ARRAY[]::uuid[]),
    'account_type', COALESCE(user_account_type, 'enterprise'),
    'primary_enterprise', primary_enterprise,
    'primary_workspace', primary_workspace,
    'is_admin', COALESCE(is_admin, false),
    'claims_version', 1  -- For future cache invalidation
  );
  
  -- Add claims to the event
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;

-- Add comment explaining the function
COMMENT ON FUNCTION public.custom_access_token_hook IS 'Custom JWT claims hook that adds user context (enterprises, workspaces, roles) to access tokens. This reduces database queries by embedding user context in the JWT.';

-- Create optimized helper functions that use JWT claims
CREATE OR REPLACE FUNCTION public.jwt_has_enterprise(enterprise_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT enterprise_id = ANY(
    COALESCE(
      (auth.jwt()->>'enterprises')::uuid[],
      ARRAY[]::uuid[]
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.jwt_has_workspace(workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT workspace_id = ANY(
    COALESCE(
      (auth.jwt()->>'workspaces')::uuid[],
      ARRAY[]::uuid[]
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt()->>'is_admin')::boolean, false);
$$;

-- Add comments
COMMENT ON FUNCTION public.jwt_has_enterprise IS 'Check if current user has access to enterprise using JWT claims (fast, no DB query)';
COMMENT ON FUNCTION public.jwt_has_workspace IS 'Check if current user has access to workspace using JWT claims (fast, no DB query)';
COMMENT ON FUNCTION public.jwt_is_admin IS 'Check if current user is admin using JWT claims (fast, no DB query)';

-- Example: Update one RLS policy to use JWT claims instead of database lookup
-- This demonstrates the performance improvement pattern

-- Drop and recreate policy for policies table
DROP POLICY IF EXISTS "Users can view policies in their enterprises" ON policies;

CREATE POLICY "Users can view policies in their enterprises"
ON policies
FOR SELECT
TO authenticated
USING (
  -- Use JWT claims instead of get_user_enterprises() function
  jwt_has_enterprise(enterprise_id)
);

-- Update workspace_members policy
DROP POLICY IF EXISTS "Users can view their workspace memberships" ON workspace_members;

CREATE POLICY "Users can view their workspace memberships"
ON workspace_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR jwt_has_workspace(workspace_id)
);

-- Update enterprise_members policy
DROP POLICY IF EXISTS "Users can view their enterprise memberships" ON enterprise_members;

CREATE POLICY "Users can view their enterprise memberships"
ON enterprise_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR jwt_has_enterprise(enterprise_id)
);