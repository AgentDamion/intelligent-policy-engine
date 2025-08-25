-- Migration: AI Tool Policy Governance System
-- This migration adds comprehensive AI tool governance capabilities
-- Integrates with existing organizations_enhanced and users_enhanced tables

-- =====================================================
-- AI TOOLS CATALOG
-- =====================================================

-- Master catalog of AI tools
CREATE TABLE IF NOT EXISTS ai_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT CHECK (category IN ('generation', 'analysis', 'automation', 'communication', 'research', 'other')),
    vendor TEXT,
    official BOOLEAN DEFAULT TRUE,
    description TEXT,
    capabilities JSONB DEFAULT '{}', -- Detailed capabilities and features
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    regulatory_flags JSONB DEFAULT '{}', -- FDA, HIPAA, etc. compliance flags
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TOOL-SPECIFIC POLICIES
-- =====================================================

-- Organization-specific policies for AI tools
CREATE TABLE IF NOT EXISTS tool_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('allowed', 'blocked', 'requires_review', 'conditional')) NOT NULL,
    
    -- Content type restrictions
    content_types JSONB DEFAULT '[]', -- Array of allowed content types
    prohibited_content_types JSONB DEFAULT '[]', -- Explicitly prohibited types
    
    -- Compliance requirements
    mlr_required BOOLEAN DEFAULT FALSE,
    mlr_criteria JSONB DEFAULT '{}', -- Specific MLR trigger conditions
    approval_workflow JSONB DEFAULT '{}', -- Custom approval workflow
    
    -- Risk management
    risk_assessment JSONB DEFAULT '{}',
    mitigation_measures TEXT[],
    
    -- Versioning
    policy_version TEXT DEFAULT 'v1.0',
    effective_date TIMESTAMP DEFAULT NOW(),
    expiration_date TIMESTAMP,
    
    -- Metadata
    created_by UUID REFERENCES users_enhanced(id),
    updated_by UUID REFERENCES users_enhanced(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one policy per tool per org
    UNIQUE(organization_id, tool_id)
);

-- =====================================================
-- TOOL USAGE TRACKING
-- =====================================================

-- Detailed logging of AI tool usage
CREATE TABLE IF NOT EXISTS tool_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_enhanced(id) ON DELETE SET NULL,
    tool_id UUID REFERENCES ai_tools(id),
    
    -- Usage details
    action TEXT NOT NULL, -- 'generate', 'analyze', 'review', etc.
    content_type TEXT,
    content_classification JSONB DEFAULT '{}', -- Detailed content classification
    
    -- Policy evaluation
    policy_id UUID REFERENCES tool_policies(id),
    passed_policy_check BOOLEAN NOT NULL,
    policy_violations JSONB DEFAULT '[]', -- Array of specific violations
    status TEXT CHECK (status IN ('approved', 'blocked', 'escalated', 'pending_review', 'mlr_required')),
    
    -- Content tracking
    content_hash TEXT, -- For duplicate detection
    content_metadata JSONB DEFAULT '{}', -- Size, format, etc.
    
    -- MLR tracking
    mlr_status TEXT CHECK (mlr_status IN ('not_required', 'pending', 'in_review', 'approved', 'rejected')),
    mlr_reviewer_id UUID REFERENCES users_enhanced(id),
    mlr_review_date TIMESTAMP,
    mlr_comments TEXT,
    
    -- Performance metrics
    processing_time_ms INTEGER,
    
    -- Audit trail
    timestamp TIMESTAMP DEFAULT NOW(),
    session_id UUID,
    ip_address INET,
    user_agent TEXT
);

-- =====================================================
-- AI GOVERNANCE AUDIT EVENTS
-- =====================================================

-- Specialized audit events for AI governance
CREATE TABLE IF NOT EXISTS ai_governance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN (
        'policy_created', 'policy_updated', 'policy_violation',
        'tool_blocked', 'tool_allowed', 'mlr_requested', 'mlr_completed',
        'risk_assessment', 'compliance_check', 'override_applied'
    )) NOT NULL,
    
    -- Event context
    user_id UUID REFERENCES users_enhanced(id),
    tool_id UUID REFERENCES ai_tools(id),
    policy_id UUID REFERENCES tool_policies(id),
    usage_log_id UUID REFERENCES tool_usage_logs(id),
    
    -- Event details
    severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
    status TEXT,
    reason TEXT,
    details JSONB DEFAULT '{}',
    
    -- MLR specific
    mlr_reviewer_id UUID REFERENCES users_enhanced(id),
    mlr_decision TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- =====================================================
-- TOOL ACCESS CONTROLS
-- =====================================================

-- Granular access controls for specific users/groups
CREATE TABLE IF NOT EXISTS tool_access_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    tool_id UUID REFERENCES ai_tools(id),
    
    -- Access scope
    user_id UUID REFERENCES users_enhanced(id), -- Specific user
    role TEXT, -- Or role-based access
    department TEXT, -- Or department-based
    
    -- Access level
    access_level TEXT CHECK (access_level IN ('full', 'limited', 'supervised', 'blocked')) NOT NULL,
    restrictions JSONB DEFAULT '{}', -- Specific restrictions
    
    -- Time-based controls
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    
    -- Usage limits
    daily_limit INTEGER,
    monthly_limit INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique access control per scope
    UNIQUE NULLS NOT DISTINCT (organization_id, tool_id, user_id, role, department)
);

-- =====================================================
-- MLR REVIEW QUEUE
-- =====================================================

-- Queue for content requiring Medical Legal Review
CREATE TABLE IF NOT EXISTS mlr_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    usage_log_id UUID REFERENCES tool_usage_logs(id) UNIQUE,
    
    -- Review details
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    requested_by UUID REFERENCES users_enhanced(id),
    requested_at TIMESTAMP DEFAULT NOW(),
    
    -- Assignment
    assigned_to UUID REFERENCES users_enhanced(id),
    assigned_at TIMESTAMP,
    
    -- Review status
    status TEXT CHECK (status IN ('pending', 'assigned', 'in_review', 'completed', 'escalated')) DEFAULT 'pending',
    decision TEXT CHECK (decision IN ('approved', 'rejected', 'modified')),
    
    -- Review details
    review_notes TEXT,
    modifications JSONB DEFAULT '{}',
    completed_at TIMESTAMP,
    
    -- SLA tracking
    due_date TIMESTAMP,
    sla_status TEXT CHECK (sla_status IN ('on_time', 'at_risk', 'overdue')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tool usage indexes
CREATE INDEX idx_tool_usage_org_timestamp ON tool_usage_logs(organization_id, timestamp DESC);
CREATE INDEX idx_tool_usage_user_timestamp ON tool_usage_logs(user_id, timestamp DESC);
CREATE INDEX idx_tool_usage_tool_timestamp ON tool_usage_logs(tool_id, timestamp DESC);
CREATE INDEX idx_tool_usage_status ON tool_usage_logs(status) WHERE status != 'approved';
CREATE INDEX idx_tool_usage_mlr_status ON tool_usage_logs(mlr_status) WHERE mlr_status IN ('pending', 'in_review');
CREATE INDEX idx_tool_usage_policy_check ON tool_usage_logs(passed_policy_check) WHERE passed_policy_check = false;

-- Policy indexes
CREATE INDEX idx_tool_policies_org_tool ON tool_policies(organization_id, tool_id);
CREATE INDEX idx_tool_policies_status ON tool_policies(status);
CREATE INDEX idx_tool_policies_effective ON tool_policies(effective_date, expiration_date);

-- Governance events indexes
CREATE INDEX idx_governance_events_org_time ON ai_governance_events(organization_id, created_at DESC);
CREATE INDEX idx_governance_events_type ON ai_governance_events(event_type);
CREATE INDEX idx_governance_events_severity ON ai_governance_events(severity) WHERE severity IN ('error', 'critical');

-- MLR queue indexes
CREATE INDEX idx_mlr_queue_status ON mlr_review_queue(status) WHERE status != 'completed';
CREATE INDEX idx_mlr_queue_assigned ON mlr_review_queue(assigned_to, status);
CREATE INDEX idx_mlr_queue_sla ON mlr_review_queue(sla_status) WHERE sla_status IN ('at_risk', 'overdue');

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_governance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_access_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE mlr_review_queue ENABLE ROW LEVEL SECURITY;

-- AI Tools: Everyone can view the catalog
CREATE POLICY "Anyone can view AI tools catalog" ON ai_tools
    FOR SELECT USING (true);

-- Tool Policies: Users can view their organization's policies
CREATE POLICY "Users can view organization tool policies" ON tool_policies
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage tool policies" ON tool_policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = tool_policies.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role IN ('admin', 'manager')
        )
    );

-- Tool Usage Logs: Users can view their own usage, admins can view all
CREATE POLICY "Users can view own tool usage" ON tool_usage_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = tool_usage_logs.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "System can insert usage logs" ON tool_usage_logs
    FOR INSERT WITH CHECK (true);

-- AI Governance Events: Similar to usage logs
CREATE POLICY "Users can view governance events" ON ai_governance_events
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = ai_governance_events.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "System can insert governance events" ON ai_governance_events
    FOR INSERT WITH CHECK (true);

-- Tool Access Controls: Admins only
CREATE POLICY "Admins can manage access controls" ON tool_access_controls
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = tool_access_controls.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role = 'admin'
        )
    );

-- MLR Review Queue: Reviewers and admins
CREATE POLICY "MLR reviewers can view queue" ON mlr_review_queue
    FOR SELECT USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = mlr_review_queue.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "MLR reviewers can update assigned items" ON mlr_review_queue
    FOR UPDATE USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = mlr_review_queue.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role = 'admin'
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to check tool policy compliance
CREATE OR REPLACE FUNCTION check_tool_policy_compliance(
    p_organization_id UUID,
    p_tool_id UUID,
    p_content_type TEXT,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_policy tool_policies%ROWTYPE;
    v_access tool_access_controls%ROWTYPE;
    v_result JSONB;
BEGIN
    -- Get the policy
    SELECT * INTO v_policy
    FROM tool_policies
    WHERE organization_id = p_organization_id
    AND tool_id = p_tool_id
    AND (expiration_date IS NULL OR expiration_date > NOW());
    
    -- If no policy exists, default to blocked
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'status', 'blocked',
            'reason', 'No policy defined for this tool'
        );
    END IF;
    
    -- Check basic policy status
    IF v_policy.status = 'blocked' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'status', 'blocked',
            'reason', 'Tool is blocked by organization policy'
        );
    END IF;
    
    -- Check user-specific access controls
    SELECT * INTO v_access
    FROM tool_access_controls
    WHERE organization_id = p_organization_id
    AND tool_id = p_tool_id
    AND (user_id = p_user_id OR user_id IS NULL)
    AND (valid_until IS NULL OR valid_until > NOW())
    ORDER BY user_id NULLS LAST
    LIMIT 1;
    
    IF FOUND AND v_access.access_level = 'blocked' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'status', 'blocked',
            'reason', 'User access blocked'
        );
    END IF;
    
    -- Check content type restrictions
    IF p_content_type IS NOT NULL THEN
        IF v_policy.prohibited_content_types ? p_content_type THEN
            RETURN jsonb_build_object(
                'allowed', false,
                'status', 'blocked',
                'reason', 'Content type is prohibited'
            );
        END IF;
        
        IF jsonb_array_length(v_policy.content_types) > 0 AND NOT (v_policy.content_types ? p_content_type) THEN
            RETURN jsonb_build_object(
                'allowed', false,
                'status', 'blocked',
                'reason', 'Content type not in allowed list'
            );
        END IF;
    END IF;
    
    -- Check if MLR is required
    IF v_policy.mlr_required THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'status', 'requires_review',
            'mlr_required', true,
            'reason', 'Medical Legal Review required'
        );
    END IF;
    
    -- Check conditional status
    IF v_policy.status = 'conditional' OR v_policy.status = 'requires_review' THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'status', v_policy.status,
            'reason', 'Conditional approval required'
        );
    END IF;
    
    -- Default to allowed
    RETURN jsonb_build_object(
        'allowed', true,
        'status', 'approved',
        'policy_version', v_policy.policy_version
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_tools_updated_at BEFORE UPDATE ON ai_tools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tool_policies_updated_at BEFORE UPDATE ON tool_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tool_access_controls_updated_at BEFORE UPDATE ON tool_access_controls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mlr_review_queue_updated_at BEFORE UPDATE ON mlr_review_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample AI tools
INSERT INTO ai_tools (name, category, vendor, description, risk_level) VALUES
    ('ChatGPT', 'generation', 'OpenAI', 'General-purpose language model', 'medium'),
    ('Claude', 'generation', 'Anthropic', 'AI assistant for analysis and writing', 'medium'),
    ('DALL-E', 'generation', 'OpenAI', 'Image generation from text', 'high'),
    ('GitHub Copilot', 'automation', 'GitHub/OpenAI', 'Code completion and generation', 'medium'),
    ('Grammarly', 'communication', 'Grammarly Inc', 'Writing assistance and grammar checking', 'low')
ON CONFLICT DO NOTHING;

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE ai_tools;
ALTER PUBLICATION supabase_realtime ADD TABLE tool_policies;
ALTER PUBLICATION supabase_realtime ADD TABLE tool_usage_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_governance_events;
ALTER PUBLICATION supabase_realtime ADD TABLE mlr_review_queue;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;