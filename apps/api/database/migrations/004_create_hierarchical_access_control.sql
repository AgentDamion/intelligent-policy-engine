-- Enhanced Multi-Tenant Access Control Schema
-- File: database/migrations/004_create_hierarchical_access_control.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== ENTERPRISE MANAGEMENT =====

-- Enterprises (replaces organizations for clarity)
CREATE TABLE IF NOT EXISTS enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) CHECK (type IN ('pharma', 'agency', 'partner', 'other')) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'standard',
    subscription_status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agency Seats (managed workspaces within enterprises)
CREATE TABLE IF NOT EXISTS agency_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    seat_type VARCHAR(50) DEFAULT 'standard',
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(enterprise_id, slug)
);

-- ===== USER MANAGEMENT =====

-- Enhanced Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Contexts (multi-context user management)
CREATE TABLE IF NOT EXISTS user_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    agency_seat_id UUID REFERENCES agency_seats(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'enterprise_owner', 
        'enterprise_admin', 
        'seat_admin', 
        'seat_user',
        'platform_super_admin'
    )),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    last_accessed TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, enterprise_id, agency_seat_id)
);

-- ===== PERMISSION SYSTEM =====

-- Permission definitions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT true,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- ===== CONTEXT-AWARE SESSIONS =====

-- User sessions with context
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    context_id UUID NOT NULL REFERENCES user_contexts(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== AUDIT TRAIL =====

-- Context-aware audit log
CREATE TABLE IF NOT EXISTS context_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    context_id UUID NOT NULL REFERENCES user_contexts(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== POLICY MANAGEMENT =====

-- Enhanced policies with enterprise/seat hierarchy
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    agency_seat_id UUID REFERENCES agency_seats(id) ON DELETE CASCADE,
    policy_type VARCHAR(50) NOT NULL,
    version INTEGER DEFAULT 1,
    rules JSONB NOT NULL,
    risk_profiles JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Policy assignments to seats
CREATE TABLE IF NOT EXISTS seat_policy_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_seat_id UUID NOT NULL REFERENCES agency_seats(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    assignment_type VARCHAR(50) DEFAULT 'inherited', -- 'inherited', 'direct', 'override'
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(agency_seat_id, policy_id)
);

-- ===== INDEXES FOR PERFORMANCE =====

-- User contexts indexes
CREATE INDEX idx_user_contexts_user_id ON user_contexts(user_id);
CREATE INDEX idx_user_contexts_enterprise_id ON user_contexts(enterprise_id);
CREATE INDEX idx_user_contexts_agency_seat_id ON user_contexts(agency_seat_id);
CREATE INDEX idx_user_contexts_role ON user_contexts(role);
CREATE INDEX idx_user_contexts_active ON user_contexts(is_active);

-- Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Audit log indexes
CREATE INDEX idx_context_audit_log_user_id ON context_audit_log(user_id);
CREATE INDEX idx_context_audit_log_context_id ON context_audit_log(context_id);
CREATE INDEX idx_context_audit_log_action ON context_audit_log(action);
CREATE INDEX idx_context_audit_log_created_at ON context_audit_log(created_at);

-- Policy indexes
CREATE INDEX idx_policies_enterprise_id ON policies(enterprise_id);
CREATE INDEX idx_policies_agency_seat_id ON policies(agency_seat_id);
CREATE INDEX idx_policies_type ON policies(policy_type);
CREATE INDEX idx_policies_active ON policies(is_active);

-- Seat policy assignments indexes
CREATE INDEX idx_seat_policy_assignments_seat_id ON seat_policy_assignments(agency_seat_id);
CREATE INDEX idx_seat_policy_assignments_policy_id ON seat_policy_assignments(policy_id);
CREATE INDEX idx_seat_policy_assignments_active ON seat_policy_assignments(is_active);

-- ===== CONSTRAINTS =====

-- Ensure context hierarchy is valid
ALTER TABLE user_contexts ADD CONSTRAINT check_context_hierarchy 
    CHECK (
        (agency_seat_id IS NULL AND role IN ('enterprise_owner', 'enterprise_admin', 'platform_super_admin')) OR
        (agency_seat_id IS NOT NULL AND role IN ('seat_admin', 'seat_user'))
    );

-- Ensure only one default context per user
ALTER TABLE user_contexts ADD CONSTRAINT unique_default_per_user 
    UNIQUE (user_id, is_default) WHERE is_default = true;

-- ===== COMMENTS =====

COMMENT ON TABLE enterprises IS 'Top-level organizations that manage agency seats';
COMMENT ON TABLE agency_seats IS 'Managed workspaces within enterprises';
COMMENT ON TABLE user_contexts IS 'Multi-context user roles and permissions';
COMMENT ON TABLE user_sessions IS 'Active user sessions with context awareness';
COMMENT ON TABLE context_audit_log IS 'Audit trail for all context-aware actions';
COMMENT ON TABLE policies IS 'Policies that can be assigned to enterprises or seats';
COMMENT ON TABLE seat_policy_assignments IS 'Policy assignments to specific agency seats'; 