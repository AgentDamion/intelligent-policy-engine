-- ============================================
-- Fix security definer views to use security invoker
-- ============================================

-- Fix audit_logs_view to use SECURITY INVOKER instead of SECURITY DEFINER
CREATE OR REPLACE VIEW audit_logs_view
WITH (security_invoker = true)
AS
WITH combined_logs AS (
  SELECT 
    'agent_activity'::text as record_type,
    a.id::text as record_id,
    a.created_at as log_created_at,
    a.workspace_id as result_workspace_id,
    a.enterprise_id as result_enterprise_id,
    NULL::uuid as result_actor_id,
    (a.agent || ':' || a.action)::text as action_type,
    a.details::jsonb as metadata
  FROM public.agent_activities a

  UNION ALL

  SELECT 
    'ai_decision'::text as record_type,
    d.id::text as record_id,
    d.created_at as log_created_at,
    NULL::uuid as result_workspace_id,
    d.enterprise_id as result_enterprise_id,
    NULL::uuid as result_actor_id,
    (d.agent || ':' || d.action)::text as action_type,
    d.details::jsonb as metadata
  FROM public.ai_agent_decisions d

  UNION ALL

  SELECT 
    'audit_event'::text as record_type,
    e.id::text as record_id,
    e.created_at as log_created_at,
    e.workspace_id as result_workspace_id,
    e.enterprise_id as result_enterprise_id,
    e.user_id as result_actor_id,
    e.event_type::text as action_type,
    e.details::jsonb as metadata
  FROM public.audit_events e
)
SELECT 
  cl.record_type,
  cl.record_id,
  cl.log_created_at as created_at,
  cl.result_workspace_id as workspace_id,
  cl.result_enterprise_id as enterprise_id,
  cl.result_actor_id as actor_id,
  cl.action_type,
  cl.metadata
FROM combined_logs cl;

-- ============================================
-- Fix mutable search_path in security definer functions
-- ============================================

-- Fix prevent_enterprise_change to use fixed search_path
CREATE OR REPLACE FUNCTION prevent_enterprise_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.enterprise_id IS DISTINCT FROM NEW.enterprise_id THEN
    RAISE EXCEPTION 'Cannot change workspace enterprise_id after creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;