-- Migration: Create Contract Management System
-- This migration adds comprehensive contract management capabilities
-- including contract templates, contracts, amendments, approvals, financial operations,
-- usage tracking, purchase orders, invoices, and budget management

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

-- Contract Amendments
CREATE TABLE IF NOT EXISTS contract_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  amendment_number INTEGER NOT NULL,
  amendment_type VARCHAR(50), -- extension, value_change, scope_change, termination
  description TEXT NOT NULL,
  effective_date DATE NOT NULL,
  value_change DECIMAL(15,2),
  new_expiration_date DATE,
  document_url TEXT,
  approved_by UUID REFERENCES users_enhanced(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contract Approvals Workflow
CREATE TABLE IF NOT EXISTS contract_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  approver_id UUID REFERENCES users_enhanced(id),
  approval_type VARCHAR(50), -- legal, business, procurement, security, compliance
  approval_order INTEGER, -- sequence of approvals
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, delegated
  comments TEXT,
  conditions JSONB, -- conditions for approval
  approved_at TIMESTAMP,
  deadline TIMESTAMP,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Financial Operations Schema
CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  cost_center_code VARCHAR(50) UNIQUE NOT NULL,
  cost_center_name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  business_unit VARCHAR(100),
  manager_id UUID REFERENCES users_enhanced(id),
  budget_owner_id UUID REFERENCES users_enhanced(id),
  parent_cost_center_id UUID REFERENCES cost_centers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  account_name VARCHAR(255) NOT NULL,
  account_code VARCHAR(50) UNIQUE,
  
  -- Billing Configuration
  billing_model VARCHAR(50) DEFAULT 'usage', -- usage, subscription, hybrid, fixed
  billing_frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, annually
  currency VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(50) DEFAULT 'NET30',
  
  -- Budget Management
  annual_budget DECIMAL(15,2),
  quarterly_budget DECIMAL(15,2),
  monthly_budget DECIMAL(15,2),
  current_period_budget DECIMAL(15,2),
  budget_period_start DATE,
  budget_period_end DATE,
  
  -- Approval Workflows
  approval_threshold DECIMAL(15,2) DEFAULT 10000,
  requires_po BOOLEAN DEFAULT true,
  auto_approval_limit DECIMAL(15,2) DEFAULT 1000,
  
  -- Alerts and Controls
  budget_alert_threshold INTEGER DEFAULT 80, -- percentage
  budget_freeze_threshold INTEGER DEFAULT 95,
  overspend_allowed BOOLEAN DEFAULT false,
  
  -- Contact Information
  billing_contact_id UUID REFERENCES users_enhanced(id),
  finance_approver_id UUID REFERENCES users_enhanced(id),
  
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, closed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage Events and Metering
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  billing_account_id UUID REFERENCES billing_accounts(id),
  user_id UUID REFERENCES users_enhanced(id),
  
  -- Tool/Service Information
  service_name VARCHAR(255), -- AI tool name
  service_category VARCHAR(100), -- nlp, image_generation, data_analysis
  service_tier VARCHAR(50), -- basic, premium, enterprise
  
  -- Usage Metrics
  event_type VARCHAR(100), -- api_call, compute_hours, storage_gb, tokens_processed
  quantity DECIMAL(12,4) NOT NULL,
  unit_of_measure VARCHAR(50), -- calls, hours, gb, tokens
  unit_price DECIMAL(10,4),
  
  -- Cost Calculation
  base_cost DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2),
  
  -- Context and Metadata
  project_code VARCHAR(100),
  task_description TEXT,
  metadata JSONB, -- detailed context about usage
  
  -- Timing
  usage_timestamp TIMESTAMP DEFAULT NOW(),
  billing_period VARCHAR(7), -- YYYY-MM format
  
  -- Processing Status
  processed BOOLEAN DEFAULT false,
  invoice_id UUID, -- will reference invoices table
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  billing_account_id UUID REFERENCES billing_accounts(id),
  
  po_number VARCHAR(100) UNIQUE NOT NULL,
  po_type VARCHAR(50) DEFAULT 'standard', -- standard, blanket, contract
  
  -- Amounts
  total_amount DECIMAL(15,2) NOT NULL,
  committed_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Dates
  po_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  
  -- Approval
  status VARCHAR(50) DEFAULT 'draft', -- draft, pending_approval, approved, closed, cancelled
  requested_by UUID REFERENCES users_enhanced(id),
  approved_by UUID REFERENCES users_enhanced(id),
  approval_date DATE,
  
  -- Details
  description TEXT,
  terms_and_conditions TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations_enhanced(id),
  billing_account_id UUID REFERENCES billing_accounts(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  
  -- Invoice Identification
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  external_invoice_id VARCHAR(100), -- vendor's invoice number
  
  -- Billing Period
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  billing_month VARCHAR(7), -- YYYY-MM
  
  -- Amounts
  subtotal DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status and Dates
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, approved, paid, overdue, disputed, cancelled
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_date DATE,
  payment_reference VARCHAR(255),
  
  -- Document Management
  pdf_url TEXT,
  payment_method VARCHAR(50),
  
  -- Processing
  auto_generated BOOLEAN DEFAULT true,
  reviewed_by UUID REFERENCES users_enhanced(id),
  approved_by UUID REFERENCES users_enhanced(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  service_category VARCHAR(100),
  
  -- Quantities and Rates
  quantity DECIMAL(12,4),
  unit_of_measure VARCHAR(50),
  unit_price DECIMAL(10,4),
  line_total DECIMAL(10,2),
  
  -- Reference to Usage
  usage_event_ids JSONB, -- array of usage_event IDs
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Budget Tracking and Forecasting
CREATE TABLE IF NOT EXISTS budget_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID REFERENCES billing_accounts(id),
  snapshot_date DATE DEFAULT CURRENT_DATE,
  
  -- Budget vs Actual
  budget_amount DECIMAL(15,2),
  actual_spend DECIMAL(15,2),
  committed_amount DECIMAL(15,2),
  forecasted_spend DECIMAL(15,2),
  
  -- Variance Analysis
  variance_amount DECIMAL(15,2),
  variance_percentage DECIMAL(5,2),
  
  -- Period Information
  period_type VARCHAR(20), -- monthly, quarterly, annual
  period_start DATE,
  period_end DATE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_contracts_organization_status ON contracts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_expiration ON contracts(expiration_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_contract_approvals_pending ON contract_approvals(approver_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_usage_events_billing_period ON usage_events(billing_account_id, billing_period);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_timestamp ON usage_events(user_id, usage_timestamp);
CREATE INDEX IF NOT EXISTS idx_invoices_billing_account_status ON invoices(billing_account_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status IN ('sent', 'overdue');
CREATE INDEX IF NOT EXISTS idx_billing_accounts_cost_center ON billing_accounts(cost_center_id, status);
CREATE INDEX IF NOT EXISTS idx_contract_templates_organization ON contract_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_amendments_contract ON contract_amendments(contract_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_organization ON cost_centers(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_billing_account ON purchase_orders(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_budget_snapshots_billing_account ON budget_snapshots(billing_account_id);

-- Create Triggers for Automatic Updates
CREATE OR REPLACE FUNCTION update_contract_modified_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_modified_time();

CREATE TRIGGER trigger_billing_accounts_updated_at
  BEFORE UPDATE ON billing_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_modified_time();

CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_modified_time();

-- Sample Data for Testing
INSERT INTO contract_templates (organization_id, template_name, contract_type, legal_framework, standard_terms) VALUES
(
  (SELECT id FROM organizations_enhanced LIMIT 1),
  'Standard MSA - Technology Services',
  'MSA',
  'US_Commercial',
  '{"liability_cap": 1000000, "data_protection": true, "termination_notice_days": 30}'
),
(
  (SELECT id FROM organizations_enhanced LIMIT 1),
  'Data Processing Agreement - GDPR',
  'DPA',
  'GDPR',
  '{"data_residency": "EU", "processor_obligations": true, "breach_notification_hours": 72}'
);

-- Create rollback tracking table
CREATE TABLE IF NOT EXISTS migration_rollback_009 (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW(),
  rollback_applied BOOLEAN DEFAULT false,
  rollback_applied_at TIMESTAMP
);

INSERT INTO migration_rollback_009 (migration_name) VALUES ('009_create_contract_management_system');
