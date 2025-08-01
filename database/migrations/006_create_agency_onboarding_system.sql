-- Migration: Create Agency Onboarding System
-- Description: Implements agency invitation and relationship management for aicomplyr.io
-- Author: AIComplyr Team
-- Date: 2024

-- Agency invitations table
CREATE TABLE IF NOT EXISTS agency_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_org_id UUID REFERENCES organizations(id),
  agency_email VARCHAR(255) NOT NULL,
  agency_name VARCHAR(255),
  invitation_token UUID DEFAULT gen_random_uuid(),
  status VARCHAR(20) DEFAULT 'pending',
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agency-Enterprise relationships
CREATE TABLE IF NOT EXISTS agency_enterprise_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_org_id UUID REFERENCES organizations(id),
  enterprise_org_id UUID REFERENCES organizations(id),
  relationship_status VARCHAR(20) DEFAULT 'active',
  compliance_score INTEGER DEFAULT 0,
  last_audit_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_org_id, enterprise_org_id)
);

-- Agency AI Tools submissions
CREATE TABLE IF NOT EXISTS agency_ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_org_id UUID REFERENCES organizations(id),
  enterprise_org_id UUID REFERENCES organizations(id),
  tool_name VARCHAR(255) NOT NULL,
  tool_description TEXT,
  tool_type VARCHAR(100) NOT NULL, -- 'content_creation', 'social_media', 'analytics', etc.
  tool_url VARCHAR(500),
  compliance_documentation JSONB,
  submission_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'under_review'
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agency compliance requirements
CREATE TABLE IF NOT EXISTS agency_compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_org_id UUID REFERENCES organizations(id),
  requirement_name VARCHAR(255) NOT NULL,
  requirement_description TEXT,
  requirement_type VARCHAR(100) NOT NULL, -- 'fda_compliance', 'data_privacy', 'content_guidelines', etc.
  is_required BOOLEAN DEFAULT true,
  validation_rules JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agency compliance submissions
CREATE TABLE IF NOT EXISTS agency_compliance_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_org_id UUID REFERENCES organizations(id),
  enterprise_org_id UUID REFERENCES organizations(id),
  requirement_id UUID REFERENCES agency_compliance_requirements(id),
  submission_data JSONB,
  submission_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Agency onboarding workflow steps
CREATE TABLE IF NOT EXISTS agency_onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_name VARCHAR(255) NOT NULL,
  step_description TEXT,
  step_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  step_type VARCHAR(100) NOT NULL, -- 'invitation', 'profile_setup', 'compliance', 'tool_submission', 'approval'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agency onboarding progress tracking
CREATE TABLE IF NOT EXISTS agency_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_org_id UUID REFERENCES organizations(id),
  enterprise_org_id UUID REFERENCES organizations(id),
  step_id UUID REFERENCES agency_onboarding_steps(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agency audit logs
CREATE TABLE IF NOT EXISTS agency_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_org_id UUID REFERENCES organizations(id),
  enterprise_org_id UUID REFERENCES organizations(id),
  action_type VARCHAR(100) NOT NULL,
  action_by UUID REFERENCES users(id),
  action_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default onboarding steps
INSERT INTO agency_onboarding_steps (step_name, step_description, step_order, step_type) VALUES
('Invitation Sent', 'Agency invitation sent by enterprise', 1, 'invitation'),
('Agency Registration', 'Agency completes registration and profile setup', 2, 'profile_setup'),
('Compliance Review', 'Agency submits compliance documentation', 3, 'compliance'),
('AI Tool Submission', 'Agency submits AI tools for approval', 4, 'tool_submission'),
('Enterprise Approval', 'Enterprise reviews and approves agency', 5, 'approval'),
('Onboarding Complete', 'Agency fully onboarded and active', 6, 'completion');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agency_invitations_token ON agency_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_agency_invitations_status ON agency_invitations(status);
CREATE INDEX IF NOT EXISTS idx_agency_invitations_email ON agency_invitations(agency_email);
CREATE INDEX IF NOT EXISTS idx_agency_enterprise_relationships_status ON agency_enterprise_relationships(relationship_status);
CREATE INDEX IF NOT EXISTS idx_agency_ai_tools_status ON agency_ai_tools(submission_status);
CREATE INDEX IF NOT EXISTS idx_agency_compliance_submissions_status ON agency_compliance_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_agency_onboarding_progress_status ON agency_onboarding_progress(status);

-- Create views for dashboard
CREATE OR REPLACE VIEW agency_onboarding_dashboard AS
SELECT 
  ai.id as invitation_id,
  ai.agency_email,
  ai.agency_name,
  ai.status as invitation_status,
  ai.created_at as invited_at,
  ai.expires_at,
  aer.relationship_status,
  aer.compliance_score,
  aer.last_audit_date,
  COUNT(DISTINCT aat.id) as tools_submitted,
  COUNT(DISTINCT CASE WHEN aat.submission_status = 'approved' THEN aat.id END) as tools_approved,
  COUNT(DISTINCT acs.id) as compliance_submissions,
  COUNT(DISTINCT CASE WHEN acs.submission_status = 'approved' THEN acs.id END) as compliance_approved,
  COUNT(DISTINCT aop.id) as completed_steps,
  (SELECT COUNT(*) FROM agency_onboarding_steps) as total_steps
FROM agency_invitations ai
LEFT JOIN agency_enterprise_relationships aer ON ai.enterprise_org_id = aer.enterprise_org_id AND ai.agency_email = (
  SELECT email FROM users WHERE organization_id = aer.agency_org_id LIMIT 1
)
LEFT JOIN agency_ai_tools aat ON aer.agency_org_id = aat.agency_org_id AND aer.enterprise_org_id = aat.enterprise_org_id
LEFT JOIN agency_compliance_submissions acs ON aer.agency_org_id = acs.agency_org_id AND aer.enterprise_org_id = acs.enterprise_org_id
LEFT JOIN agency_onboarding_progress aop ON aer.agency_org_id = aop.agency_org_id AND aer.enterprise_org_id = aop.enterprise_org_id AND aop.status = 'completed'
GROUP BY ai.id, ai.agency_email, ai.agency_name, ai.status, ai.created_at, ai.expires_at, aer.relationship_status, aer.compliance_score, aer.last_audit_date;

-- Create function to log agency actions
CREATE OR REPLACE FUNCTION log_agency_action(
  p_agency_org_id UUID,
  p_enterprise_org_id UUID,
  p_action_type VARCHAR(100),
  p_action_by UUID,
  p_action_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO agency_audit_log (
    agency_org_id, 
    enterprise_org_id, 
    action_type, 
    action_by, 
    action_details, 
    ip_address, 
    user_agent
  )
  VALUES (
    p_agency_org_id,
    p_enterprise_org_id,
    p_action_type,
    p_action_by,
    p_action_details,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON agency_onboarding_dashboard TO PUBLIC;
GRANT EXECUTE ON FUNCTION log_agency_action TO PUBLIC; 