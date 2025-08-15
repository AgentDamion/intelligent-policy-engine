-- Migration: 007_create_policy_distribution_system.sql
-- Description: Create Policy Distribution & Sync System tables and functions
-- Date: 2024-01-XX

-- Policy distribution tracking
CREATE TABLE IF NOT EXISTS policy_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  enterprise_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  agency_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  distribution_status VARCHAR(20) DEFAULT 'active' CHECK (distribution_status IN ('active', 'inactive', 'pending', 'expired')),
  distributed_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id),
  version_number INTEGER DEFAULT 1,
  is_current_version BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Policy compliance tracking
CREATE TABLE IF NOT EXISTS agency_policy_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_distribution_id UUID REFERENCES policy_distributions(id) ON DELETE CASCADE,
  agency_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  compliance_score INTEGER DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  last_assessment_date TIMESTAMP DEFAULT NOW(),
  violations_count INTEGER DEFAULT 0,
  compliance_status VARCHAR(20) DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'compliant', 'non_compliant', 'at_risk')),
  next_review_date TIMESTAMP,
  assessment_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Policy conflicts detection
CREATE TABLE IF NOT EXISTS policy_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  policy_a_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  policy_b_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  conflict_type VARCHAR(50) NOT NULL,
  conflict_description TEXT,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolution_status VARCHAR(20) DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'resolved', 'in_progress', 'ignored')),
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_policy_distributions_agency ON policy_distributions(agency_org_id);
CREATE INDEX IF NOT EXISTS idx_policy_distributions_enterprise ON policy_distributions(enterprise_org_id);
CREATE INDEX IF NOT EXISTS idx_policy_distributions_policy ON policy_distributions(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_distributions_status ON policy_distributions(distribution_status);
CREATE INDEX IF NOT EXISTS idx_policy_compliance_agency ON agency_policy_compliance(agency_org_id);
CREATE INDEX IF NOT EXISTS idx_policy_compliance_status ON agency_policy_compliance(compliance_status);
CREATE INDEX IF NOT EXISTS idx_policy_conflicts_agency ON policy_conflicts(agency_org_id);
CREATE INDEX IF NOT EXISTS idx_policy_conflicts_severity ON policy_conflicts(severity);
CREATE INDEX IF NOT EXISTS idx_policy_conflicts_status ON policy_conflicts(resolution_status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_policy_distributions_updated_at 
    BEFORE UPDATE ON policy_distributions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agency_policy_compliance_updated_at 
    BEFORE UPDATE ON agency_policy_compliance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_conflicts_updated_at 
    BEFORE UPDATE ON policy_conflicts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to detect policy conflicts
CREATE OR REPLACE FUNCTION detect_policy_conflicts_for_agency(agency_uuid UUID)
RETURNS TABLE(
    conflict_id UUID,
    policy_a_name VARCHAR,
    policy_b_name VARCHAR,
    conflict_type VARCHAR,
    conflict_description TEXT,
    severity VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id as conflict_id,
        pa.name as policy_a_name,
        pb.name as policy_b_name,
        pc.conflict_type,
        pc.conflict_description,
        pc.severity
    FROM policy_conflicts pc
    JOIN policies pa ON pc.policy_a_id = pa.id
    JOIN policies pb ON pc.policy_b_id = pb.id
    WHERE pc.agency_org_id = agency_uuid
    AND pc.resolution_status = 'unresolved'
    ORDER BY pc.severity DESC, pc.detected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get compliance summary for agency
CREATE OR REPLACE FUNCTION get_agency_compliance_summary(agency_uuid UUID)
RETURNS TABLE(
    total_policies INTEGER,
    compliant_policies INTEGER,
    non_compliant_policies INTEGER,
    at_risk_policies INTEGER,
    average_compliance_score NUMERIC,
    total_conflicts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT pd.policy_id)::INTEGER as total_policies,
        COUNT(DISTINCT CASE WHEN apc.compliance_status = 'compliant' THEN pd.policy_id END)::INTEGER as compliant_policies,
        COUNT(DISTINCT CASE WHEN apc.compliance_status = 'non_compliant' THEN pd.policy_id END)::INTEGER as non_compliant_policies,
        COUNT(DISTINCT CASE WHEN apc.compliance_status = 'at_risk' THEN pd.policy_id END)::INTEGER as at_risk_policies,
        AVG(apc.compliance_score)::NUMERIC as average_compliance_score,
        COUNT(DISTINCT pc.id)::INTEGER as total_conflicts
    FROM policy_distributions pd
    LEFT JOIN agency_policy_compliance apc ON pd.id = apc.policy_distribution_id
    LEFT JOIN policy_conflicts pc ON pc.agency_org_id = agency_uuid AND pc.resolution_status = 'unresolved'
    WHERE pd.agency_org_id = agency_uuid
    AND pd.distribution_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- View for policy distribution dashboard
CREATE OR REPLACE VIEW policy_distribution_dashboard AS
SELECT 
    pd.id as distribution_id,
    p.name as policy_name,
    p.description as policy_description,
    e.name as enterprise_name,
    a.name as agency_name,
    pd.distribution_status,
    pd.distributed_at,
    pd.acknowledged_at,
    u.name as acknowledged_by_name,
    apc.compliance_score,
    apc.compliance_status,
    apc.last_assessment_date,
    apc.violations_count
FROM policy_distributions pd
JOIN policies p ON pd.policy_id = p.id
JOIN organizations e ON pd.enterprise_org_id = e.id
JOIN organizations a ON pd.agency_org_id = a.id
LEFT JOIN agency_policy_compliance apc ON pd.id = apc.policy_distribution_id
LEFT JOIN users u ON pd.acknowledged_by = u.id
WHERE pd.distribution_status = 'active';

-- Insert sample data for testing
INSERT INTO policy_distributions (policy_id, enterprise_org_id, agency_org_id, distribution_status, version_number)
SELECT 
    p.id,
    e.id,
    a.id,
    'active',
    1
FROM policies p
CROSS JOIN organizations e
CROSS JOIN organizations a
WHERE e.type = 'enterprise' 
AND a.type = 'agency'
AND p.name LIKE '%AI%'
LIMIT 5;

-- Insert sample compliance data
INSERT INTO agency_policy_compliance (policy_distribution_id, agency_org_id, compliance_score, compliance_status, violations_count)
SELECT 
    pd.id,
    pd.agency_org_id,
    FLOOR(RANDOM() * 100)::INTEGER,
    CASE 
        WHEN RANDOM() > 0.7 THEN 'compliant'
        WHEN RANDOM() > 0.5 THEN 'at_risk'
        ELSE 'non_compliant'
    END,
    FLOOR(RANDOM() * 5)::INTEGER
FROM policy_distributions pd
WHERE pd.distribution_status = 'active';

-- Insert sample conflicts
INSERT INTO policy_conflicts (agency_org_id, policy_a_id, policy_b_id, conflict_type, conflict_description, severity)
SELECT 
    pd.agency_org_id,
    pd.policy_id,
    pd2.policy_id,
    'data_usage_conflict',
    'Conflicting data usage policies between clients',
    CASE 
        WHEN RANDOM() > 0.8 THEN 'critical'
        WHEN RANDOM() > 0.6 THEN 'high'
        WHEN RANDOM() > 0.4 THEN 'medium'
        ELSE 'low'
    END
FROM policy_distributions pd
JOIN policy_distributions pd2 ON pd.agency_org_id = pd2.agency_org_id 
    AND pd.policy_id != pd2.policy_id
WHERE pd.distribution_status = 'active'
AND pd2.distribution_status = 'active'
LIMIT 3; 