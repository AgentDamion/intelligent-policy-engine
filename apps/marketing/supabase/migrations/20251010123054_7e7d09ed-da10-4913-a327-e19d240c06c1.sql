-- Phase 1: Policy Sandbox Database Foundation (without RLS)
-- Creates core tables, views, and helper functions for simulation feature

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. sandbox_runs: Stores simulation scenarios and results
CREATE TABLE IF NOT EXISTS public.sandbox_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Scenario inputs
  scenario_name TEXT NOT NULL,
  inputs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Simulation results
  outputs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D', 'E', 'F')),
  risk_score NUMERIC(5,2) CHECK (risk_score >= 0 AND risk_score <= 100),
  control_coverage NUMERIC(5,2) CHECK (control_coverage >= 0 AND control_coverage <= 100),
  
  -- Proof pack immutability
  proof_hash TEXT,
  
  -- Metadata
  run_status TEXT NOT NULL DEFAULT 'pending' CHECK (run_status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT
);

CREATE INDEX idx_sandbox_runs_workspace ON public.sandbox_runs(workspace_id);
CREATE INDEX idx_sandbox_runs_created_by ON public.sandbox_runs(created_by);
CREATE INDEX idx_sandbox_runs_created_at ON public.sandbox_runs(created_at DESC);
CREATE INDEX idx_sandbox_runs_grade ON public.sandbox_runs(grade);

-- 2. sandbox_controls: Individual control compliance checks per run
CREATE TABLE IF NOT EXISTS public.sandbox_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.sandbox_runs(id) ON DELETE CASCADE,
  
  -- Control details
  control_id TEXT NOT NULL,
  control_name TEXT NOT NULL,
  control_category TEXT NOT NULL,
  
  -- Check results
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'conditional', 'not_applicable')),
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  
  -- Remediation
  fix_suggestion TEXT,
  fix_effort_hours NUMERIC(6,2),
  
  -- Metadata
  check_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sandbox_controls_run ON public.sandbox_controls(run_id);
CREATE INDEX idx_sandbox_controls_status ON public.sandbox_controls(status);
CREATE INDEX idx_sandbox_controls_severity ON public.sandbox_controls(severity);

-- 3. sandbox_approvals: Approval workflow simulation per run
CREATE TABLE IF NOT EXISTS public.sandbox_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.sandbox_runs(id) ON DELETE CASCADE,
  
  -- Approval stage
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  
  -- Simulation results
  required BOOLEAN NOT NULL DEFAULT true,
  estimated_sla_hours INTEGER,
  approver_role TEXT,
  
  -- Conditional logic
  triggers_on JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sandbox_approvals_run ON public.sandbox_approvals(run_id);
CREATE INDEX idx_sandbox_approvals_stage_order ON public.sandbox_approvals(stage_order);

-- 4. exports_log: Tracks export actions for audit trail
CREATE TABLE IF NOT EXISTS public.exports_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.sandbox_runs(id) ON DELETE CASCADE,
  
  -- Export details
  target_platform TEXT NOT NULL CHECK (target_platform IN ('veeva', 'sharepoint', 'workfront', 'jira', 'asana', 'audit_queue', 'disclosure', 'rfp_fit')),
  exported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Export metadata
  export_format TEXT DEFAULT 'pdf',
  file_size_bytes BIGINT,
  export_status TEXT NOT NULL DEFAULT 'pending' CHECK (export_status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_exports_log_run ON public.exports_log(run_id);
CREATE INDEX idx_exports_log_exported_by ON public.exports_log(exported_by);
CREATE INDEX idx_exports_log_exported_at ON public.exports_log(exported_at DESC);

-- 5. governance_events: Observability events for Meta-Loop
CREATE TABLE IF NOT EXISTS public.governance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  run_id UUID REFERENCES public.sandbox_runs(id) ON DELETE CASCADE,
  
  -- Event context
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role_view TEXT CHECK (role_view IN ('enterprise', 'agency')),
  
  -- Event data
  grade TEXT,
  coverage NUMERIC(5,2),
  details JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_governance_events_type ON public.governance_events(event_type);
CREATE INDEX idx_governance_events_run ON public.governance_events(run_id);
CREATE INDEX idx_governance_events_workspace ON public.governance_events(workspace_id);
CREATE INDEX idx_governance_events_created_at ON public.governance_events(created_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- v_user_context: Role detection for React hooks
CREATE OR REPLACE VIEW public.v_user_context AS
SELECT DISTINCT
  em.user_id,
  em.enterprise_id,
  e.name AS enterprise_name,
  CASE 
    WHEN e.enterprise_type = 'agency' THEN 'agency'
    ELSE 'enterprise'
  END AS role_view
FROM public.enterprise_members em
JOIN public.enterprises e ON e.id = em.enterprise_id;

-- sandbox_runs_masked: SQL-layer data masking for agency users
CREATE OR REPLACE VIEW public.sandbox_runs_masked AS
SELECT
  id,
  workspace_id,
  created_by,
  created_at,
  updated_at,
  scenario_name,
  
  -- Redact internal details from inputs_json
  jsonb_build_object(
    'tool_count', inputs_json->'tool_count',
    'deployment_region', inputs_json->'deployment_region',
    'data_types', inputs_json->'data_types'
  ) AS inputs_json,
  
  -- Redact internal details from outputs_json
  jsonb_build_object(
    'grade', outputs_json->'grade',
    'summary', outputs_json->'summary',
    'top_fixes', outputs_json->'top_fixes'
  ) AS outputs_json,
  
  grade,
  risk_score,
  control_coverage,
  proof_hash,
  run_status,
  
  -- Hide error messages from agency users
  NULL AS error_message
FROM public.sandbox_runs;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_sandbox_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sandbox_runs_updated_at
BEFORE UPDATE ON public.sandbox_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_sandbox_runs_updated_at();

-- Helper function for context switching (optional utility)
CREATE OR REPLACE FUNCTION public.set_default_workspace(p_workspace_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Store workspace context for session
  PERFORM set_config('app.current_workspace_id', p_workspace_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.sandbox_runs IS 'Policy simulation scenarios and results';
COMMENT ON TABLE public.sandbox_controls IS 'Individual control compliance checks per simulation run';
COMMENT ON TABLE public.sandbox_approvals IS 'Approval workflow simulation stages';
COMMENT ON TABLE public.exports_log IS 'Export actions audit trail';
COMMENT ON TABLE public.governance_events IS 'Observability events for operational proof meta-loop';

COMMENT ON VIEW public.v_user_context IS 'User role detection (enterprise vs agency)';
COMMENT ON VIEW public.sandbox_runs_masked IS 'Agency-safe view with redacted internal data';

COMMENT ON COLUMN public.sandbox_runs.proof_hash IS 'SHA-256 hash for proof pack immutability';
COMMENT ON COLUMN public.sandbox_runs.inputs_json IS 'Scenario configuration (tools, regions, data types)';
COMMENT ON COLUMN public.sandbox_runs.outputs_json IS 'Simulation results (risks, controls, recommendations)';
COMMENT ON COLUMN public.sandbox_controls.fix_suggestion IS 'AI-generated remediation guidance';
COMMENT ON COLUMN public.sandbox_approvals.estimated_sla_hours IS 'Predicted approval time based on historical data';