-- ⚠️ WARNING: DEVELOPMENT ONLY - DISABLES ROW LEVEL SECURITY ⚠️
-- This migration disables RLS for development purposes
-- DO NOT DEPLOY TO PRODUCTION
-- Re-enable RLS using restore_rls_when_ready.sql when development is complete

-- =============================================================================
-- TIER 1: Platform Integrations (Critical)
-- =============================================================================

ALTER TABLE public.platform_configurations DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.platform_configurations IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.platform_integration_logs DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.platform_integration_logs IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

-- =============================================================================
-- TIER 2: Core Development Tables (High Priority)
-- =============================================================================

ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.workspaces IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.workspace_members IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.enterprises DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.enterprises IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.enterprise_members DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.enterprise_members IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.profiles IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.policies DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.policies IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.policy_versions DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.policy_versions IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.submissions IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.projects IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.ai_tool_usage DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.ai_tool_usage IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

-- =============================================================================
-- TIER 3: Supporting Tables (Medium Priority)
-- =============================================================================

ALTER TABLE public.audit_events DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.audit_events IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.agent_activities DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.agent_activities IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.ai_agent_decisions DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.ai_agent_decisions IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.policy_distributions DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.policy_distributions IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.rfp_question_library DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.rfp_question_library IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

-- =============================================================================
-- Additional Development Tables
-- =============================================================================

ALTER TABLE public.submission_items DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.submission_items IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.scores DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.scores IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.user_roles IS 'RLS DISABLED FOR DEVELOPMENT - Re-enable before production deployment';

-- =============================================================================
-- Audit Trail
-- =============================================================================

INSERT INTO public.audit_events (
  event_type,
  details
) VALUES (
  'rls_disabled_for_development',
  jsonb_build_object(
    'timestamp', now(),
    'reason', 'Development in progress - RLS temporarily disabled',
    'tables_affected', ARRAY[
      'platform_configurations',
      'platform_integration_logs',
      'workspaces',
      'workspace_members',
      'enterprises',
      'enterprise_members',
      'profiles',
      'policies',
      'policy_versions',
      'submissions',
      'projects',
      'ai_tool_usage',
      'audit_events',
      'agent_activities',
      'ai_agent_decisions',
      'policy_distributions',
      'rfp_question_library',
      'submission_items',
      'scores',
      'user_roles'
    ],
    'warning', 'DO NOT DEPLOY TO PRODUCTION WITH RLS DISABLED'
  )
);