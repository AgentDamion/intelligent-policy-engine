-- Create new premium audit tables with different names
CREATE TABLE premium_audit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    description TEXT,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    avg_confidence DECIMAL(3,2),
    risk_level VARCHAR(50),
    final_decision JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE premium_audit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255) REFERENCES premium_audit_sessions(session_id),
    entry_type VARCHAR(50),
    confidence_score DECIMAL(3,2),
    confidence_reasoning TEXT,
    data JSONB,
    entry_hash VARCHAR(255),
    timestamp TIMESTAMP DEFAULT NOW(),
    parent_entry_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_premium_entries_session ON premium_audit_entries(session_id);
CREATE INDEX idx_premium_entries_parent ON premium_audit_entries(parent_entry_id);