-- Performance Indexes for Common Query Patterns
-- File: database/migrations/012_add_performance_indexes.sql
-- This migration adds composite indexes for optimized query performance

-- ===== POLICIES TABLE INDEXES =====

-- Composite index for enterprise policies ordered by creation date
CREATE INDEX IF NOT EXISTS idx_policies_enterprise_created 
    ON policies(enterprise_id, created_at DESC) 
    WHERE is_active = true;

-- Composite index for agency seat policies
CREATE INDEX IF NOT EXISTS idx_policies_seat_created 
    ON policies(agency_seat_id, created_at DESC) 
    WHERE is_active = true AND agency_seat_id IS NOT NULL;

-- ===== USER CONTEXTS TABLE INDEXES =====

-- Composite index for active user contexts by enterprise
CREATE INDEX IF NOT EXISTS idx_user_contexts_user_enterprise_active 
    ON user_contexts(user_id, enterprise_id, is_active) 
    WHERE is_active = true;

-- Composite index for user contexts with role filtering
CREATE INDEX IF NOT EXISTS idx_user_contexts_user_role_active 
    ON user_contexts(user_id, role, is_active) 
    WHERE is_active = true;

-- ===== PARTNER-ENTERPRISE RELATIONSHIPS INDEXES =====

-- Composite index for partner-client relationships with status
CREATE INDEX IF NOT EXISTS idx_partner_relationships_partner_client_status 
    ON partner_enterprise_relationships(partner_enterprise_id, client_enterprise_id, relationship_status)
    WHERE relationship_status = 'active';

-- Index for finding all clients of a partner
CREATE INDEX IF NOT EXISTS idx_partner_relationships_partner_active 
    ON partner_enterprise_relationships(partner_enterprise_id, relationship_status)
    WHERE relationship_status = 'active';

-- Index for finding all partners of a client
CREATE INDEX IF NOT EXISTS idx_partner_relationships_client_active 
    ON partner_enterprise_relationships(client_enterprise_id, relationship_status)
    WHERE relationship_status = 'active';

-- ===== PARTNER-CLIENT CONTEXTS INDEXES =====

-- Composite index for partner-client contexts
CREATE INDEX IF NOT EXISTS idx_partner_client_contexts_user_partner_client 
    ON partner_client_contexts(user_id, partner_enterprise_id, client_enterprise_id, is_active)
    WHERE is_active = true;

-- Index for finding all clients for a partner user
CREATE INDEX IF NOT EXISTS idx_partner_client_contexts_user_partner 
    ON partner_client_contexts(user_id, partner_enterprise_id, is_active)
    WHERE is_active = true;

-- ===== AUDIT LOG INDEXES =====

-- Composite index for audit logs by enterprise and date
CREATE INDEX IF NOT EXISTS idx_context_audit_log_enterprise_created 
    ON context_audit_log(context_id, created_at DESC);

-- Index for audit logs by action type
CREATE INDEX IF NOT EXISTS idx_context_audit_log_action_created 
    ON context_audit_log(action, created_at DESC);

-- ===== ENTERPRISES TABLE INDEXES =====

-- Index for enterprises by type and subscription tier
CREATE INDEX IF NOT EXISTS idx_enterprises_type_tier 
    ON enterprises(type, subscription_tier, subscription_status)
    WHERE subscription_status = 'active';

-- ===== AGENCY SEATS TABLE INDEXES =====

-- Composite index for active agency seats by enterprise
CREATE INDEX IF NOT EXISTS idx_agency_seats_enterprise_active 
    ON agency_seats(enterprise_id, is_active)
    WHERE is_active = true;

-- ===== SESSIONS TABLE INDEXES =====

-- Composite index for active sessions by user and expiration
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active_expires 
    ON user_sessions(user_id, is_active, expires_at)
    WHERE is_active = true;

-- ===== COMMENTS =====

COMMENT ON INDEX idx_policies_enterprise_created IS 'Optimizes queries for enterprise policies ordered by creation date';
COMMENT ON INDEX idx_user_contexts_user_enterprise_active IS 'Optimizes queries for active user contexts by enterprise';
COMMENT ON INDEX idx_partner_relationships_partner_client_status IS 'Optimizes queries for active partner-client relationships';

