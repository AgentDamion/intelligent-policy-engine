-- Rollback: Remove audit_policy_references and audit_chains tables

-- Drop indexes first
DROP INDEX IF EXISTS idx_audit_chains_chain_id;
DROP INDEX IF EXISTS idx_audit_chains_root_entry;
DROP INDEX IF EXISTS idx_audit_chains_session_id;
DROP INDEX IF EXISTS idx_audit_policy_references_compliance;
DROP INDEX IF EXISTS idx_audit_policy_references_policy_id;
DROP INDEX IF EXISTS idx_audit_policy_references_entry_id;

-- Drop tables (CASCADE will handle foreign key constraints)
DROP TABLE IF EXISTS audit_chains CASCADE;
DROP TABLE IF EXISTS audit_policy_references CASCADE;