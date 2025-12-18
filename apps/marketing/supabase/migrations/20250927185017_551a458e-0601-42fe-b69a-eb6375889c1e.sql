-- Production readiness improvements (without CONCURRENTLY)

-- Enable real-time for key tables
ALTER TABLE public.ai_agent_decisions REPLICA IDENTITY FULL;
ALTER TABLE public.agent_activities REPLICA IDENTITY FULL;
ALTER TABLE public.approval_workflows REPLICA IDENTITY FULL;
ALTER TABLE public.submissions REPLICA IDENTITY FULL;

-- Add indexes for better dashboard performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_enterprise_created 
ON public.ai_agent_decisions(enterprise_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_activities_workspace_created 
ON public.agent_activities(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_enterprise_status 
ON public.approval_workflows(enterprise_id, current_stage, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_workspace_status 
ON public.submissions(workspace_id, status, created_at DESC);

-- Add dashboard performance monitoring function
CREATE OR REPLACE FUNCTION public.log_dashboard_performance(
  dashboard_type text,
  load_time_ms integer,
  user_id uuid DEFAULT auth.uid(),
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_events (
    event_type,
    user_id,
    details,
    created_at
  ) VALUES (
    'dashboard_performance',
    user_id,
    jsonb_build_object(
      'dashboard_type', dashboard_type,
      'load_time_ms', load_time_ms,
      'metadata', metadata
    ),
    now()
  );
END;
$$;