-- Critical Security Migration: Cleanup and Apply (FINAL)
-- Clean up partial policies from failed attempts, then apply all security fixes

-- Clean up any existing policies from failed migrations
DROP POLICY IF EXISTS "Users can view exports from their sandbox runs" ON public.exports_log;
DROP POLICY IF EXISTS "Users can create exports for their sandbox runs" ON public.exports_log;
DROP POLICY IF EXISTS "Service role can manage exports" ON public.exports_log;
DROP POLICY IF EXISTS "Users can view governance events in their workspace" ON public.governance_events;
DROP POLICY IF EXISTS "Service role can insert governance events" ON public.governance_events;
DROP POLICY IF EXISTS "governance_events_immutable" ON public.governance_events;
DROP POLICY IF EXISTS "governance_events_no_delete" ON public.governance_events;
DROP POLICY IF EXISTS "Service role can manage platform syncs" ON public.platform_document_syncs;
DROP POLICY IF EXISTS "Users can view approvals from their sandbox runs" ON public.sandbox_approvals;
DROP POLICY IF EXISTS "Service role can manage sandbox approvals" ON public.sandbox_approvals;
DROP POLICY IF EXISTS "Users can view controls from their sandbox runs" ON public.sandbox_controls;
DROP POLICY IF EXISTS "Service role can manage sandbox controls" ON public.sandbox_controls;
DROP POLICY IF EXISTS "Users can view sandbox runs in their workspaces" ON public.sandbox_runs;
DROP POLICY IF EXISTS "Workspace members can create sandbox runs" ON public.sandbox_runs;
DROP POLICY IF EXISTS "Workspace members can update sandbox runs" ON public.sandbox_runs;

-- ============================================================================
-- PART 1: Enable RLS on 6 tables
-- ============================================================================

-- 1. exports_log
ALTER TABLE public.exports_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view exports from their sandbox runs"
ON public.exports_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sandbox_runs sr
    WHERE sr.id = exports_log.run_id
    AND sr.workspace_id = ANY(get_user_workspaces(auth.uid()))
  )
);

CREATE POLICY "Service role can manage exports"
ON public.exports_log
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. governance_events
ALTER TABLE public.governance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view governance events in their workspace"
ON public.governance_events
FOR SELECT
USING (
  workspace_id = ANY(get_user_workspaces(auth.uid()))
);

CREATE POLICY "Service role can insert governance events"
ON public.governance_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "governance_events_immutable"
ON public.governance_events
FOR UPDATE
USING (false);

CREATE POLICY "governance_events_no_delete"
ON public.governance_events
FOR DELETE
USING (false);

-- 3. platform_document_syncs
ALTER TABLE public.platform_document_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage platform syncs"
ON public.platform_document_syncs
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. sandbox_approvals
ALTER TABLE public.sandbox_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals from their sandbox runs"
ON public.sandbox_approvals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sandbox_runs sr
    WHERE sr.id = sandbox_approvals.run_id
    AND sr.workspace_id = ANY(get_user_workspaces(auth.uid()))
  )
);

CREATE POLICY "Service role can manage sandbox approvals"
ON public.sandbox_approvals
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. sandbox_controls
ALTER TABLE public.sandbox_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view controls from their sandbox runs"
ON public.sandbox_controls
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sandbox_runs sr
    WHERE sr.id = sandbox_controls.run_id
    AND sr.workspace_id = ANY(get_user_workspaces(auth.uid()))
  )
);

CREATE POLICY "Service role can manage sandbox controls"
ON public.sandbox_controls
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. sandbox_runs
ALTER TABLE public.sandbox_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sandbox runs in their workspaces"
ON public.sandbox_runs
FOR SELECT
USING (
  workspace_id = ANY(get_user_workspaces(auth.uid()))
);

CREATE POLICY "Workspace members can create sandbox runs"
ON public.sandbox_runs
FOR INSERT
WITH CHECK (
  workspace_id = ANY(get_user_workspaces(auth.uid()))
);

CREATE POLICY "Workspace members can update sandbox runs"
ON public.sandbox_runs
FOR UPDATE
USING (
  workspace_id = ANY(get_user_workspaces(auth.uid()))
);

-- ============================================================================
-- PART 2: Fix search_path for SECURITY DEFINER functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  claims jsonb; user_id uuid; user_enterprises uuid[]; user_workspaces uuid[];
  user_account_type text; primary_enterprise uuid; primary_workspace uuid; is_admin boolean;
BEGIN
  user_id := (event->>'user_id')::uuid;
  SELECT account_type::text INTO user_account_type FROM profiles WHERE id = user_id;
  SELECT ARRAY_AGG(DISTINCT enterprise_id) INTO user_enterprises FROM enterprise_members WHERE user_id = user_id;
  SELECT ARRAY_AGG(DISTINCT workspace_id) INTO user_workspaces FROM workspace_members WHERE user_id = user_id;
  SELECT enterprise_id INTO primary_enterprise FROM enterprise_members WHERE user_id = user_id ORDER BY created_at ASC LIMIT 1;
  SELECT workspace_id INTO primary_workspace FROM workspace_members WHERE user_id = user_id ORDER BY joined_at ASC LIMIT 1;
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = user_id AND role IN ('admin', 'owner')) INTO is_admin;
  claims := jsonb_build_object('enterprises', COALESCE(user_enterprises, ARRAY[]::uuid[]), 'workspaces', COALESCE(user_workspaces, ARRAY[]::uuid[]), 
    'account_type', COALESCE(user_account_type, 'enterprise'), 'primary_enterprise', primary_enterprise, 'primary_workspace', primary_workspace, 
    'is_admin', COALESCE(is_admin, false), 'claims_version', 1);
  RETURN jsonb_set(event, '{claims}', claims);
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_enterprise_add_partner(enterprise_id_param uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE(public.get_enterprise_partner_count(enterprise_id_param), 0) < stl.max_partners
  FROM enterprises e JOIN subscription_tier_limits stl ON stl.tier = e.subscription_tier WHERE e.id = enterprise_id_param;
$function$;

CREATE OR REPLACE FUNCTION public.get_enterprise_partner_count(enterprise_id_param uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COUNT(DISTINCT wm.user_id)::integer FROM workspace_members wm JOIN workspaces w ON w.id = wm.workspace_id WHERE w.enterprise_id = enterprise_id_param;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_workspaces(user_uuid uuid)
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT ARRAY_AGG(workspace_id) FROM workspace_members WHERE user_id = user_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(user_uuid uuid, workspace_uuid uuid, required_role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_uuid AND workspace_id = workspace_uuid AND role >= required_role);
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_of_enterprise_or_workspace(enterprise_id uuid DEFAULT NULL::uuid, workspace_id uuid DEFAULT NULL::uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
    IF enterprise_id IS NOT NULL THEN
        RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND enterprise_id = is_admin_of_enterprise_or_workspace.enterprise_id AND role IN ('admin', 'owner'));
    END IF;
    IF workspace_id IS NOT NULL THEN
        RETURN EXISTS (SELECT 1 FROM workspace_members WHERE user_id = auth.uid() AND workspace_id = is_admin_of_enterprise_or_workspace.workspace_id AND role IN ('admin', 'owner'));
    END IF;
    RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_demo_user(check_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT check_user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) OR public.is_demo_user(_user_id);
$function$;