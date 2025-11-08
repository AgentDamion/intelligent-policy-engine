-- ================================
-- POLICY SANDBOX SYSTEM TABLES
-- ================================
-- Migration: 20251010123054
-- Description: Create complete sandbox infrastructure for policy testing with AI agent integration

-- ============================================
-- SANDBOX RUNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sandbox_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL,
    workspace_id UUID,
    policy_id UUID NOT NULL,
    scenario_name VARCHAR(255) NOT NULL,
    scenario_config JSONB NOT NULL DEFAULT '{}', -- Test scenario details
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    
    -- AI Agent Metadata
    agent_metadata JSONB DEFAULT '{}'::jsonb,
    agent_confidence NUMERIC(3,2) DEFAULT 0.0,
    agent_reasoning TEXT,
    
    -- Simulation Results
    validation_status BOOLEAN DEFAULT false,
    compliance_score NUMERIC(3,2) DEFAULT 0.0,
    risk_flags JSONB DEFAULT '[]'::jsonb,
    outputs JSONB DEFAULT '{}'::jsonb,
    ai_insights JSONB DEFAULT '{}'::jsonb, -- Multi-agent insights
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT sandbox_runs_compliance_score_range CHECK (compliance_score >= 0 AND compliance_score <= 1),
    CONSTRAINT sandbox_runs_agent_confidence_range CHECK (agent_confidence >= 0 AND agent_confidence <= 1)
);

-- ============================================
-- SANDBOX CONTROLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sandbox_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sandbox_run_id UUID NOT NULL REFERENCES public.sandbox_runs(id) ON DELETE CASCADE,
    control_type VARCHAR(100) NOT NULL, -- e.g., 'data_classification', 'vendor_vetting', 'risk_mitigation'
    control_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pass', 'fail', 'conditional', 'skipped', 'not_applicable')),
    ai_recommendation TEXT, -- AI agent suggestion for control improvement
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SANDBOX APPROVALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sandbox_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sandbox_run_id UUID NOT NULL REFERENCES public.sandbox_runs(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL,
    approver_role VARCHAR(100), -- e.g., 'manager', 'compliance_officer', 'security_lead'
    approval_stage VARCHAR(100) NOT NULL, -- e.g., 'initial_review', 'compliance_review', 'final_approval'
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
    ai_validation JSONB DEFAULT '{}', -- AI pre-approval validation results
    ai_recommendation VARCHAR(50), -- 'approve', 'reject', 'escalate', 'needs_review'
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    decided_at TIMESTAMPTZ
);

-- ============================================
-- EXPORTS LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.exports_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sandbox_run_id UUID NOT NULL REFERENCES public.sandbox_runs(id) ON DELETE CASCADE,
    export_type VARCHAR(50) CHECK (export_type IN ('pdf', 'json', 'csv', 'excel', 'markdown')),
    file_path TEXT,
    file_size_bytes BIGINT,
    ai_summary TEXT, -- AI-generated executive summary
    ai_insights JSONB DEFAULT '{}', -- Structured AI insights
    generated_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GOVERNANCE EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.governance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- e.g., 'simulation_completed', 'policy_flagged', 'approval_required'
    event_source VARCHAR(50) NOT NULL, -- e.g., 'sandbox', 'policy_engine', 'audit_engine'
    event_severity VARCHAR(20) DEFAULT 'info' CHECK (event_severity IN ('info', 'warning', 'error', 'critical')),
    related_id UUID, -- sandbox_run_id or policy_id or other entity
    related_type VARCHAR(50), -- 'sandbox_run', 'policy', 'approval', etc.
    metadata JSONB DEFAULT '{}',
    user_id UUID, -- User who triggered the event (if applicable)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Sandbox Runs Indexes
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_enterprise ON public.sandbox_runs(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_workspace ON public.sandbox_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_policy ON public.sandbox_runs(policy_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_status ON public.sandbox_runs(status);
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_created ON public.sandbox_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_completed ON public.sandbox_runs(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_compliance ON public.sandbox_runs(compliance_score DESC) WHERE compliance_score IS NOT NULL;

-- Sandbox Controls Indexes
CREATE INDEX IF NOT EXISTS idx_sandbox_controls_run ON public.sandbox_controls(sandbox_run_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_controls_type ON public.sandbox_controls(control_type);
CREATE INDEX IF NOT EXISTS idx_sandbox_controls_status ON public.sandbox_controls(status);
CREATE INDEX IF NOT EXISTS idx_sandbox_controls_severity ON public.sandbox_controls(severity);

-- Sandbox Approvals Indexes
CREATE INDEX IF NOT EXISTS idx_sandbox_approvals_run ON public.sandbox_approvals(sandbox_run_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_approvals_approver ON public.sandbox_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_approvals_status ON public.sandbox_approvals(status);
CREATE INDEX IF NOT EXISTS idx_sandbox_approvals_stage ON public.sandbox_approvals(approval_stage);

-- Exports Log Indexes
CREATE INDEX IF NOT EXISTS idx_exports_log_run ON public.exports_log(sandbox_run_id);
CREATE INDEX IF NOT EXISTS idx_exports_log_user ON public.exports_log(generated_by);
CREATE INDEX IF NOT EXISTS idx_exports_log_created ON public.exports_log(created_at DESC);

-- Governance Events Indexes
CREATE INDEX IF NOT EXISTS idx_governance_events_enterprise ON public.governance_events(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_governance_events_type ON public.governance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_governance_events_source ON public.governance_events(event_source);
CREATE INDEX IF NOT EXISTS idx_governance_events_severity ON public.governance_events(event_severity);
CREATE INDEX IF NOT EXISTS idx_governance_events_related ON public.governance_events(related_id) WHERE related_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_governance_events_created ON public.governance_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_governance_events_user ON public.governance_events(user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.sandbox_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Sandbox Runs Policies
CREATE POLICY "Users can view sandbox runs in their enterprise" ON public.sandbox_runs
    FOR SELECT TO authenticated USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create sandbox runs in their enterprise" ON public.sandbox_runs
    FOR INSERT TO authenticated WITH CHECK (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sandbox runs in their enterprise" ON public.sandbox_runs
    FOR UPDATE TO authenticated USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to sandbox_runs" ON public.sandbox_runs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Sandbox Controls Policies
CREATE POLICY "Users can view sandbox controls for their runs" ON public.sandbox_controls
    FOR SELECT TO authenticated USING (
        sandbox_run_id IN (
            SELECT id FROM public.sandbox_runs 
            WHERE enterprise_id IN (
                SELECT enterprise_id FROM public.enterprise_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Service role has full access to sandbox_controls" ON public.sandbox_controls
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Sandbox Approvals Policies
CREATE POLICY "Users can view approvals for their runs" ON public.sandbox_approvals
    FOR SELECT TO authenticated USING (
        sandbox_run_id IN (
            SELECT id FROM public.sandbox_runs 
            WHERE enterprise_id IN (
                SELECT enterprise_id FROM public.enterprise_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Approvers can update their own approvals" ON public.sandbox_approvals
    FOR UPDATE TO authenticated USING (
        approver_id = auth.uid()
    );

CREATE POLICY "Service role has full access to sandbox_approvals" ON public.sandbox_approvals
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Exports Log Policies
CREATE POLICY "Users can view exports for their runs" ON public.exports_log
    FOR SELECT TO authenticated USING (
        sandbox_run_id IN (
            SELECT id FROM public.sandbox_runs 
            WHERE enterprise_id IN (
                SELECT enterprise_id FROM public.enterprise_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create exports" ON public.exports_log
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service role has full access to exports_log" ON public.exports_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Governance Events Policies
CREATE POLICY "Users can view governance events in their enterprise" ON public.governance_events
    FOR SELECT TO authenticated USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can insert governance events" ON public.governance_events
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role has full access to governance_events" ON public.governance_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_sandbox_runs_updated_at
    BEFORE UPDATE ON public.sandbox_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sandbox_controls_updated_at
    BEFORE UPDATE ON public.sandbox_controls
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.sandbox_runs IS 'Policy simulation runs with AI agent orchestration';
COMMENT ON TABLE public.sandbox_controls IS 'Individual control checks within sandbox simulations';
COMMENT ON TABLE public.sandbox_approvals IS 'Approval workflow stages for sandbox runs';
COMMENT ON TABLE public.exports_log IS 'Audit trail of exported simulation results';
COMMENT ON TABLE public.governance_events IS 'Real-time governance event stream for inbox/monitoring';

COMMENT ON COLUMN public.sandbox_runs.agent_metadata IS 'Metadata from all agents involved in simulation';
COMMENT ON COLUMN public.sandbox_runs.agent_confidence IS 'Overall AI confidence score (0-1)';
COMMENT ON COLUMN public.sandbox_runs.agent_reasoning IS 'Primary AI reasoning explanation';
COMMENT ON COLUMN public.sandbox_runs.ai_insights IS 'Structured insights from PolicyAgent, SandboxAgent, ComplianceAgent, MonitoringAgent';

