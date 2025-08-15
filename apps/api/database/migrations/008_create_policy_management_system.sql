-- Migration: Create Policy Management System
-- This migration adds comprehensive policy management capabilities
-- including organizations, users, policy templates, policies, rules, partners, and audit tracking

-- Organizations (Pharma Companies) - Enhanced version
CREATE TABLE IF NOT EXISTS organizations_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100) DEFAULT 'pharmaceutical',
  compliance_tier VARCHAR(50) DEFAULT 'enterprise', -- enterprise, standard, basic
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users with role-based access - Enhanced version
CREATE TABLE IF NOT EXISTS users_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- admin, compliance_officer, partner
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Policy Templates (Pre-built compliance frameworks)
CREATE TABLE IF NOT EXISTS policy_templates_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  industry VARCHAR(100), -- pharmaceutical, healthcare, financial
  regulation_framework VARCHAR(100), -- GDPR, HIPAA, FDA, AI_ACT
  template_rules JSONB NOT NULL, -- JSON structure for rules
  risk_categories JSONB, -- predefined risk classifications
  compliance_requirements JSONB, -- specific compliance requirements
  is_public BOOLEAN DEFAULT true,
  version VARCHAR(20) DEFAULT '1.0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Custom Policies (Enterprise-specific)
CREATE TABLE IF NOT EXISTS policies_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_id UUID REFERENCES policy_templates_enhanced(id), -- if based on template
  policy_rules JSONB NOT NULL, -- custom rules configuration
  risk_scoring JSONB, -- risk calculation parameters
  compliance_framework VARCHAR(100), -- specific framework this policy implements
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, archived, suspended
  version VARCHAR(20) DEFAULT '1.0',
  created_by UUID REFERENCES users_enhanced(id),
  approved_by UUID REFERENCES users_enhanced(id),
  approved_at TIMESTAMP,
  effective_date DATE,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Policy Rules (Individual compliance requirements)
CREATE TABLE IF NOT EXISTS policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES policies_enhanced(id) ON DELETE CASCADE,
  rule_type VARCHAR(100) NOT NULL, -- data_handling, content_creation, tool_approval, disclosure
  rule_name VARCHAR(255) NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL, -- when this rule applies
  requirements JSONB NOT NULL, -- what must be satisfied
  risk_weight INTEGER DEFAULT 1, -- 1-10 scoring weight
  is_mandatory BOOLEAN DEFAULT true,
  enforcement_level VARCHAR(50) DEFAULT 'strict', -- strict, advisory, warning
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Partners (Agencies/Vendors)
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(100), -- agency, vendor, freelancer, consultant
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  services_offered TEXT[], -- array of services
  compliance_certifications TEXT[], -- array of certifications
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, pending, terminated
  compliance_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100 compliance rating
  risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
  last_audit_date TIMESTAMP,
  next_audit_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Policy Distribution (Track which policies sent to which partners)
CREATE TABLE IF NOT EXISTS policy_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES policies_enhanced(id),
  partner_id UUID REFERENCES partners(id),
  distributed_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledgment_method VARCHAR(50), -- email, portal, signature
  compliance_status VARCHAR(50) DEFAULT 'pending', -- pending, compliant, violation, warning
  compliance_score DECIMAL(5,2), -- 0-100 score
  last_checked_at TIMESTAMP,
  next_review_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Violations
CREATE TABLE IF NOT EXISTS compliance_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  policy_id UUID REFERENCES policies_enhanced(id),
  partner_id UUID REFERENCES partners(id),
  violation_type VARCHAR(100) NOT NULL, -- policy_breach, data_mishandling, unauthorized_access
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  description TEXT NOT NULL,
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  corrective_actions TEXT[],
  status VARCHAR(50) DEFAULT 'open', -- open, investigating, resolved, closed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs (Immutable compliance tracking)
CREATE TABLE IF NOT EXISTS audit_logs_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  user_id UUID REFERENCES users_enhanced(id),
  action VARCHAR(100) NOT NULL, -- policy_created, rule_updated, violation_detected, distribution_sent
  entity_type VARCHAR(100), -- policy, rule, partner, distribution, violation
  entity_id UUID,
  details JSONB, -- action-specific metadata
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  risk_level VARCHAR(20), -- low, medium, high, critical
  created_at TIMESTAMP DEFAULT NOW()
);

-- Policy Compliance Checks
CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  policy_id UUID REFERENCES policies_enhanced(id),
  partner_id UUID REFERENCES partners(id),
  check_type VARCHAR(100) NOT NULL, -- automated, manual, scheduled
  check_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) NOT NULL, -- passed, failed, warning, pending
  score DECIMAL(5,2), -- 0-100 compliance score
  findings JSONB, -- detailed findings
  recommendations TEXT[],
  next_check_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Policy Workflows
CREATE TABLE IF NOT EXISTS policy_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workflow_type VARCHAR(100) NOT NULL, -- approval, review, distribution
  steps JSONB NOT NULL, -- workflow steps configuration
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, draft
  created_by UUID REFERENCES users_enhanced(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow Instances
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES policy_workflows(id),
  organization_id UUID REFERENCES organizations_enhanced(id),
  entity_type VARCHAR(100) NOT NULL, -- policy, distribution, violation
  entity_id UUID NOT NULL,
  current_step INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled, failed
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_policies_enhanced_organization ON policies_enhanced(organization_id);
CREATE INDEX IF NOT EXISTS idx_policies_enhanced_status ON policies_enhanced(status);
CREATE INDEX IF NOT EXISTS idx_policy_rules_policy ON policy_rules(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_rules_type ON policy_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_enhanced_org_time ON audit_logs_enhanced(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_enhanced_action ON audit_logs_enhanced(action);
CREATE INDEX IF NOT EXISTS idx_partners_organization ON partners(organization_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_policy_distributions_policy ON policy_distributions(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_distributions_partner ON policy_distributions(partner_id);
CREATE INDEX IF NOT EXISTS idx_policy_distributions_status ON policy_distributions(compliance_status);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_org ON compliance_violations(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_severity ON compliance_violations(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_org ON compliance_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_org ON workflow_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_organizations_enhanced_updated_at BEFORE UPDATE ON organizations_enhanced FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_enhanced_updated_at BEFORE UPDATE ON users_enhanced FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policy_templates_enhanced_updated_at BEFORE UPDATE ON policy_templates_enhanced FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policies_enhanced_updated_at BEFORE UPDATE ON policies_enhanced FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policy_rules_updated_at BEFORE UPDATE ON policy_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policy_distributions_updated_at BEFORE UPDATE ON policy_distributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_violations_updated_at BEFORE UPDATE ON compliance_violations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_checks_updated_at BEFORE UPDATE ON compliance_checks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policy_workflows_updated_at BEFORE UPDATE ON policy_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_instances_updated_at BEFORE UPDATE ON workflow_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO organizations_enhanced (name, industry, compliance_tier, contact_email) VALUES
('PharmaCorp Inc.', 'pharmaceutical', 'enterprise', 'compliance@pharmacorp.com'),
('MediTech Solutions', 'healthcare', 'standard', 'admin@meditech.com'),
('BioResearch Labs', 'pharmaceutical', 'basic', 'info@bioresearch.com');

INSERT INTO policy_templates_enhanced (name, description, industry, regulation_framework, template_rules, risk_categories) VALUES
('FDA Social Media Compliance', 'Comprehensive FDA guidelines for pharmaceutical social media marketing', 'pharmaceutical', 'FDA', 
 '{"data_handling": {"patient_privacy": true, "adverse_event_reporting": true}, "content_creation": {"medical_claims": false, "balanced_presentation": true}}',
 '{"high": ["patient_data", "medical_claims"], "medium": ["adverse_events", "off_label"], "low": ["general_info"]}'),
('HIPAA Data Protection', 'Healthcare data protection and privacy standards', 'healthcare', 'HIPAA',
 '{"data_handling": {"encryption": true, "access_controls": true}, "disclosure": {"patient_consent": true}}',
 '{"high": ["patient_data", "medical_records"], "medium": ["treatment_info"], "low": ["general_health"]}'),
('AI Content Disclosure', 'AI-generated content disclosure requirements', 'pharmaceutical', 'AI_ACT',
 '{"content_creation": {"ai_disclosure": true, "human_review": true}, "transparency": {"source_attribution": true}}',
 '{"high": ["ai_generated", "medical_content"], "medium": ["marketing_content"], "low": ["general_info"]}');

-- Create a rollback migration
CREATE TABLE IF NOT EXISTS migration_rollback_008 (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) DEFAULT '008_create_policy_management_system',
    applied_at TIMESTAMP DEFAULT NOW(),
    can_rollback BOOLEAN DEFAULT true
);

INSERT INTO migration_rollback_008 (migration_name) VALUES ('008_create_policy_management_system');
