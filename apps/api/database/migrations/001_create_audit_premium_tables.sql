-- Migration: Create AuditPremium Tables
-- Description: Creates the database schema for the enhanced audit logging system
-- Author: AIComplyr Team
-- Date: 2024

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audit_sessions table
CREATE TABLE audit_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    session_hash VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    final_decision JSONB,
    total_entries INTEGER DEFAULT 0,
    avg_confidence DECIMAL(3,2) DEFAULT 0.00,
    avg_compliance_score DECIMAL(3,2) DEFAULT 0.00,
    risk_level VARCHAR(50) DEFAULT 'low',
    final_status VARCHAR(50) DEFAULT 'pending',
    policy_violations INTEGER DEFAULT 0,
    escalations INTEGER DEFAULT 0,
    workflow_path JSONB DEFAULT '[]',
    agents_engaged JSONB DEFAULT '[]',
    total_processing_time INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create audit_entries table
CREATE TABLE audit_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id VARCHAR(255) UNIQUE NOT NULL,
    entry_hash VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL REFERENCES audit_sessions(session_id) ON DELETE CASCADE,
    agent_type VARCHAR(100) NOT NULL,
    agent_display_name VARCHAR(255) NOT NULL,
    decision_type VARCHAR(100) NOT NULL,
    decision_type_display VARCHAR(255) NOT NULL,
    decision_data JSONB NOT NULL,
    reasoning TEXT,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    confidence_factors JSONB DEFAULT '[]',
    uncertainty_level DECIMAL(3,2) NOT NULL CHECK (uncertainty_level >= 0.00 AND uncertainty_level <= 1.00),
    compliance_status VARCHAR(50) DEFAULT 'unknown',
    compliance_score DECIMAL(3,2) DEFAULT 0.00,
    risk_level VARCHAR(50) DEFAULT 'low',
    risk_score DECIMAL(3,2) DEFAULT 0.00,
    risk_factors JSONB DEFAULT '[]',
    before_state JSONB,
    after_state JSONB,
    changes_detected JSONB DEFAULT '[]',
    status VARCHAR(100),
    processing_time_ms INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    parent_entry_id VARCHAR(255) REFERENCES audit_entries(entry_id) ON DELETE SET NULL,
    child_entry_ids JSONB DEFAULT '[]',
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create audit_policy_references table
CREATE TABLE audit_policy_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id VARCHAR(255) NOT NULL REFERENCES audit_entries(entry_id) ON DELETE CASCADE,
    policy_id VARCHAR(255) NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    policy_version VARCHAR(50) NOT NULL,
    policy_section VARCHAR(255),
    relevance DECIMAL(3,2) NOT NULL CHECK (relevance >= 0.00 AND relevance <= 1.00),
    impact VARCHAR(50) DEFAULT 'neutral',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create audit_chains table for tracking decision chains
CREATE TABLE audit_chains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_id VARCHAR(255) UNIQUE NOT NULL,
    root_entry_id VARCHAR(255) REFERENCES audit_entries(entry_id) ON DELETE SET NULL,
    entry_ids JSONB DEFAULT '[]',
    total_entries INTEGER DEFAULT 0,
    chain_type VARCHAR(50) DEFAULT 'workflow',
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    summary JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization

-- Audit sessions indexes
CREATE INDEX idx_audit_sessions_session_id ON audit_sessions(session_id);
CREATE INDEX idx_audit_sessions_user_id ON audit_sessions(user_id);
CREATE INDEX idx_audit_sessions_start_time ON audit_sessions(start_time);
CREATE INDEX idx_audit_sessions_risk_level ON audit_sessions(risk_level);
CREATE INDEX idx_audit_sessions_status ON audit_sessions(final_status);
CREATE INDEX idx_audit_sessions_created_at ON audit_sessions(created_at);

-- Audit entries indexes
CREATE INDEX idx_audit_entries_entry_id ON audit_entries(entry_id);
CREATE INDEX idx_audit_entries_session_id ON audit_entries(session_id);
CREATE INDEX idx_audit_entries_parent_entry_id ON audit_entries(parent_entry_id);
CREATE INDEX idx_audit_entries_agent_type ON audit_entries(agent_type);
CREATE INDEX idx_audit_entries_decision_type ON audit_entries(decision_type);
CREATE INDEX idx_audit_entries_confidence_score ON audit_entries(confidence_score);
CREATE INDEX idx_audit_entries_compliance_status ON audit_entries(compliance_status);
CREATE INDEX idx_audit_entries_risk_level ON audit_entries(risk_level);
CREATE INDEX idx_audit_entries_timestamp ON audit_entries(timestamp);
CREATE INDEX idx_audit_entries_created_at ON audit_entries(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_audit_entries_session_agent ON audit_entries(session_id, agent_type);
CREATE INDEX idx_audit_entries_session_confidence ON audit_entries(session_id, confidence_score);
CREATE INDEX idx_audit_entries_session_risk ON audit_entries(session_id, risk_level);
CREATE INDEX idx_audit_entries_parent_chain ON audit_entries(parent_entry_id, entry_id);

-- Policy references indexes
CREATE INDEX idx_audit_policy_refs_entry_id ON audit_policy_references(entry_id);
CREATE INDEX idx_audit_policy_refs_policy_id ON audit_policy_references(policy_id);
CREATE INDEX idx_audit_policy_refs_relevance ON audit_policy_references(relevance);

-- Audit chains indexes
CREATE INDEX idx_audit_chains_chain_id ON audit_chains(chain_id);
CREATE INDEX idx_audit_chains_root_entry ON audit_chains(root_entry_id);
CREATE INDEX idx_audit_chains_chain_type ON audit_chains(chain_type);
CREATE INDEX idx_audit_chains_start_time ON audit_chains(start_time);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_audit_sessions_updated_at 
    BEFORE UPDATE ON audit_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_chains_updated_at 
    BEFORE UPDATE ON audit_chains 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update session summary when entries are added
CREATE OR REPLACE FUNCTION update_session_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update audit_sessions summary when audit_entries are inserted/updated
    UPDATE audit_sessions 
    SET 
        total_entries = (
            SELECT COUNT(*) 
            FROM audit_entries 
            WHERE session_id = NEW.session_id
        ),
        avg_confidence = (
            SELECT COALESCE(AVG(confidence_score), 0.00)
            FROM audit_entries 
            WHERE session_id = NEW.session_id
        ),
        avg_compliance_score = (
            SELECT COALESCE(AVG(compliance_score), 0.00)
            FROM audit_entries 
            WHERE session_id = NEW.session_id
        ),
        risk_level = (
            SELECT 
                CASE 
                    WHEN COUNT(*) FILTER (WHERE risk_level = 'critical') > 0 THEN 'critical'
                    WHEN COUNT(*) FILTER (WHERE risk_level = 'high') > 0 THEN 'high'
                    WHEN COUNT(*) FILTER (WHERE risk_level = 'medium') > 0 THEN 'medium'
                    ELSE 'low'
                END
            FROM audit_entries 
            WHERE session_id = NEW.session_id
        ),
        final_status = (
            SELECT status 
            FROM audit_entries 
            WHERE session_id = NEW.session_id 
            ORDER BY timestamp DESC 
            LIMIT 1
        ),
        policy_violations = (
            SELECT COUNT(*) 
            FROM audit_entries 
            WHERE session_id = NEW.session_id AND compliance_status = 'non_compliant'
        ),
        escalations = (
            SELECT COUNT(*) 
            FROM audit_entries 
            WHERE session_id = NEW.session_id AND decision_type = 'escalation_decision'
        ),
        updated_at = NOW()
    WHERE session_id = NEW.session_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_session_summary_trigger
    AFTER INSERT OR UPDATE ON audit_entries
    FOR EACH ROW EXECUTE FUNCTION update_session_summary();

-- Create views for common queries

-- View for session summaries with entry counts
CREATE VIEW audit_session_summaries AS
SELECT 
    s.*,
    COUNT(e.id) as total_entries,
    COALESCE(AVG(e.confidence_score), 0.00) as avg_confidence,
    COALESCE(AVG(e.compliance_score), 0.00) as avg_compliance_score,
    STRING_AGG(DISTINCT e.agent_type, ', ') as agents_engaged
FROM audit_sessions s
LEFT JOIN audit_entries e ON s.session_id = e.session_id
GROUP BY s.id, s.session_id, s.session_hash, s.user_id, s.user_message, s.description, 
         s.start_time, s.end_time, s.final_decision, s.risk_level, s.final_status, 
         s.policy_violations, s.escalations, s.workflow_path, s.total_processing_time, 
         s.created_at, s.updated_at;

-- View for entry chains
CREATE VIEW audit_entry_chains AS
SELECT 
    e1.entry_id as root_entry_id,
    e1.session_id,
    e1.agent_type as root_agent,
    e1.decision_type as root_decision,
    e1.timestamp as root_timestamp,
    e2.entry_id as child_entry_id,
    e2.agent_type as child_agent,
    e2.decision_type as child_decision,
    e2.timestamp as child_timestamp,
    e2.confidence_score as child_confidence
FROM audit_entries e1
LEFT JOIN audit_entries e2 ON e1.entry_id = e2.parent_entry_id
WHERE e1.parent_entry_id IS NULL
ORDER BY e1.timestamp, e2.timestamp;

-- Insert sample data for testing (optional)
-- Uncomment the following lines to insert test data

/*
INSERT INTO audit_sessions (
    session_id, session_hash, user_id, user_message, start_time, risk_level, final_status
) VALUES (
    'session_1234567890_abc123def',
    'hash_1234567890abcdef',
    'user_123',
    'Need to use ChatGPT for Monday''s client presentation!!!',
    NOW() - INTERVAL '1 hour',
    'low',
    'approved'
);

INSERT INTO audit_entries (
    entry_id, entry_hash, session_id, agent_type, agent_display_name, 
    decision_type, decision_type_display, decision_data, reasoning, 
    confidence_score, uncertainty_level, compliance_status, compliance_score,
    risk_level, risk_score, status, timestamp
) VALUES (
    'entry_1234567890_xyz789ghi',
    'hash_xyz789ghi123456',
    'session_1234567890_abc123def',
    'context',
    'Context Agent',
    'context_analysis',
    'Context Analysis',
    '{"urgency_level": 0.85, "emotional_state": "anxious"}',
    'High confidence due to clear urgency indicators',
    0.92,
    0.08,
    'compliant',
    0.88,
    'low',
    0.15,
    'completed',
    NOW() - INTERVAL '1 hour'
);
*/

-- Add comments to tables for documentation
COMMENT ON TABLE audit_sessions IS 'Stores audit session information with summary statistics';
COMMENT ON TABLE audit_entries IS 'Stores individual audit entries with confidence scores and compliance data';
COMMENT ON TABLE audit_policy_references IS 'Stores policy references for each audit entry';
COMMENT ON TABLE audit_chains IS 'Stores audit chains for tracking decision flows';

COMMENT ON COLUMN audit_sessions.session_hash IS 'SHA-256 hash of session data for integrity verification';
COMMENT ON COLUMN audit_entries.entry_hash IS 'SHA-256 hash of entry data for integrity verification';
COMMENT ON COLUMN audit_entries.confidence_score IS 'AI confidence score (0.00 to 1.00)';
COMMENT ON COLUMN audit_entries.uncertainty_level IS 'AI uncertainty level (0.00 to 1.00)';
COMMENT ON COLUMN audit_entries.compliance_score IS 'Compliance score based on policy references (0.00 to 1.00)';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_app_user; 