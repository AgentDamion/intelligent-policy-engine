-- ============================================================================
-- BETA LAUNCH DATABASE SECURITY & PERFORMANCE FIX
-- ============================================================================
-- Fixes: 18 tables had RLS policies but RLS was disabled (critical security issue)
-- Adds: Missing composite indexes for audit_events performance
-- Adds: Immutability policies for compliance audit trails

-- ============================================================================
-- PHASE 1: Enable RLS on Critical Tables
-- ============================================================================

-- CRITICAL TIER (User authentication & tenant isolation)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- HIGH TIER (Core business logic)
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- MEDIUM TIER (Supporting features)
ALTER TABLE public.ai_tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfp_question_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_configurations ENABLE ROW LEVEL SECURITY;

-- LOW TIER (Logging/monitoring)
ALTER TABLE public.platform_integration_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PHASE 2: Add Missing Composite Indexes for Performance
-- ============================================================================

-- Index for workspace-scoped audit queries (most common in dashboards)
CREATE INDEX IF NOT EXISTS idx_audit_events_workspace_created
ON public.audit_events (workspace_id, created_at DESC);

-- Index for enterprise-scoped audit queries
CREATE INDEX IF NOT EXISTS idx_audit_events_enterprise_created  
ON public.audit_events (enterprise_id, created_at DESC);

-- ============================================================================
-- PHASE 4: Add Audit Immutability Policies (Compliance Requirement)
-- ============================================================================

-- Prevent updates to audit events
CREATE POLICY "audit_events_immutable" ON public.audit_events
FOR UPDATE USING (false);

-- Prevent deletion of audit events
CREATE POLICY "audit_events_no_delete" ON public.audit_events
FOR DELETE USING (false);

-- Prevent updates to AI agent decisions (also part of audit trail)
CREATE POLICY "ai_agent_decisions_immutable" ON public.ai_agent_decisions
FOR UPDATE USING (false);

-- Prevent deletion of AI agent decisions
CREATE POLICY "ai_agent_decisions_no_delete" ON public.ai_agent_decisions  
FOR DELETE USING (false);