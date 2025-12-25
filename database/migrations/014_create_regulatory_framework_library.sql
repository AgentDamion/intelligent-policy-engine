-- Migration: Create Regulatory Framework Library
-- This migration adds comprehensive regulatory framework infrastructure
-- for regulation-agnostic governance and compliance mapping

-- ============================================
-- REGULATORY FRAMEWORK LIBRARY
-- Infrastructure layer for regulation-agnostic governance
-- ============================================

-- Regulatory Frameworks (Master Reference)
CREATE TABLE IF NOT EXISTS regulatory_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "NY Synthetic Performer Disclosure Law"
  short_name TEXT NOT NULL,              -- "NY_S.8420-A" (for API references)
  jurisdiction TEXT NOT NULL,            -- "US-NY", "EU", "US-Federal"
  regulatory_body TEXT,                  -- "NY State Legislature", "European Commission"
  framework_type TEXT NOT NULL,          -- "disclosure", "transparency", "audit", "data_protection"
  effective_date DATE,
  enforcement_date DATE,
  status TEXT NOT NULL DEFAULT 'enacted', -- "proposed", "enacted", "enforced", "superseded"
  summary TEXT,
  source_url TEXT,
  related_frameworks UUID[],             -- Array of framework IDs that relate
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jurisdiction, short_name)
);

-- Framework Requirements (What each framework mandates)
CREATE TABLE IF NOT EXISTS framework_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL,        -- "disclosure", "audit_trail", "consent", "documentation", "classification"
  requirement_code TEXT,                 -- "S.8420-A §2(a)" or "DSA Art. 39"
  description TEXT NOT NULL,
  applicability_criteria JSONB,          -- {"content_type": "synthetic_performer", "distribution": "advertising", "region": ["NY"]}
  compliance_evidence JSONB,             -- What AICOMPLYR needs to capture to prove compliance
  penalty_info TEXT,                     -- Penalty details for non-compliance
  priority TEXT DEFAULT 'medium',        -- "low", "medium", "high", "critical"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Framework-to-Policy-Template Mappings
CREATE TABLE IF NOT EXISTS framework_policy_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  policy_template_id UUID NOT NULL REFERENCES policy_templates_enhanced(id) ON DELETE CASCADE,
  mapping_notes TEXT,
  coverage_percentage INTEGER,           -- 0-100: How much of the framework this template addresses
  requirements_covered UUID[],           -- Array of framework_requirements.id that this template covers
  requirements_partial UUID[],          -- Array of requirements partially covered
  requirements_missing UUID[],           -- Array of requirements not covered
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(framework_id, policy_template_id)
);

-- Organization Framework Selections (Which frameworks apply to each org)
CREATE TABLE IF NOT EXISTS organization_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations_enhanced(id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES regulatory_frameworks(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  selected_by UUID REFERENCES users_enhanced(id),
  notes TEXT,
  UNIQUE(organization_id, framework_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_regulatory_frameworks_jurisdiction ON regulatory_frameworks(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_regulatory_frameworks_type ON regulatory_frameworks(framework_type);
CREATE INDEX IF NOT EXISTS idx_regulatory_frameworks_status ON regulatory_frameworks(status);
CREATE INDEX IF NOT EXISTS idx_regulatory_frameworks_short_name ON regulatory_frameworks(short_name);
CREATE INDEX IF NOT EXISTS idx_framework_requirements_framework ON framework_requirements(framework_id);
CREATE INDEX IF NOT EXISTS idx_framework_requirements_type ON framework_requirements(requirement_type);
CREATE INDEX IF NOT EXISTS idx_framework_policy_mappings_framework ON framework_policy_mappings(framework_id);
CREATE INDEX IF NOT EXISTS idx_framework_policy_mappings_template ON framework_policy_mappings(policy_template_id);
CREATE INDEX IF NOT EXISTS idx_organization_frameworks_org ON organization_frameworks(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_frameworks_framework ON organization_frameworks(framework_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_regulatory_frameworks_updated_at 
  BEFORE UPDATE ON regulatory_frameworks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_framework_requirements_updated_at 
  BEFORE UPDATE ON framework_requirements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Priority Frameworks for Launch
-- ============================================

-- NY Synthetic Performer Disclosure Law (December 2024)
INSERT INTO regulatory_frameworks (name, short_name, jurisdiction, regulatory_body, framework_type, effective_date, enforcement_date, status, summary, source_url) VALUES
('NY Synthetic Performer Disclosure Law', 'NY_S.8420-A', 'US-NY', 'NY State Legislature', 'disclosure', '2024-12-01', '2026-06-01', 'enacted',
 'Requires conspicuous disclosure when advertisements contain AI-generated human likenesses. Applies to ads distributed in New York.',
 'https://legislation.nysenate.gov/')
ON CONFLICT (jurisdiction, short_name) DO NOTHING;

-- EU Digital Services Act
INSERT INTO regulatory_frameworks (name, short_name, jurisdiction, regulatory_body, framework_type, effective_date, enforcement_date, status, summary, source_url) VALUES
('EU Digital Services Act', 'EU_DSA', 'EU', 'European Commission', 'transparency', '2024-02-17', '2024-02-17', 'enforced',
 'Mandates transparency in online advertising, including ad repositories and audit trails. First enforcement: €120M fine against X (Dec 2024).',
 'https://digital-markets-act.ec.europa.eu/')
ON CONFLICT (jurisdiction, short_name) DO NOTHING;

-- EU AI Act
INSERT INTO regulatory_frameworks (name, short_name, jurisdiction, regulatory_body, framework_type, effective_date, enforcement_date, status, summary, source_url) VALUES
('EU AI Act', 'EU_AI_ACT', 'EU', 'European Commission', 'classification', '2024-06-01', '2024-08-01', 'enforced',
 'Risk-based AI governance framework requiring transparency, documentation, and human oversight for high-risk AI systems.',
 'https://artificial-intelligence-act.ec.europa.eu/')
ON CONFLICT (jurisdiction, short_name) DO NOTHING;

-- FDA 21 CFR Part 11
INSERT INTO regulatory_frameworks (name, short_name, jurisdiction, regulatory_body, framework_type, effective_date, enforcement_date, status, summary, source_url) VALUES
('FDA 21 CFR Part 11', 'FDA_21CFR11', 'US-Federal', 'FDA', 'audit', '1997-08-20', '1997-08-20', 'enforced',
 'Electronic records and signatures regulation. Requires immutable audit trails, access controls, and system validation.',
 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application')
ON CONFLICT (jurisdiction, short_name) DO NOTHING;

-- GDPR (AI Processing)
INSERT INTO regulatory_frameworks (name, short_name, jurisdiction, regulatory_body, framework_type, effective_date, enforcement_date, status, summary, source_url) VALUES
('GDPR - AI Processing', 'GDPR_AI', 'EU', 'European Commission', 'data_protection', '2018-05-25', '2018-05-25', 'enforced',
 'Data protection regulation with specific requirements for automated decision-making and AI processing of personal data.',
 'https://gdpr.eu/')
ON CONFLICT (jurisdiction, short_name) DO NOTHING;

-- FTC AI Guidelines
INSERT INTO regulatory_frameworks (name, short_name, jurisdiction, regulatory_body, framework_type, effective_date, enforcement_date, status, summary, source_url) VALUES
('FTC AI Guidelines', 'FTC_AI', 'US-Federal', 'FTC', 'disclosure', NULL, NULL, 'proposed',
 'Guidelines for AI transparency, fairness, and disclosure in advertising and consumer-facing applications.',
 'https://www.ftc.gov/business-guidance/resources/artificial-intelligence-ai')
ON CONFLICT (jurisdiction, short_name) DO NOTHING;

-- California CPRA (AI provisions)
INSERT INTO regulatory_frameworks (name, short_name, jurisdiction, regulatory_body, framework_type, effective_date, enforcement_date, status, summary, source_url) VALUES
('California CPRA - AI Provisions', 'CA_CPRA_AI', 'US-CA', 'California Legislature', 'transparency', '2023-01-01', '2023-01-01', 'enforced',
 'California Privacy Rights Act provisions requiring transparency in automated decision-making and AI processing.',
 'https://oag.ca.gov/privacy/ccpa')
ON CONFLICT (jurisdiction, short_name) DO NOTHING;

-- Framework Requirements for NY S.8420-A
DO $$
DECLARE
  ny_framework_id UUID;
BEGIN
  SELECT id INTO ny_framework_id FROM regulatory_frameworks WHERE short_name = 'NY_S.8420-A';
  
  IF ny_framework_id IS NOT NULL THEN
    INSERT INTO framework_requirements (framework_id, requirement_type, requirement_code, description, applicability_criteria, compliance_evidence, penalty_info, priority) VALUES
    (ny_framework_id, 'disclosure', 'S.8420-A §2(a)', 
     'Conspicuous disclosure required when advertisement contains AI-generated human likeness',
     '{"content_type": "synthetic_performer", "distribution": "advertising", "region": ["NY"]}'::jsonb,
     '{"disclosure_attestation": true, "ai_tool_classification": true, "distribution_metadata": true}'::jsonb,
     '$1,000-$5,000 per violation',
     'high')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Framework Requirements for EU DSA
DO $$
DECLARE
  dsa_framework_id UUID;
BEGIN
  SELECT id INTO dsa_framework_id FROM regulatory_frameworks WHERE short_name = 'EU_DSA';
  
  IF dsa_framework_id IS NOT NULL THEN
    INSERT INTO framework_requirements (framework_id, requirement_type, requirement_code, description, applicability_criteria, compliance_evidence, penalty_info, priority) VALUES
    (dsa_framework_id, 'transparency', 'DSA Art. 39', 
     'Transparent advertising repository with accessible audit trails',
     '{"distribution": "online_advertising", "region": ["EU"]}'::jsonb,
     '{"ad_repository": true, "audit_trail": true, "researcher_access": true}'::jsonb,
     'Up to 6% of annual revenue',
     'high'),
    (dsa_framework_id, 'audit_trail', 'DSA Art. 40', 
     'Maintain detailed records of advertising transactions and decisions',
     '{"distribution": "online_advertising", "region": ["EU"]}'::jsonb,
     '{"immutable_logs": true, "transaction_records": true, "decision_documentation": true}'::jsonb,
     'Up to 6% of annual revenue',
     'high')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Framework Requirements for FDA 21 CFR Part 11
DO $$
DECLARE
  fda_framework_id UUID;
BEGIN
  SELECT id INTO fda_framework_id FROM regulatory_frameworks WHERE short_name = 'FDA_21CFR11';
  
  IF fda_framework_id IS NOT NULL THEN
    INSERT INTO framework_requirements (framework_id, requirement_type, requirement_code, description, applicability_criteria, compliance_evidence, penalty_info, priority) VALUES
    (fda_framework_id, 'audit_trail', '21 CFR 11.10(e)', 
     'System must maintain secure, computer-generated, time-stamped audit trails',
     '{"industry": "pharmaceutical", "record_type": "electronic"}'::jsonb,
     '{"immutable_audit_logs": true, "timestamp_verification": true, "user_identification": true}'::jsonb,
     'Warning letters, product seizures, injunctions',
     'critical'),
    (fda_framework_id, 'documentation', '21 CFR 11.10(a)', 
     'Validation of systems to ensure accuracy, reliability, and consistent intended performance',
     '{"industry": "pharmaceutical", "system_type": "electronic"}'::jsonb,
     '{"system_validation": true, "documentation": true, "testing_records": true}'::jsonb,
     'Warning letters, product seizures, injunctions',
     'critical')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create rollback migration tracking
CREATE TABLE IF NOT EXISTS migration_rollback_014 (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) DEFAULT '014_create_regulatory_framework_library',
    applied_at TIMESTAMP DEFAULT NOW(),
    can_rollback BOOLEAN DEFAULT true
);

INSERT INTO migration_rollback_014 (migration_name) VALUES ('014_create_regulatory_framework_library');

