-- Migration: Initial AICOMPLYR Schema for Supabase
-- This migration sets up the complete database schema including:
-- - Core organizational structure
-- - Policy management system
-- - Contract management system
-- - Audit and compliance tracking
-- - Row Level Security policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE ORGANIZATIONAL STRUCTURE
-- =====================================================

-- Organizations (clients, agencies, etc.)
CREATE TABLE IF NOT EXISTS organizations_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('enterprise', 'agency', 'client', 'partner', 'other')) NOT NULL,
    competitive_group VARCHAR(100), -- e.g., 'pharma', 'tech', 'agency', etc.
    industry VARCHAR(100),
    size VARCHAR(50), -- small, medium, large, enterprise
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users with enhanced capabilities
CREATE TABLE IF NOT EXISTS users_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user', -- admin, manager, user, viewer
    permissions JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- POLICY MANAGEMENT SYSTEM
-- =====================================================

-- Policy templates and definitions
CREATE TABLE IF NOT EXISTS policy_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id),
    template_name VARCHAR(255) NOT NULL,
    policy_type VARCHAR(100) NOT NULL, -- ai_governance, data_privacy, compliance
    version VARCHAR(20) DEFAULT '1.0',
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users_enhanced(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Active policies
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id),
    template_id UUID REFERENCES policy_templates(id),
    policy_name VARCHAR(255) NOT NULL,
    policy_type VARCHAR(100) NOT NULL,
    content JSONB NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, inactive, archived
    effective_date DATE,
    expiration_date DATE,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users_enhanced(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Policy distribution tracking
CREATE TABLE IF NOT EXISTS policy_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id),
    organization_id UUID REFERENCES organizations_enhanced(id),
    distribution_type VARCHAR(50) NOT NULL, -- email, notification, dashboard
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, read
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agency policy compliance
CREATE TABLE IF NOT EXISTS agency_policy_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES organizations_enhanced(id),
    policy_id UUID REFERENCES policies(id),
    compliance_status VARCHAR(20) DEFAULT 'pending', -- pending, compliant, non_compliant, review
    compliance_score DECIMAL(5,2),
    last_review_date DATE,
    next_review_date DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CONTRACT MANAGEMENT SYSTEM
-- =====================================================

-- Contract Types and Templates
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  template_name VARCHAR(255) NOT NULL,
  contract_type VARCHAR(50) NOT NULL, -- MSA, DPA, BAA, SLA, SOW
  template_version VARCHAR(20) DEFAULT '1.0',
  legal_framework VARCHAR(100), -- GDPR, HIPAA, FDA_21CFR11
  standard_terms JSONB, -- key clauses and terms
  approval_workflow JSONB, -- who needs to approve
  risk_category VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users_enhanced(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Main Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  template_id UUID REFERENCES contract_templates(id),
  contract_number VARCHAR(100) UNIQUE NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_contact_email VARCHAR(255),
  vendor_legal_entity VARCHAR(255),
  
  -- Contract Details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  contract_value DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(100), -- NET30, NET60, etc.
  
  -- Dates and Duration
  effective_date DATE NOT NULL,
  expiration_date DATE,
  notice_period_days INTEGER DEFAULT 30,
  auto_renewal BOOLEAN DEFAULT false,
  renewal_term_months INTEGER,
  
  -- Ownership and Approval
  business_owner_id UUID REFERENCES users_enhanced(id),
  legal_owner_id UUID REFERENCES users_enhanced(id),
  procurement_owner_id UUID REFERENCES users_enhanced(id),
  
  -- Status and Risk
  status VARCHAR(50) DEFAULT 'draft', -- draft, under_review, negotiation, approved, active, expired, terminated
  approval_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, conditional
  risk_rating VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  
  -- Legal and Compliance
  governing_law VARCHAR(100),
  jurisdiction VARCHAR(100),
  liability_cap DECIMAL(15,2),
  insurance_requirements JSONB,
  data_protection_clauses JSONB,
  regulatory_requirements JSONB, -- FDA, EMA, etc.
  
  -- Document Management
  master_document_url TEXT,
  executed_document_url TEXT,
  amendment_count INTEGER DEFAULT 0,
  digital_signature_required BOOLEAN DEFAULT true,
  digital_signature_status VARCHAR(50), -- not_required, pending, partial, complete
  
  -- Operational Details
  sla_requirements JSONB,
  performance_metrics JSONB,
  reporting_requirements JSONB,
  audit_rights JSONB,
  termination_clauses JSONB,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_reviewed_date DATE,
  next_review_date DATE
);

-- =====================================================
-- AUDIT AND COMPLIANCE TRACKING
-- =====================================================

-- Audit entries for decision tracking
CREATE TABLE IF NOT EXISTS audit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations_enhanced(id),
    user_id UUID REFERENCES users_enhanced(id),
    action_type VARCHAR(100) NOT NULL, -- policy_created, policy_updated, decision_made
    resource_type VARCHAR(100), -- policy, contract, user, organization
    resource_id UUID,
    details JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core tables
CREATE INDEX IF NOT EXISTS idx_organizations_enhanced_type ON organizations_enhanced(type);
CREATE INDEX IF NOT EXISTS idx_organizations_enhanced_competitive_group ON organizations_enhanced(competitive_group);
CREATE INDEX IF NOT EXISTS idx_users_enhanced_organization ON users_enhanced(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_enhanced_email ON users_enhanced(email);

-- Policy tables
CREATE INDEX IF NOT EXISTS idx_policies_organization ON policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_policies_type ON policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policy_distributions_policy ON policy_distributions(policy_id);
CREATE INDEX IF NOT EXISTS idx_agency_policy_compliance_agency ON agency_policy_compliance(agency_id);

-- Contract tables
CREATE INDEX IF NOT EXISTS idx_contracts_organization_status ON contracts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_expiration ON contracts(expiration_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_contract_templates_organization ON contract_templates(organization_id);

-- Audit tables
CREATE INDEX IF NOT EXISTS idx_audit_entries_organization ON audit_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_entries_user ON audit_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entries_created_at ON audit_entries(created_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update modified time
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER trigger_organizations_enhanced_updated_at
    BEFORE UPDATE ON organizations_enhanced
    FOR EACH ROW EXECUTE FUNCTION update_modified_time();

CREATE TRIGGER trigger_users_enhanced_updated_at
    BEFORE UPDATE ON users_enhanced
    FOR EACH ROW EXECUTE FUNCTION update_modified_time();

CREATE TRIGGER trigger_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_modified_time();

CREATE TRIGGER trigger_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_modified_time();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_policy_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_entries ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (will be enhanced in next migration)
CREATE POLICY "Users can view own organization" ON organizations_enhanced
    FOR SELECT USING (true); -- Temporary, will be restricted in next migration

CREATE POLICY "Users can view own profile" ON users_enhanced
    FOR SELECT USING (true); -- Temporary, will be restricted in next migration

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample organization
INSERT INTO organizations_enhanced (name, type, competitive_group, industry) VALUES
('AICOMPLYR Demo Corp', 'enterprise', 'tech', 'Technology') ON CONFLICT DO NOTHING;

-- Insert sample user
INSERT INTO users_enhanced (organization_id, email, first_name, last_name, role) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1), 'admin@aicomplyr.io', 'Admin', 'User', 'admin') ON CONFLICT DO NOTHING;

-- Insert sample policy template
INSERT INTO policy_templates (organization_id, template_name, policy_type, content, created_by) VALUES
((SELECT id FROM organizations_enhanced LIMIT 1), 'AI Governance Policy', 'ai_governance', 
 '{"title": "AI Governance Policy", "content": "This policy governs the use of AI tools..."}', 
 (SELECT id FROM users_enhanced LIMIT 1)) ON CONFLICT DO NOTHING;
