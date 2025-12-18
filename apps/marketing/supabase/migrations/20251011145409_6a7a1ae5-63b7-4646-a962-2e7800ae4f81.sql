-- Fix search_path for 3 public JWT functions to prevent search path injection

-- 1. jwt_has_enterprise
CREATE OR REPLACE FUNCTION public.jwt_has_enterprise(enterprise_id uuid)
RETURNS boolean 
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT enterprise_id = ANY(
    COALESCE(
      (auth.jwt()->>'enterprises')::uuid[],
      ARRAY[]::uuid[]
    )
  );
$function$;

-- 2. jwt_has_workspace
CREATE OR REPLACE FUNCTION public.jwt_has_workspace(workspace_id uuid)
RETURNS boolean 
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT workspace_id = ANY(
    COALESCE(
      (auth.jwt()->>'workspaces')::uuid[],
      ARRAY[]::uuid[]
    )
  );
$function$;

-- 3. jwt_is_admin
CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS boolean 
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT COALESCE((auth.jwt()->>'is_admin')::boolean, false);
$function$;