-- Rollback Migration: Drop Policy Management System
-- This migration removes all tables and objects created in migration 008

-- Drop triggers first
DROP TRIGGER IF EXISTS update_organizations_enhanced_updated_at ON organizations_enhanced;
DROP TRIGGER IF EXISTS update_users_enhanced_updated_at ON users_enhanced;
DROP TRIGGER IF EXISTS update_policy_templates_enhanced_updated_at ON policy_templates_enhanced;
DROP TRIGGER IF EXISTS update_policies_enhanced_updated_at ON policies_enhanced;
DROP TRIGGER IF EXISTS update_policy_rules_updated_at ON policy_rules;
DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
DROP TRIGGER IF EXISTS update_policy_distributions_updated_at ON policy_distributions;
DROP TRIGGER IF EXISTS update_compliance_violations_updated_at ON compliance_violations;
DROP TRIGGER IF EXISTS update_compliance_checks_updated_at ON compliance_checks;
DROP TRIGGER IF EXISTS update_policy_workflows_updated_at ON policy_workflows;
DROP TRIGGER IF EXISTS update_workflow_instances_updated_at ON workflow_instances;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_policies_enhanced_organization;
DROP INDEX IF EXISTS idx_policies_enhanced_status;
DROP INDEX IF EXISTS idx_policy_rules_policy;
DROP INDEX IF EXISTS idx_policy_rules_type;
DROP INDEX IF EXISTS idx_audit_logs_enhanced_org_time;
DROP INDEX IF EXISTS idx_audit_logs_enhanced_action;
DROP INDEX IF EXISTS idx_partners_organization;
DROP INDEX IF EXISTS idx_partners_status;
DROP INDEX IF EXISTS idx_policy_distributions_policy;
DROP INDEX IF EXISTS idx_policy_distributions_partner;
DROP INDEX IF EXISTS idx_policy_distributions_status;
DROP INDEX IF EXISTS idx_compliance_violations_org;
DROP INDEX IF EXISTS idx_compliance_violations_severity;
DROP INDEX IF EXISTS idx_compliance_checks_org;
DROP INDEX IF EXISTS idx_compliance_checks_status;
DROP INDEX IF EXISTS idx_workflow_instances_org;
DROP INDEX IF EXISTS idx_workflow_instances_status;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS workflow_instances;
DROP TABLE IF EXISTS policy_workflows;
DROP TABLE IF EXISTS compliance_checks;
DROP TABLE IF EXISTS audit_logs_enhanced;
DROP TABLE IF EXISTS compliance_violations;
DROP TABLE IF EXISTS policy_distributions;
DROP TABLE IF EXISTS partners;
DROP TABLE IF EXISTS policy_rules;
DROP TABLE IF EXISTS policies_enhanced;
DROP TABLE IF EXISTS policy_templates_enhanced;
DROP TABLE IF EXISTS users_enhanced;
DROP TABLE IF EXISTS organizations_enhanced;

-- Drop rollback tracking table
DROP TABLE IF EXISTS migration_rollback_008;
