-- Fix search_path for 8 functions to prevent search path injection
-- All trigger functions and regular functions need explicit search_path

-- 1. update_sandbox_runs_updated_at
CREATE OR REPLACE FUNCTION public.update_sandbox_runs_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. update_rfp_question_updated_at
CREATE OR REPLACE FUNCTION public.update_rfp_question_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 3. update_rfp_tool_disclosures_updated_at
CREATE OR REPLACE FUNCTION public.update_rfp_tool_disclosures_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. tg_set_updated_at (change empty search_path to 'public')
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- 5. update_project_ai_tool_usage (change empty search_path to 'public')
CREATE OR REPLACE FUNCTION public.update_project_ai_tool_usage()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.project_ai_tool_usage (
        project_id, enterprise_id, workspace_id, tool_name, vendor_name,
        usage_count, first_used, last_used, compliance_status, risk_level
    )
    VALUES (
        NEW.client_id, 
        (SELECT workspace_id FROM public.projects WHERE id = NEW.client_id),
        (SELECT workspace_id FROM public.projects WHERE id = NEW.client_id),
        NEW.tool_name,
        NEW.vendor_name,
        1,
        NEW.timestamp,
        NEW.timestamp,
        NEW.compliance_status,
        NEW.risk_level
    )
    ON CONFLICT (project_id, tool_name, vendor_name)
    DO UPDATE SET
        usage_count = project_ai_tool_usage.usage_count + 1,
        last_used = GREATEST(project_ai_tool_usage.last_used, NEW.timestamp),
        compliance_status = CASE 
            WHEN NEW.compliance_status != 'unknown' THEN NEW.compliance_status
            ELSE project_ai_tool_usage.compliance_status
        END,
        risk_level = CASE 
            WHEN NEW.risk_level != 'unknown' THEN NEW.risk_level
            ELSE project_ai_tool_usage.risk_level
        END,
        updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 6. prevent_audit_modifications (change empty search_path to 'public')
CREATE OR REPLACE FUNCTION public.prevent_audit_modifications()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        RAISE EXCEPTION 'Cannot delete audit events';
    ELSIF (TG_OP = 'UPDATE') THEN
        RAISE EXCEPTION 'Cannot modify audit events';
    END IF;
    RETURN NULL;
END;
$function$;

-- 7. example_function (change empty search_path to 'public')
CREATE OR REPLACE FUNCTION public.example_function(workspace_id_param uuid)
RETURNS TABLE(name text, enterprise_name text) 
LANGUAGE sql
SET search_path TO 'public'
AS $function$
    SELECT 
        public.workspaces.name, 
        public.workspaces.enterprise_name
    FROM public.workspaces
    WHERE public.workspaces.id = workspace_id_param;
$function$;

-- 8. my_function (change empty search_path to 'public')
CREATE OR REPLACE FUNCTION public.my_function()
RETURNS void 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.workspaces (name) VALUES ('New Workspace');
END;
$function$;