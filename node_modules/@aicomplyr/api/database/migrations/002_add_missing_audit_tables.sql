-- Migration: Add missing audit tables
-- Description: Creates audit_policy_references and audit_chains tables

-- Create audit_policy_references table with correct UUID types
CREATE TABLE audit_policy_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES audit_entries(entry_id) ON DELETE CASCADE,
    policy_id VARCHAR(255) NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    policy_version VARCHAR(50),
    policy_status VARCHAR(50) DEFAULT 'active',
    compliance_status VARCHAR(50) DEFAULT 'compliant',
    relevance DECIMAL(3,2) CHECK (relevance >= 0.00 AND relevance <= 1.00),
    impact VARCHAR(50) CHECK (impact IN ('positive', 'negative', 'neutral')),
    evaluation_result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create audit_chains table with correct UUID types
CREATE TABLE audit_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id VARCHAR(255) UNIQUE NOT NULL,
    session_id UUID REFERENCES audit_sessions(session_id) ON DELETE CASCADE,
    root_entry_id UUID REFERENCES audit_entries(entry_id),
    chain_type VARCHAR(50),
    chain_status VARCHAR(50) DEFAULT 'active',
    total_links INTEGER DEFAULT 0,
    chain_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit_policy_references
CREATE INDEX idx_audit_policy_references_entry_id ON audit_policy_references(entry_id);
CREATE INDEX idx_audit_policy_references_policy_id ON audit_policy_references(policy_id);
CREATE INDEX idx_audit_policy_references_compliance ON audit_policy_references(compliance_status);