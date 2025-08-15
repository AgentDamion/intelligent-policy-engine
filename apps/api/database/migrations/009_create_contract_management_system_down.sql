-- Migration Rollback: Drop Contract Management System
-- This migration removes all contract management tables and related objects
-- Tables are dropped in reverse dependency order to avoid foreign key constraint violations

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS trigger_billing_accounts_updated_at ON billing_accounts;
DROP TRIGGER IF EXISTS trigger_contracts_updated_at ON contracts;

-- Drop functions
DROP FUNCTION IF EXISTS update_contract_modified_time();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS budget_snapshots;
DROP TABLE IF EXISTS invoice_line_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS usage_events;
DROP TABLE IF EXISTS billing_accounts;
DROP TABLE IF EXISTS cost_centers;
DROP TABLE IF EXISTS contract_approvals;
DROP TABLE IF EXISTS contract_amendments;
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS contract_templates;

-- Drop rollback tracking table
DROP TABLE IF EXISTS migration_rollback_009;
