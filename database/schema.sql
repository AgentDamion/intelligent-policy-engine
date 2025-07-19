-- aicomplyr.io Production Database Schema (PostgreSQL)

-- Organizations (clients, agencies, etc.)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    type VARCHAR CHECK (type IN ('enterprise', 'agency', 'client', 'partner', 'other')) NOT NULL,
    competitive_group VARCHAR, -- e.g., 'pharma', 'tech', 'agency', etc.
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agencies (optional, if you want to separate from organizations)
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Projects (can belong to any organization)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    description TEXT,
    status VARCHAR DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Relationships (between organizations, agencies, projects, etc.)
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL, -- organization or project
    source_type VARCHAR CHECK (source_type IN ('organization', 'project', 'agency')) NOT NULL,
    target_id UUID NOT NULL, -- organization or project
    target_type VARCHAR CHECK (target_type IN ('organization', 'project', 'agency')) NOT NULL,
    relationship_type VARCHAR NOT NULL, -- e.g., 'competitor', 'partner', 'client', 'subsidiary', etc.
    competitive_group VARCHAR, -- optional, for grouping
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Sessions
CREATE TABLE IF NOT EXISTS audit_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    workflow_path JSONB,
    agents_engaged TEXT[],
    final_decision JSONB,
    total_processing_time INTEGER,
    status VARCHAR DEFAULT 'active'
);

-- Audit Entries
CREATE TABLE IF NOT EXISTS audit_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES audit_sessions(session_id),
    timestamp TIMESTAMP DEFAULT NOW(),
    agent VARCHAR NOT NULL,
    decision_type VARCHAR,
    decision JSONB,
    reasoning TEXT[],
    policies_referenced TEXT[],
    before_state JSONB,
    after_state JSONB,
    risk_level VARCHAR,
    status VARCHAR,
    processing_time_ms INTEGER,
    metadata JSONB
);

-- Negotiations
CREATE TABLE IF NOT EXISTS negotiations (
    negotiation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    timestamp TIMESTAMP DEFAULT NOW(),
    clients JSONB,
    relationships JSONB,
    conflicts JSONB,
    solution JSONB,
    client_requirements JSONB,
    status VARCHAR DEFAULT 'active'
);

-- Policies
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR NOT NULL,
    risk_profiles JSONB,
    rules JSONB,
    version INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR NOT NULL,
    users_count INTEGER DEFAULT 0,
    policies_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'active'
);

-- Admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_user_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_user_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policy Templates (Base templates that organizations can customize)
CREATE TABLE IF NOT EXISTS policy_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    industry VARCHAR, -- 'pharma', 'finance', 'healthcare'
    template_type VARCHAR NOT NULL, -- 'fda_social_media', 'ai_disclosure', 'custom'
    base_rules JSONB NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_timestamp ON admin_audit_log(timestamp);