-- Meta-Loop: Compliance Events Table
CREATE TABLE IF NOT EXISTS compliance_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    domain VARCHAR(32) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    privacy_level VARCHAR(20) NOT NULL DEFAULT 'tenant_only',
    confidence_score FLOAT,
    risk_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meta-Loop: Patterns Table
CREATE TABLE IF NOT EXISTS compliance_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    pattern_type VARCHAR(32) NOT NULL,
    pattern_vector JSONB NOT NULL,
    confidence_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meta-Loop: Insights Table
CREATE TABLE IF NOT EXISTS compliance_insights (
    insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_id UUID,
    insight_type VARCHAR(32) NOT NULL,
    summary TEXT,
    effectiveness_score FLOAT,
    applicability_score FLOAT,
    confidence_interval FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (pattern_id) REFERENCES compliance_patterns(pattern_id)
);

-- Meta-Loop: Policies Table
CREATE TABLE IF NOT EXISTS compliance_policies (
    policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    current_policy JSONB NOT NULL,
    recommended_update JSONB,
    rationale TEXT,
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meta-Loop: Outcomes Table
CREATE TABLE IF NOT EXISTS compliance_outcomes (
    outcome_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID,
    incident_report TEXT,
    audit_findings TEXT,
    business_impact_metrics JSONB,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (event_id) REFERENCES compliance_events(event_id)
);
