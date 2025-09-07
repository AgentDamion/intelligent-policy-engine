-- ================================
-- ADD COMPLIANCE ALERTS SYSTEM
-- ================================
-- This migration adds tables and functions for the compliance checking system

-- Create alerts table for compliance violations and system alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('compliance_violation', 'policy_breach', 'risk_escalation', 'system_alert')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    acknowledged_by UUID,
    resolved_by UUID
);

-- Create compliance reports table for storing compliance check results
CREATE TABLE IF NOT EXISTS public.compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID,
    enterprise_id UUID NOT NULL,
    workspace_id UUID,
    overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('green', 'yellow', 'red')),
    compliance_score INTEGER NOT NULL CHECK (compliance_score >= 0 AND compliance_score <= 100),
    tools_summary JSONB NOT NULL,
    policy_violations JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    risk_assessment JSONB NOT NULL,
    compliance_frameworks TEXT[] DEFAULT '{}',
    generated_by UUID,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_organization_id ON public.alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON public.alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON public.alerts(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_enterprise_id ON public.compliance_reports(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_project_id ON public.compliance_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_generated_at ON public.compliance_reports(generated_at);

-- Add foreign key constraints
ALTER TABLE public.alerts 
ADD CONSTRAINT fk_alerts_organization_id 
FOREIGN KEY (organization_id) REFERENCES public.organizations_enhanced(id) ON DELETE CASCADE;

ALTER TABLE public.alerts 
ADD CONSTRAINT fk_alerts_acknowledged_by 
FOREIGN KEY (acknowledged_by) REFERENCES public.users_enhanced(id) ON DELETE SET NULL;

ALTER TABLE public.alerts 
ADD CONSTRAINT fk_alerts_resolved_by 
FOREIGN KEY (resolved_by) REFERENCES public.users_enhanced(id) ON DELETE SET NULL;

-- Add foreign key constraints for compliance_reports
DO $$
BEGIN
    -- Check if projects table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
        ALTER TABLE public.compliance_reports 
        ADD CONSTRAINT fk_compliance_reports_project_id 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
    END IF;
    
    -- Check if workspaces table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces' AND table_schema = 'public') THEN
        ALTER TABLE public.compliance_reports 
        ADD CONSTRAINT fk_compliance_reports_workspace_id 
        FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;
    END IF;
    
    -- Check if organizations_enhanced table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations_enhanced' AND table_schema = 'public') THEN
        ALTER TABLE public.compliance_reports 
        ADD CONSTRAINT fk_compliance_reports_enterprise_id 
        FOREIGN KEY (enterprise_id) REFERENCES public.organizations_enhanced(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create RLS policies for alerts table
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts for their organization" ON public.alerts
    FOR SELECT TO authenticated USING (
        organization_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update alerts for their organization" ON public.alerts
    FOR UPDATE TO authenticated USING (
        organization_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for compliance_reports table
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view compliance reports for their organization" ON public.compliance_reports
    FOR SELECT TO authenticated USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        )
    );

-- Create function to automatically trigger compliance checks
CREATE OR REPLACE FUNCTION public.trigger_compliance_check()
RETURNS TRIGGER AS $$
DECLARE
    compliance_check_url TEXT;
    request_body JSONB;
    response_status INTEGER;
    response_body TEXT;
BEGIN
    -- Get the compliance check function URL
    compliance_check_url := current_setting('app.compliance_check_url', true);
    
    -- If no URL is configured, skip the check
    IF compliance_check_url IS NULL OR compliance_check_url = '' THEN
        RETURN NEW;
    END IF;
    
    -- Prepare the request body
    request_body := jsonb_build_object(
        'activity_id', NEW.id,
        'trigger_type', 'insert',
        'force_check', false
    );
    
    -- Make HTTP request to compliance check function
    BEGIN
        SELECT status, content INTO response_status, response_body
        FROM http((
            'POST',
            compliance_check_url,
            ARRAY[http_header('Content-Type', 'application/json')],
            'application/json',
            request_body::text
        ));
        
        -- Log the response for debugging
        INSERT INTO public.audit_logs_enhanced (
            organization_id,
            action,
            entity_type,
            entity_id,
            details,
            risk_level
        ) VALUES (
            COALESCE(NEW.enterprise_id, '00000000-0000-0000-0000-000000000000'::uuid),
            'compliance_check_triggered',
            'agent_activity',
            NEW.id,
            jsonb_build_object(
                'response_status', response_status,
                'response_body', response_body,
                'activity_agent', NEW.agent,
                'activity_action', NEW.action
            ),
            'low'
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the insert
        INSERT INTO public.audit_logs_enhanced (
            organization_id,
            action,
            entity_type,
            entity_id,
            details,
            risk_level
        ) VALUES (
            COALESCE(NEW.enterprise_id, '00000000-0000-0000-0000-000000000000'::uuid),
            'compliance_check_error',
            'agent_activity',
            NEW.id,
            jsonb_build_object(
                'error', SQLERRM,
                'activity_agent', NEW.agent,
                'activity_action', NEW.action
            ),
            'medium'
        );
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically run compliance checks on new agent activities
DROP TRIGGER IF EXISTS compliance_check_trigger ON public.agent_activities;
CREATE TRIGGER compliance_check_trigger
    AFTER INSERT ON public.agent_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_compliance_check();

-- Create function to get compliance summary for an organization
CREATE OR REPLACE FUNCTION public.get_compliance_summary(org_id UUID)
RETURNS JSONB AS $$
DECLARE
    summary JSONB;
    total_activities INTEGER;
    violations_count INTEGER;
    alerts_count INTEGER;
    avg_compliance_score NUMERIC;
BEGIN
    -- Get total activities in the last 30 days
    SELECT COUNT(*) INTO total_activities
    FROM public.agent_activities
    WHERE enterprise_id = org_id
    AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Get violations count
    SELECT COUNT(*) INTO violations_count
    FROM public.compliance_violations
    WHERE organization_id = org_id
    AND status IN ('open', 'investigating');
    
    -- Get active alerts count
    SELECT COUNT(*) INTO alerts_count
    FROM public.alerts
    WHERE organization_id = org_id
    AND status = 'active';
    
    -- Get average compliance score from recent checks
    SELECT COALESCE(AVG(score), 100) INTO avg_compliance_score
    FROM public.compliance_checks
    WHERE organization_id = org_id
    AND check_date >= NOW() - INTERVAL '30 days';
    
    -- Build summary
    summary := jsonb_build_object(
        'total_activities_30d', total_activities,
        'active_violations', violations_count,
        'active_alerts', alerts_count,
        'avg_compliance_score', ROUND(avg_compliance_score, 2),
        'compliance_status', CASE 
            WHEN avg_compliance_score >= 90 THEN 'excellent'
            WHEN avg_compliance_score >= 80 THEN 'good'
            WHEN avg_compliance_score >= 70 THEN 'fair'
            WHEN avg_compliance_score >= 60 THEN 'poor'
            ELSE 'critical'
        END,
        'last_updated', NOW()
    );
    
    RETURN summary;
END;
$$ LANGUAGE plpgsql;

-- Create function to acknowledge alerts
CREATE OR REPLACE FUNCTION public.acknowledge_alert(alert_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    alert_exists BOOLEAN;
BEGIN
    -- Check if alert exists and belongs to user's organization
    SELECT EXISTS(
        SELECT 1 FROM public.alerts a
        JOIN public.enterprise_members em ON a.organization_id = em.enterprise_id
        WHERE a.id = alert_id AND em.user_id = acknowledge_alert.user_id
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update alert
    UPDATE public.alerts
    SET status = 'acknowledged',
        acknowledged_at = NOW(),
        acknowledged_by = acknowledge_alert.user_id
    WHERE id = alert_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to resolve alerts
CREATE OR REPLACE FUNCTION public.resolve_alert(alert_id UUID, user_id UUID, resolution_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    alert_exists BOOLEAN;
BEGIN
    -- Check if alert exists and belongs to user's organization
    SELECT EXISTS(
        SELECT 1 FROM public.alerts a
        JOIN public.enterprise_members em ON a.organization_id = em.enterprise_id
        WHERE a.id = alert_id AND em.user_id = resolve_alert.user_id
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update alert
    UPDATE public.alerts
    SET status = 'resolved',
        resolved_at = NOW(),
        resolved_by = resolve_alert.user_id,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('resolution_notes', resolution_notes)
    WHERE id = alert_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for compliance_reports
CREATE TRIGGER update_compliance_reports_updated_at 
    BEFORE UPDATE ON public.compliance_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO public.alerts (
    organization_id,
    alert_type,
    severity,
    title,
    description,
    entity_type,
    entity_id,
    metadata
) VALUES (
    (SELECT id FROM public.organizations_enhanced LIMIT 1),
    'system_alert',
    'info',
    'Compliance System Initialized',
    'The automated compliance checking system has been successfully initialized and is now monitoring agent activities.',
    'system',
    '00000000-0000-0000-0000-000000000000'::uuid,
    '{"system_init": true, "version": "1.0"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE public.alerts IS 'System alerts and compliance violation notifications';
COMMENT ON TABLE public.compliance_reports IS 'Compliance check reports and summaries';
COMMENT ON FUNCTION public.trigger_compliance_check() IS 'Automatically triggers compliance checks when new agent activities are inserted';
COMMENT ON FUNCTION public.get_compliance_summary(UUID) IS 'Returns compliance summary statistics for an organization';
COMMENT ON FUNCTION public.acknowledge_alert(UUID, UUID) IS 'Acknowledges an alert for a user';
COMMENT ON FUNCTION public.resolve_alert(UUID, UUID, TEXT) IS 'Resolves an alert with optional resolution notes';
