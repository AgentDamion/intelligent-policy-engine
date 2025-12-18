-- Migration: Rollback AuditPremium Tables
-- Description: Drops the database schema for the enhanced audit logging system
-- Author: AIComplyr Team
-- Date: 2024

-- Drop views first
DROP VIEW IF EXISTS audit_entry_chains;
DROP VIEW IF EXISTS audit_session_summaries;

-- Drop triggers
DROP TRIGGER IF EXISTS update_session_summary_trigger ON audit_entries;
DROP TRIGGER IF EXISTS update_audit_chains_updated_at ON audit_chains;
DROP TRIGGER IF EXISTS update_audit_sessions_updated_at ON audit_sessions;

-- Drop functions
DROP FUNCTION IF EXISTS update_session_summary();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order (due to foreign key constraints)
DROP TABLE IF EXISTS audit_policy_references;
DROP TABLE IF EXISTS audit_chains;
DROP TABLE IF EXISTS audit_entries;
DROP TABLE IF EXISTS audit_sessions;

-- Note: We don't drop the uuid-ossp extension as it might be used by other parts of the system
-- If you want to drop it, uncomment the following line:
-- DROP EXTENSION IF EXISTS "uuid-ossp"; 