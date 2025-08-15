-- Migration: Add Human Override System to Audit Entries
-- Description: Extends audit_entries table with human override capabilities
-- Author: AIComplyr Team
-- Date: 2024

-- Add human override columns to audit_entries table
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_reason VARCHAR(100);
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_justification TEXT;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_status VARCHAR(20) DEFAULT NULL;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_requested_by UUID REFERENCES users(id);
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_reviewed_by UUID REFERENCES users(id);
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_review_notes TEXT;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_requested_at TIMESTAMP;
ALTER TABLE audit_entries ADD COLUMN IF NOT EXISTS override_resolved_at TIMESTAMP;

-- Create override_reasons lookup table for standardized reasons
CREATE TABLE IF NOT EXISTS override_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reason_code VARCHAR(50) UNIQUE NOT NULL,
    reason_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    requires_justification BOOLEAN DEFAULT TRUE,
    requires_review BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert common override reasons
INSERT INTO override_reasons (reason_code, reason_name, description, category, requires_justification, requires_review) VALUES
('AI_CONFIDENCE_LOW', 'Low AI Confidence', 'AI confidence score below acceptable threshold', 'QUALITY', TRUE, TRUE),
('POLICY_AMBIGUITY', 'Policy Ambiguity', 'Unclear or conflicting policy requirements', 'POLICY', TRUE, TRUE),
('BUSINESS_CONTEXT', 'Business Context Missing', 'AI lacks necessary business context for decision', 'CONTEXT', TRUE, TRUE),
('REGULATORY_COMPLEXITY', 'Regulatory Complexity', 'Complex regulatory requirements requiring human expertise', 'COMPLIANCE', TRUE, TRUE),
('EDGE_CASE', 'Edge Case Scenario', 'Unusual scenario not covered by standard policies', 'EXCEPTION', TRUE, TRUE),
('TECHNICAL_ISSUE', 'Technical Issue', 'System or data quality issues affecting AI decision', 'TECHNICAL', TRUE, TRUE),
('URGENT_APPROVAL', 'Urgent Approval Required', 'Time-sensitive decision requiring immediate human review', 'URGENCY', TRUE, TRUE),
('STAKEHOLDER_REQUEST', 'Stakeholder Request', 'Specific request from business stakeholder', 'BUSINESS', TRUE, TRUE),
('RISK_ASSESSMENT', 'Risk Assessment Required', 'High-risk decision requiring human risk evaluation', 'RISK', TRUE, TRUE),
('COMPLIANCE_REVIEW', 'Compliance Review', 'Decision requires legal or compliance team review', 'COMPLIANCE', TRUE, TRUE);

-- Create override_workflows table for tracking override processes
CREATE TABLE IF NOT EXISTS override_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES audit_entries(entry_id),
    workflow_type VARCHAR(50) NOT NULL,
    current_step VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    assigned_reviewer UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'normal',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create override_audit_log table for tracking all override activities
CREATE TABLE IF NOT EXISTS override_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES audit_entries(entry_id),
    action_type VARCHAR(50) NOT NULL,
    action_by UUID NOT NULL REFERENCES users(id),
    action_details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_entries_override_requested ON audit_entries(override_requested);
CREATE INDEX IF NOT EXISTS idx_audit_entries_override_status ON audit_entries(override_status);
CREATE INDEX IF NOT EXISTS idx_audit_entries_override_requested_by ON audit_entries(override_requested_by);
CREATE INDEX IF NOT EXISTS idx_override_workflows_entry_id ON override_workflows(entry_id);
CREATE INDEX IF NOT EXISTS idx_override_workflows_status ON override_workflows(status);
CREATE INDEX IF NOT EXISTS idx_override_audit_log_entry_id ON override_audit_log(entry_id);
CREATE INDEX IF NOT EXISTS idx_override_audit_log_timestamp ON override_audit_log(timestamp);

-- Create view for override dashboard
CREATE OR REPLACE VIEW override_dashboard AS
SELECT 
    ae.entry_id,
    ae.agent,
    ae.decision_type,
    ae.status as original_status,
    ae.override_requested,
    ae.override_reason,
    ae.override_status,
    ae.override_requested_at,
    ae.override_resolved_at,
    u1.email as requested_by_email,
    u2.email as reviewed_by_email,
    ae.override_justification,
    ae.override_review_notes,
    EXTRACT(EPOCH FROM (ae.override_resolved_at - ae.override_requested_at))/3600 as resolution_hours
FROM audit_entries ae
LEFT JOIN users u1 ON ae.override_requested_by = u1.id
LEFT JOIN users u2 ON ae.override_reviewed_by = u2.id
WHERE ae.override_requested = TRUE;

-- Create function to log override activities
CREATE OR REPLACE FUNCTION log_override_activity(
    p_entry_id UUID,
    p_action_type VARCHAR(50),
    p_action_by UUID,
    p_action_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO override_audit_log (entry_id, action_type, action_by, action_details)
    VALUES (p_entry_id, p_action_type, p_action_by, p_action_details);
END;
$$ LANGUAGE plpgsql;

-- Create function to update override status
CREATE OR REPLACE FUNCTION update_override_status(
    p_entry_id UUID,
    p_new_status VARCHAR(20),
    p_reviewed_by UUID DEFAULT NULL,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE audit_entries 
    SET 
        override_status = p_new_status,
        override_reviewed_by = COALESCE(p_reviewed_by, override_reviewed_by),
        override_review_notes = COALESCE(p_review_notes, override_review_notes),
        override_resolved_at = CASE 
            WHEN p_new_status IN ('approved', 'rejected', 'cancelled') THEN NOW()
            ELSE override_resolved_at
        END
    WHERE entry_id = p_entry_id;
    
    -- Log the status change
    PERFORM log_override_activity(
        p_entry_id, 
        'status_change', 
        p_reviewed_by, 
        jsonb_build_object('old_status', (SELECT override_status FROM audit_entries WHERE entry_id = p_entry_id), 'new_status', p_new_status)
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON override_dashboard TO PUBLIC;
GRANT EXECUTE ON FUNCTION log_override_activity TO PUBLIC;
GRANT EXECUTE ON FUNCTION update_override_status TO PUBLIC; 