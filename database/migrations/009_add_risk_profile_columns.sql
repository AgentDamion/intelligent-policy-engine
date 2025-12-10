-- Migration: Add Risk Profile Taxonomy Columns
-- Adds risk profile tier tracking and dimension scores to existing tables

-- Add columns to policy_templates_enhanced
ALTER TABLE policy_templates_enhanced 
  ADD COLUMN IF NOT EXISTS risk_profile_tier VARCHAR(50),
  ADD COLUMN IF NOT EXISTS audit_checklist_base JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS audit_checklist_specific JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS control_requirements JSONB DEFAULT '{}';

-- Add index for risk profile tier lookups
CREATE INDEX IF NOT EXISTS idx_policy_templates_risk_profile 
  ON policy_templates_enhanced(risk_profile_tier);

-- Add columns to policies_enhanced
ALTER TABLE policies_enhanced
  ADD COLUMN IF NOT EXISTS risk_profile_tier VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dimension_scores JSONB DEFAULT '{}';

-- Add index for policies risk profile
CREATE INDEX IF NOT EXISTS idx_policies_risk_profile 
  ON policies_enhanced(risk_profile_tier);

-- Add columns to audit_logs_enhanced (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs_enhanced') THEN
    ALTER TABLE audit_logs_enhanced
      ADD COLUMN IF NOT EXISTS risk_profile_tier VARCHAR(50),
      ADD COLUMN IF NOT EXISTS dimension_scores JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS audit_checklist_required JSONB DEFAULT '[]';
    
    CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_profile 
      ON audit_logs_enhanced(risk_profile_tier);
  END IF;
END $$;

-- Create risk profile assessment history table
CREATE TABLE IF NOT EXISTS risk_profile_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255),
  risk_profile_tier VARCHAR(50) NOT NULL,
  aggregate_score INTEGER NOT NULL, -- 0-100
  dimension_scores JSONB NOT NULL,
  assessment_rationale TEXT,
  recommended_controls JSONB DEFAULT '[]',
  audit_requirements JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  assessed_at TIMESTAMP DEFAULT NOW(),
  assessed_by VARCHAR(100) DEFAULT 'RiskProfileTaxonomyAgent'
);

-- Add indexes for risk profile assessments
CREATE INDEX IF NOT EXISTS idx_risk_assessments_tool 
  ON risk_profile_assessments(tool_name);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_tier 
  ON risk_profile_assessments(risk_profile_tier);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_date 
  ON risk_profile_assessments(assessed_at DESC);

-- Add comments for documentation
COMMENT ON TABLE risk_profile_assessments IS 'Stores historical risk profile assessments from the RiskProfileTaxonomyAgent';
COMMENT ON COLUMN risk_profile_assessments.risk_profile_tier IS 'Risk tier: minimal, low, medium, high, critical';
COMMENT ON COLUMN risk_profile_assessments.aggregate_score IS 'Weighted aggregate score across all 6 dimensions (0-100)';
COMMENT ON COLUMN risk_profile_assessments.dimension_scores IS 'Individual scores for each of 6 NIST dimensions';

-- Create view for latest assessments by tool
CREATE OR REPLACE VIEW latest_risk_assessments AS
SELECT DISTINCT ON (tool_name) 
  id,
  tool_name,
  vendor_name,
  risk_profile_tier,
  aggregate_score,
  dimension_scores,
  assessed_at
FROM risk_profile_assessments
ORDER BY tool_name, assessed_at DESC;

COMMENT ON VIEW latest_risk_assessments IS 'Most recent risk assessment for each tool';












