-- Enhanced Partner-Enterprise Relationship Model
-- File: database/migrations/010_enhance_partner_enterprise_model.sql
-- This migration adds support for Partner-Enterprise relationships and Partner-Client contexts

-- ===== PARTNER-ENTERPRISE RELATIONSHIPS =====

-- Partner-Enterprise Relationships table
CREATE TABLE IF NOT EXISTS partner_enterprise_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    client_enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    relationship_status VARCHAR(50) DEFAULT 'active' CHECK (relationship_status IN ('active', 'pending', 'suspended', 'terminated')),
    relationship_type VARCHAR(50) CHECK (relationship_type IN ('agency', 'vendor', 'consultant', 'freelancer', 'other')),
    contract_start_date DATE,
    contract_end_date DATE,
    compliance_score DECIMAL(5,2) DEFAULT 0.00 CHECK (compliance_score >= 0 AND compliance_score <= 100),
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(partner_enterprise_id, client_enterprise_id),
    CONSTRAINT partner_enterprise_different CHECK (partner_enterprise_id != client_enterprise_id)
);

-- Indexes for partner-enterprise relationships
CREATE INDEX idx_partner_enterprise_relationships_partner ON partner_enterprise_relationships(partner_enterprise_id);
CREATE INDEX idx_partner_enterprise_relationships_client ON partner_enterprise_relationships(client_enterprise_id);
CREATE INDEX idx_partner_enterprise_relationships_status ON partner_enterprise_relationships(relationship_status);
CREATE INDEX idx_partner_enterprise_relationships_composite ON partner_enterprise_relationships(partner_enterprise_id, client_enterprise_id, relationship_status);

-- ===== PARTNER-CLIENT CONTEXTS =====

-- Partner-Client Contexts table (for users who work as partners with multiple clients)
CREATE TABLE IF NOT EXISTS partner_client_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    client_enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'partner_admin',
        'partner_user',
        'account_manager',
        'creative_director',
        'project_manager',
        'compliance_manager'
    )),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, partner_enterprise_id, client_enterprise_id)
);

-- Indexes for partner-client contexts
CREATE INDEX idx_partner_client_contexts_user_id ON partner_client_contexts(user_id);
CREATE INDEX idx_partner_client_contexts_partner ON partner_client_contexts(partner_enterprise_id);
CREATE INDEX idx_partner_client_contexts_client ON partner_client_contexts(client_enterprise_id);
CREATE INDEX idx_partner_client_contexts_active ON partner_client_contexts(is_active) WHERE is_active = true;
CREATE INDEX idx_partner_client_contexts_composite ON partner_client_contexts(user_id, partner_enterprise_id, client_enterprise_id, is_active);

-- ===== ENTERPRISE ENHANCEMENTS =====

-- Add rate limiting fields to enterprises if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enterprises' AND column_name = 'rate_limit_tier'
    ) THEN
        ALTER TABLE enterprises ADD COLUMN rate_limit_tier VARCHAR(50) DEFAULT 'standard' CHECK (rate_limit_tier IN ('standard', 'premium', 'enterprise'));
    END IF;
END $$;

-- ===== COMMENTS =====

COMMENT ON TABLE partner_enterprise_relationships IS 'Relationships between Partner enterprises and their Client enterprises';
COMMENT ON TABLE partner_client_contexts IS 'User contexts for Partner users working with specific Client enterprises';
COMMENT ON COLUMN partner_enterprise_relationships.compliance_score IS 'Compliance score from 0-100 based on partner performance';
COMMENT ON COLUMN partner_enterprise_relationships.risk_level IS 'Risk assessment level for the relationship';

