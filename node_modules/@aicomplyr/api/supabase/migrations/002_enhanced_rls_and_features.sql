-- Migration: Enhanced RLS Policies and Additional Features
-- This migration adds:
-- - Comprehensive Row Level Security policies
-- - Additional contract management features
-- - Real-time subscription setup
-- - Enhanced audit capabilities

-- =====================================================
-- ENHANCED ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Drop temporary policies from previous migration
DROP POLICY IF EXISTS "Users can view own organization" ON organizations_enhanced;
DROP POLICY IF EXISTS "Users can view own profile" ON users_enhanced;

-- Organizations: Users can only view organizations they belong to
CREATE POLICY "Users can view own organization" ON organizations_enhanced
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage organizations" ON organizations_enhanced
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = organizations_enhanced.id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role = 'admin'
        )
    );

-- Users: Users can view users in their organization
CREATE POLICY "Users can view organization members" ON users_enhanced
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update own profile" ON users_enhanced
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage users" ON users_enhanced
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = users_enhanced.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role = 'admin'
        )
    );

-- Policies: Users can view policies in their organization
CREATE POLICY "Users can view organization policies" ON policies
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage policies" ON policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = policies.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role = 'admin'
        )
    );

-- Policy Templates: Similar access control
CREATE POLICY "Users can view organization policy templates" ON policy_templates
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage policy templates" ON policy_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = policy_templates.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role = 'admin'
        )
    );

-- Contract Templates: Organization-scoped access
CREATE POLICY "Users can view organization contract templates" ON contract_templates
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage contract templates" ON contract_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = contract_templates.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role = 'admin'
        )
    );

-- Contracts: Organization-scoped access with role-based permissions
CREATE POLICY "Users can view organization contracts" ON contracts
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

CREATE POLICY "Contract owners can manage contracts" ON contracts
    FOR ALL USING (
        business_owner_id = auth.uid() OR 
        legal_owner_id = auth.uid() OR 
        procurement_owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users_enhanced 
            WHERE users_enhanced.organization_id = contracts.organization_id 
            AND users_enhanced.id = auth.uid() 
            AND users_enhanced.role = 'admin'
        )
    );

-- Audit Entries: Users can view audit entries in their organization
CREATE POLICY "Users can view organization audit entries" ON audit_entries
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can insert audit entries" ON audit_entries
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- ADDITIONAL CONTRACT MANAGEMENT FEATURES
-- =====================================================

-- Contract Amendments
CREATE TABLE IF NOT EXISTS contract_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  amendment_number INTEGER NOT NULL,
  amendment_type VARCHAR(50), -- extension, value_change, scope_change, termination
  description TEXT NOT NULL,
  effective_date DATE NOT NULL,
  value_change DECIMAL(15,2),
  new_expiration_date DATE,
  document_url TEXT,
  approved_by UUID REFERENCES users_enhanced(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contract Approvals Workflow
CREATE TABLE IF NOT EXISTS contract_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  approver_id UUID REFERENCES users_enhanced(id),
  approval_type VARCHAR(50), -- legal, business, procurement, security, compliance
  approval_order INTEGER, -- sequence of approvals
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, delegated
  comments TEXT,
  conditions JSONB, -- conditions for approval
  approved_at TIMESTAMP,
  deadline TIMESTAMP,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Financial Operations Schema
CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  cost_center_code VARCHAR(50) UNIQUE NOT NULL,
  cost_center_name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  business_unit VARCHAR(100),
  manager_id UUID REFERENCES users_enhanced(id),
  budget_owner_id UUID REFERENCES users_enhanced(id),
  parent_cost_center_id UUID REFERENCES cost_centers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  account_name VARCHAR(255) NOT NULL,
  account_code VARCHAR(50) UNIQUE,
  
  -- Billing Configuration
  billing_model VARCHAR(50) DEFAULT 'usage', -- usage, subscription, hybrid, fixed
  billing_frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, annually
  currency VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(50) DEFAULT 'NET30',
  
  -- Budget Management
  annual_budget DECIMAL(15,2),
  quarterly_budget DECIMAL(15,2),
  monthly_budget DECIMAL(15,2),
  current_period_budget DECIMAL(15,2),
  budget_period_start DATE,
  budget_period_end DATE,
  
  -- Approval Workflows
  approval_threshold DECIMAL(15,2) DEFAULT 10000,
  requires_po BOOLEAN DEFAULT true,
  auto_approval_limit DECIMAL(15,2) DEFAULT 1000,
  
  -- Alerts and Controls
  budget_alert_threshold INTEGER DEFAULT 80, -- percentage
  budget_freeze_threshold INTEGER DEFAULT 95,
  overspend_allowed BOOLEAN DEFAULT false,
  
  -- Contact Information
  billing_contact_id UUID REFERENCES users_enhanced(id),
  finance_approver_id UUID REFERENCES users_enhanced(id),
  
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, closed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- REAL-TIME FEATURES SETUP
-- =====================================================

-- Enable real-time for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE organizations_enhanced;
ALTER PUBLICATION supabase_realtime ADD TABLE users_enhanced;
ALTER PUBLICATION supabase_realtime ADD TABLE policies;
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_entries;

-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Contract amendments and approvals
CREATE INDEX IF NOT EXISTS idx_contract_amendments_contract ON contract_amendments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_pending ON contract_approvals(approver_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_contract_approvals_contract ON contract_approvals(contract_id);

-- Financial operations
CREATE INDEX IF NOT EXISTS idx_cost_centers_organization ON cost_centers(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_cost_center ON billing_accounts(cost_center_id, status);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_organization ON billing_accounts(organization_id);

-- =====================================================
-- ENHANCED AUDIT CAPABILITIES
-- =====================================================

-- Function to automatically log audit entries
CREATE OR REPLACE FUNCTION log_audit_entry(
    p_action_type VARCHAR(100),
    p_resource_type VARCHAR(100),
    p_resource_id UUID,
    p_details JSONB
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_user_id UUID;
    v_organization_id UUID;
BEGIN
    -- Get current user context (from JWT or session)
    v_user_id := auth.uid();
    
    -- Get organization from user
    SELECT organization_id INTO v_organization_id 
    FROM users_enhanced 
    WHERE id = v_user_id;
    
    -- Insert audit entry
    INSERT INTO audit_entries (
        organization_id,
        user_id,
        action_type,
        resource_type,
        resource_id,
        details,
        ip_address
    ) VALUES (
        v_organization_id,
        v_user_id,
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_details,
        inet_client_addr()
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA FOR CONTRACT MANAGEMENT
-- =====================================================

-- Insert sample cost center
INSERT INTO cost_centers (organization_id, cost_center_code, cost_center_name, department) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1), 'IT-001', 'Information Technology', 'Technology') ON CONFLICT DO NOTHING;

-- Insert sample billing account
INSERT INTO billing_accounts (organization_id, cost_center_id, account_name, account_code, annual_budget) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1), 
 (SELECT id FROM cost_centers LIMIT 1), 
 'AI Tools Budget', 'AI-2024', 50000.00) ON CONFLICT DO NOTHING;

-- Insert sample contract template
INSERT INTO contract_templates (organization_id, template_name, contract_type, legal_framework, standard_terms) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1),
 'Standard MSA - Technology Services',
 'MSA',
 'US_Commercial',
 '{"liability_cap": 1000000, "data_protection": true, "termination_notice_days": 30}') ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE contract_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;

-- Contract amendments: Users can view amendments for contracts they have access to
CREATE POLICY "Users can view contract amendments" ON contract_amendments
    FOR SELECT USING (
        contract_id IN (
            SELECT id FROM contracts WHERE organization_id IN (
                SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
            )
        )
    );

-- Contract approvals: Users can view approvals for contracts they have access to
CREATE POLICY "Users can view contract approvals" ON contract_approvals
    FOR SELECT USING (
        contract_id IN (
            SELECT id FROM contracts WHERE organization_id IN (
                SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
            )
        )
    );

-- Cost centers: Organization-scoped access
CREATE POLICY "Users can view organization cost centers" ON cost_centers
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

-- Billing accounts: Organization-scoped access
CREATE POLICY "Users can view organization billing accounts" ON billing_accounts
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

-- =====================================================
-- ENTERPRISE PHARMA TABLES - CRITICAL FOR PRODUCTION
-- =====================================================

-- 1. CHANGE MANAGEMENT SYSTEM
-- Essential for FDA compliance and enterprise governance
CREATE TABLE IF NOT EXISTS change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('policy', 'contract', 'system', 'process', 'procedure')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    business_justification TEXT,
    impact_level VARCHAR(20) NOT NULL CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    risk_assessment TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'implemented', 'closed')),
    requester_id UUID REFERENCES users_enhanced(id),
    change_advisory_board_required BOOLEAN DEFAULT false,
    regulatory_impact VARCHAR(20) CHECK (regulatory_impact IN ('none', 'low', 'medium', 'high', 'fda_submission')),
    implementation_timeline DATE,
    rollback_plan TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    implemented_at TIMESTAMP
);

-- 2. INCIDENT & CRISIS MANAGEMENT
-- Critical for GxP compliance and business continuity
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN ('security', 'performance', 'compliance', 'data', 'system', 'process', 'quality')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    business_impact TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mitigating', 'resolved', 'closed', 'escalated')),
    reported_by UUID REFERENCES users_enhanced(id),
    assigned_to UUID REFERENCES users_enhanced(id),
    escalation_level INTEGER DEFAULT 1,
    sla_target_hours INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    detected_at TIMESTAMP,
    escalated_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    root_cause TEXT,
    corrective_actions TEXT,
    preventive_measures TEXT,
    lessons_learned TEXT
);

-- 3. QUALITY MANAGEMENT SYSTEM (QMS)
-- Essential for FDA 21 CFR Part 11 and GxP compliance
CREATE TABLE IF NOT EXISTS sop_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    document_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('sop', 'policy', 'procedure', 'work_instruction', 'form', 'template')),
    version VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'effective', 'obsolete', 'archived')),
    content TEXT,
    content_hash VARCHAR(255), -- For digital signature verification
    approver_id UUID REFERENCES users_enhanced(id),
    reviewer_id UUID REFERENCES users_enhanced(id),
    effective_date DATE,
    review_date DATE,
    next_review_date DATE,
    regulatory_scope TEXT[], -- Array of applicable regulations
    training_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    effective_at TIMESTAMP
);

-- 4. VENDOR RISK MANAGEMENT
-- Critical for enterprise security and compliance
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50) NOT NULL CHECK (vendor_type IN ('technology', 'consulting', 'legal', 'audit', 'cloud', 'software', 'hardware')),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_status VARCHAR(20) DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'compliant', 'non_compliant', 'conditional', 'suspended')),
    data_access_level VARCHAR(20) CHECK (data_access_level IN ('none', 'read_only', 'limited', 'full')),
    contract_id UUID REFERENCES contracts(id),
    last_assessment_date DATE,
    next_assessment_date DATE,
    security_questionnaire_completed BOOLEAN DEFAULT false,
    data_processing_agreement_signed BOOLEAN DEFAULT false,
    business_associate_agreement_signed BOOLEAN DEFAULT false,
    insurance_coverage_verified BOOLEAN DEFAULT false,
    financial_stability_score INTEGER CHECK (financial_stability_score >= 1 AND financial_stability_score <= 10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. DISASTER RECOVERY & BUSINESS CONTINUITY
-- Essential for enterprise resilience and compliance
CREATE TABLE IF NOT EXISTS disaster_recovery_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    plan_name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('dr', 'bcp', 'incident_response', 'crisis_management')),
    critical_functions TEXT[],
    recovery_time_objective_hours INTEGER,
    recovery_point_objective_hours INTEGER,
    backup_strategy TEXT,
    recovery_procedures TEXT,
    contact_list TEXT,
    last_tested_date DATE,
    next_test_date DATE,
    test_results TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'active', 'under_revision')),
    approver_id UUID REFERENCES users_enhanced(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP
);

-- 6. ENTERPRISE ONBOARDING & ACCESS MANAGEMENT
-- Critical for enterprise user lifecycle management
CREATE TABLE IF NOT EXISTS enterprise_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_enhanced(id),
    onboarding_type VARCHAR(50) NOT NULL CHECK (onboarding_type IN ('new_hire', 'contractor', 'vendor', 'partner', 'auditor')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'on_hold')),
    required_training_completed BOOLEAN DEFAULT false,
    background_check_completed BOOLEAN DEFAULT false,
    compliance_acknowledgment_signed BOOLEAN DEFAULT false,
    system_access_granted BOOLEAN DEFAULT false,
    manager_approval_required BOOLEAN DEFAULT false,
    manager_approval_received BOOLEAN DEFAULT false,
    hr_approval_required BOOLEAN DEFAULT false,
    hr_approval_received BOOLEAN DEFAULT false,
    it_approval_required BOOLEAN DEFAULT false,
    it_approval_received BOOLEAN DEFAULT false,
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. GLOBAL COMPLIANCE TRACKING
-- Essential for multi-jurisdictional pharma operations
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
    regulation_name VARCHAR(255) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL, -- 'US', 'EU', 'UK', 'Canada', 'Australia', etc.
    regulation_type VARCHAR(50) NOT NULL CHECK (regulation_type IN ('fda', 'ema', 'hipaa', 'gdpr', 'ccpa', 'sox', 'gxp', 'iso')),
    effective_date DATE,
    compliance_deadline DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'compliant', 'non_compliant', 'exempt')),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    responsible_party UUID REFERENCES users_enhanced(id),
    compliance_evidence TEXT,
    audit_findings TEXT,
    corrective_actions TEXT,
    next_audit_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Change Management Indexes
CREATE INDEX IF NOT EXISTS idx_change_requests_organization ON change_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status, impact_level);
CREATE INDEX IF NOT EXISTS idx_change_requests_requester ON change_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_type ON change_requests(request_type, status);

-- Incident Management Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_organization ON incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status, severity);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type, priority);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned ON incidents(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_incidents_number ON incidents(incident_number);

-- QMS Indexes
CREATE INDEX IF NOT EXISTS idx_sop_documents_organization ON sop_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_sop_documents_status ON sop_documents(status, document_type);
CREATE INDEX IF NOT EXISTS idx_sop_documents_number ON sop_documents(document_number);
CREATE INDEX IF NOT EXISTS idx_sop_documents_review ON sop_documents(next_review_date, status);

-- Vendor Management Indexes
CREATE INDEX IF NOT EXISTS idx_vendors_organization ON vendors(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendors_risk ON vendors(risk_level, compliance_status);
CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendors(vendor_type, risk_level);
CREATE INDEX IF NOT EXISTS idx_vendors_assessment ON vendors(next_assessment_date, compliance_status);

-- Disaster Recovery Indexes
CREATE INDEX IF NOT EXISTS idx_dr_plans_organization ON disaster_recovery_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_dr_plans_type ON disaster_recovery_plans(plan_type, status);
CREATE INDEX IF NOT EXISTS idx_dr_plans_testing ON disaster_recovery_plans(next_test_date, status);

-- Enterprise Onboarding Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_organization ON enterprise_onboarding(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON enterprise_onboarding(user_id, status);
CREATE INDEX IF NOT EXISTS idx_onboarding_type ON enterprise_onboarding(onboarding_type, status);
CREATE INDEX IF NOT EXISTS idx_onboarding_completion ON enterprise_onboarding(target_completion_date, status);

-- Compliance Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_organization ON compliance_requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_jurisdiction ON compliance_requirements(jurisdiction, regulation_type);
CREATE INDEX IF NOT EXISTS idx_compliance_deadline ON compliance_requirements(compliance_deadline, status);
CREATE INDEX IF NOT EXISTS idx_compliance_risk ON compliance_requirements(risk_level, status);

-- =====================================================
-- RLS POLICIES FOR ENTERPRISE TABLES
-- =====================================================

-- Enable RLS on all new enterprise tables
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE disaster_recovery_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;

-- Change Requests: Organization-scoped access with role-based permissions
CREATE POLICY "Users can view organization change requests" ON change_requests
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create change requests for their organization" ON change_requests
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

-- Incidents: Organization-scoped access with incident management permissions
CREATE POLICY "Users can view organization incidents" ON incidents
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create incidents for their organization" ON incidents
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

-- SOP Documents: Organization-scoped access with document management permissions
CREATE POLICY "Users can view organization SOP documents" ON sop_documents
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

-- Vendors: Organization-scoped access with vendor management permissions
CREATE POLICY "Users can view organization vendors" ON vendors
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

-- Disaster Recovery: Organization-scoped access with DR management permissions
CREATE POLICY "Users can view organization DR plans" ON disaster_recovery_plans
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

-- Enterprise Onboarding: Organization-scoped access with HR permissions
CREATE POLICY "Users can view organization onboarding" ON enterprise_onboarding
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

-- Compliance: Organization-scoped access with compliance management permissions
CREATE POLICY "Users can view organization compliance requirements" ON compliance_requirements
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
        )
    );

-- =====================================================
-- SAMPLE ENTERPRISE DATA
-- =====================================================

-- Sample Change Request
INSERT INTO change_requests (organization_id, request_type, title, description, impact_level, status, requester_id) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1),
 'policy',
 'AI Governance Policy Update for FDA Compliance',
 'Update AI governance policy to align with latest FDA guidance on AI/ML in medical devices',
 'high',
 'submitted',
 (SELECT id FROM users_enhanced LIMIT 1)) ON CONFLICT DO NOTHING;

-- Sample Incident
INSERT INTO incidents (organization_id, incident_number, incident_type, severity, priority, title, description, reported_by) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1),
 'INC-2024-001',
 'compliance',
 'medium',
 'high',
 'Data Classification Policy Violation',
 'User attempted to access restricted clinical data without proper authorization',
 (SELECT id FROM users_enhanced LIMIT 1)) ON CONFLICT DO NOTHING;

-- Sample SOP Document
INSERT INTO sop_documents (organization_id, document_number, title, document_type, version, status, approver_id) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1),
 'SOP-AI-001',
 'AI Tool Approval and Validation Procedure',
 'sop',
 '1.0',
 'approved',
 (SELECT id FROM users_enhanced LIMIT 1)) ON CONFLICT DO NOTHING;

-- Sample Vendor
INSERT INTO vendors (organization_id, vendor_name, vendor_type, risk_level, compliance_status, data_access_level) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1),
 'CloudTech Solutions Inc.',
 'cloud',
 'medium',
 'compliant',
 'limited') ON CONFLICT DO NOTHING;

-- Sample Disaster Recovery Plan
INSERT INTO disaster_recovery_plans (organization_id, plan_name, plan_type, critical_functions, recovery_time_objective_hours, recovery_point_objective_hours, status) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1),
 'AI Platform Disaster Recovery Plan',
 'dr',
 ARRAY['AI Model Serving', 'Data Processing', 'User Authentication'],
 4,
 1,
 'active') ON CONFLICT DO NOTHING;

-- Sample Enterprise Onboarding
INSERT INTO enterprise_onboarding (organization_id, user_id, onboarding_type, status, required_training_completed, background_check_completed) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1),
 (SELECT id FROM users_enhanced LIMIT 1),
 'new_hire',
 'in_progress',
 true,
 true) ON CONFLICT DO NOTHING;

-- Sample Compliance Requirement
INSERT INTO compliance_requirements (organization_id, regulation_name, jurisdiction, regulation_type, effective_date, compliance_deadline, status, risk_level) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1),
 'FDA 21 CFR Part 11 - Electronic Records',
 'US',
 'fda',
 '2024-01-01',
 '2024-12-31',
 'in_progress',
 'high') ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETION MARKER
-- =====================================================

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS supabase_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT NOW(),
    checksum VARCHAR(255)
);

-- Record this migration
INSERT INTO supabase_migrations (migration_name, checksum) VALUES 
('002_enhanced_rls_and_features', 'enhanced_rls_v1') ON CONFLICT DO NOTHING;
