-- ================================
-- AI TOOL COMPLIANCE REPORTING SYSTEM
-- ================================
-- This migration adds tables for project-based AI tool compliance reporting

-- Project AI Tool Usage Summary (aggregated view)
CREATE TABLE IF NOT EXISTS public.project_ai_tool_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    enterprise_id UUID NOT NULL,
    workspace_id UUID,
    tool_name VARCHAR(500) NOT NULL,
    vendor_name VARCHAR(500),
    usage_count INTEGER DEFAULT 0,
    first_used TIMESTAMPTZ,
    last_used TIMESTAMPTZ,
    compliance_status VARCHAR(50) DEFAULT 'unknown' CHECK (compliance_status IN ('approved', 'needs_review', 'rejected', 'unknown')),
    risk_level VARCHAR(20) DEFAULT 'unknown' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    policy_violations TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, tool_name, vendor_name)
);

-- Compliance Reports (generated report cards)
CREATE TABLE IF NOT EXISTS public.compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    enterprise_id UUID NOT NULL,
    workspace_id UUID,
    report_type VARCHAR(50) DEFAULT 'compliance_summary',
    overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('green', 'yellow', 'red')),
    compliance_score INTEGER NOT NULL CHECK (compliance_score >= 0 AND compliance_score <= 100),
    tools_summary JSONB NOT NULL,
    policy_violations JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    risk_assessment JSONB NOT NULL,
    compliance_frameworks TEXT[],
    generated_by UUID,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Tool Compliance History (track changes over time)
CREATE TABLE IF NOT EXISTS public.tool_compliance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    tool_name VARCHAR(500) NOT NULL,
    vendor_name VARCHAR(500),
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    change_reason TEXT,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_ai_tool_usage_project ON public.project_ai_tool_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_project_ai_tool_usage_enterprise ON public.project_ai_tool_usage(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_project_ai_tool_usage_compliance ON public.project_ai_tool_usage(compliance_status);
CREATE INDEX IF NOT EXISTS idx_project_ai_tool_usage_risk ON public.project_ai_tool_usage(risk_level);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_project ON public.compliance_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_enterprise ON public.compliance_reports(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON public.compliance_reports(overall_status);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_generated_at ON public.compliance_reports(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_compliance_history_project ON public.tool_compliance_history(project_id);
CREATE INDEX IF NOT EXISTS idx_tool_compliance_history_tool ON public.tool_compliance_history(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_compliance_history_changed_at ON public.tool_compliance_history(changed_at DESC);

-- Enable RLS
ALTER TABLE public.project_ai_tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_compliance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view project tool usage in their context" ON public.project_ai_tool_usage
    FOR SELECT TO authenticated USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        ) OR
        workspace_id IN (
            SELECT id FROM public.workspaces w
            JOIN public.enterprise_members em ON w.enterprise_id = em.enterprise_id
            WHERE em.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage project tool usage" ON public.project_ai_tool_usage
    FOR ALL TO service_role WITH CHECK (true);

CREATE POLICY "Users can view compliance reports in their context" ON public.compliance_reports
    FOR SELECT TO authenticated USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        ) OR
        workspace_id IN (
            SELECT id FROM public.workspaces w
            JOIN public.enterprise_members em ON w.enterprise_id = em.enterprise_id
            WHERE em.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage compliance reports" ON public.compliance_reports
    FOR ALL TO service_role WITH CHECK (true);

CREATE POLICY "Users can view compliance history in their context" ON public.tool_compliance_history
    FOR SELECT TO authenticated USING (
        project_id IN (
            SELECT p.id FROM public.projects p
            JOIN public.enterprise_members em ON p.organization_id = em.enterprise_id
            WHERE em.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage compliance history" ON public.tool_compliance_history
    FOR ALL TO service_role WITH CHECK (true);

-- Function to update project AI tool usage summary
CREATE OR REPLACE FUNCTION public.update_project_ai_tool_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update project AI tool usage summary
    INSERT INTO public.project_ai_tool_usage (
        project_id, enterprise_id, workspace_id, tool_name, vendor_name,
        usage_count, first_used, last_used, compliance_status, risk_level
    )
    VALUES (
        NEW.client_id::UUID, -- Assuming client_id maps to project_id
        (SELECT organization_id FROM public.projects WHERE id = NEW.client_id::UUID),
        NULL, -- workspace_id if available
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
$$ LANGUAGE plpgsql;

-- Trigger to automatically update project AI tool usage
CREATE TRIGGER trigger_update_project_ai_tool_usage
    AFTER INSERT ON public.ai_tool_usage_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_ai_tool_usage();
