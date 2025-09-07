-- Migration: Create AI Tool Logging Tables
-- Description: Creates the database schema for AI tool usage logging and external data discovery
-- Author: AIComplyr Team
-- Date: 2024

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ai_tool_usage_logs table for client-side integrations
CREATE TABLE ai_tool_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_id VARCHAR(255) UNIQUE NOT NULL,
    tool_id VARCHAR(255),
    tool_name VARCHAR(500) NOT NULL,
    tool_url TEXT,
    vendor_name VARCHAR(500),
    vendor_url TEXT,
    usage_type VARCHAR(100) NOT NULL,
    data_processed TEXT,
    compliance_status VARCHAR(50) DEFAULT 'unknown',
    risk_level VARCHAR(50) DEFAULT 'unknown',
    metadata JSONB DEFAULT '{}',
    client_id VARCHAR(255),
    session_id VARCHAR(255),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create discovered_ai_tools table for tool discovery agent
CREATE TABLE discovered_ai_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    source VARCHAR(100) NOT NULL,
    url TEXT,
    description TEXT,
    category VARCHAR(100),
    discovered_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'discovered',
    compliance_score DECIMAL(3,2),
    risk_level VARCHAR(50) DEFAULT 'unknown'
);

-- Create vendor_data_extractions table for data extraction agent
CREATE TABLE vendor_data_extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extraction_id VARCHAR(255) UNIQUE NOT NULL,
    vendor_url TEXT NOT NULL,
    extraction_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    processing_time INTEGER,
    extracted_at TIMESTAMP NOT NULL,
    data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create monitored_sources table for monitoring agent
CREATE TABLE monitored_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    check_interval INTEGER DEFAULT 300000,
    timeout INTEGER DEFAULT 30000,
    last_check TIMESTAMP,
    last_change TIMESTAMP,
    check_count INTEGER DEFAULT 0,
    change_count INTEGER DEFAULT 0,
    baseline_content TEXT,
    baseline_hash VARCHAR(255),
    baseline_length INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create source_change_history table for monitoring agent
CREATE TABLE source_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_id VARCHAR(255) UNIQUE NOT NULL,
    source_id VARCHAR(255) NOT NULL REFERENCES monitored_sources(source_id) ON DELETE CASCADE,
    source_name VARCHAR(500) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    has_changes BOOLEAN NOT NULL,
    change_type VARCHAR(50),
    change_score DECIMAL(3,2),
    content_hash VARCHAR(255),
    previous_hash VARCHAR(255),
    content_length INTEGER,
    previous_length INTEGER,
    critical_changes JSONB DEFAULT '[]',
    impact VARCHAR(50) DEFAULT 'low',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create vendor_outreach_history table for vendor outreach agent
CREATE TABLE vendor_outreach_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outreach_id VARCHAR(255) UNIQUE NOT NULL,
    vendor_email VARCHAR(500) NOT NULL,
    vendor_name VARCHAR(500),
    tool_name VARCHAR(500),
    email_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP NOT NULL,
    processing_time INTEGER,
    email_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create compliance_assessments table for compliance scoring agent
CREATE TABLE compliance_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id VARCHAR(255) UNIQUE NOT NULL,
    tool_id VARCHAR(255) NOT NULL,
    tool_name VARCHAR(500) NOT NULL,
    vendor_id VARCHAR(255),
    vendor_name VARCHAR(500),
    assessment_date TIMESTAMP NOT NULL,
    processing_time INTEGER,
    compliance_scores JSONB NOT NULL,
    overall_compliance_score DECIMAL(5,2),
    risk_assessment JSONB NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    recommendations JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization

-- AI tool usage logs indexes
CREATE INDEX idx_ai_tool_usage_logs_tool_id ON ai_tool_usage_logs(tool_id);
CREATE INDEX idx_ai_tool_usage_logs_tool_name ON ai_tool_usage_logs(tool_name);
CREATE INDEX idx_ai_tool_usage_logs_vendor_name ON ai_tool_usage_logs(vendor_name);
CREATE INDEX idx_ai_tool_usage_logs_timestamp ON ai_tool_usage_logs(timestamp);
CREATE INDEX idx_ai_tool_usage_logs_compliance_status ON ai_tool_usage_logs(compliance_status);
CREATE INDEX idx_ai_tool_usage_logs_risk_level ON ai_tool_usage_logs(risk_level);
CREATE INDEX idx_ai_tool_usage_logs_client_id ON ai_tool_usage_logs(client_id);
CREATE INDEX idx_ai_tool_usage_logs_session_id ON ai_tool_usage_logs(session_id);

-- Discovered AI tools indexes
CREATE INDEX idx_discovered_ai_tools_tool_id ON discovered_ai_tools(tool_id);
CREATE INDEX idx_discovered_ai_tools_name ON discovered_ai_tools(name);
CREATE INDEX idx_discovered_ai_tools_source ON discovered_ai_tools(source);
CREATE INDEX idx_discovered_ai_tools_category ON discovered_ai_tools(category);
CREATE INDEX idx_discovered_ai_tools_discovered_at ON discovered_ai_tools(discovered_at);
CREATE INDEX idx_discovered_ai_tools_status ON discovered_ai_tools(status);

-- Vendor data extractions indexes
CREATE INDEX idx_vendor_data_extractions_extraction_id ON vendor_data_extractions(extraction_id);
CREATE INDEX idx_vendor_data_extractions_vendor_url ON vendor_data_extractions(vendor_url);
CREATE INDEX idx_vendor_data_extractions_extraction_type ON vendor_data_extractions(extraction_type);
CREATE INDEX idx_vendor_data_extractions_status ON vendor_data_extractions(status);
CREATE INDEX idx_vendor_data_extractions_extracted_at ON vendor_data_extractions(extracted_at);

-- Monitored sources indexes
CREATE INDEX idx_monitored_sources_source_id ON monitored_sources(source_id);
CREATE INDEX idx_monitored_sources_name ON monitored_sources(name);
CREATE INDEX idx_monitored_sources_url ON monitored_sources(url);
CREATE INDEX idx_monitored_sources_type ON monitored_sources(type);
CREATE INDEX idx_monitored_sources_status ON monitored_sources(status);
CREATE INDEX idx_monitored_sources_last_check ON monitored_sources(last_check);

-- Source change history indexes
CREATE INDEX idx_source_change_history_change_id ON source_change_history(change_id);
CREATE INDEX idx_source_change_history_source_id ON source_change_history(source_id);
CREATE INDEX idx_source_change_history_timestamp ON source_change_history(timestamp);
CREATE INDEX idx_source_change_history_has_changes ON source_change_history(has_changes);
CREATE INDEX idx_source_change_history_impact ON source_change_history(impact);

-- Vendor outreach history indexes
CREATE INDEX idx_vendor_outreach_history_outreach_id ON vendor_outreach_history(outreach_id);
CREATE INDEX idx_vendor_outreach_history_vendor_email ON vendor_outreach_history(vendor_email);
CREATE INDEX idx_vendor_outreach_history_tool_name ON vendor_outreach_history(tool_name);
CREATE INDEX idx_vendor_outreach_history_email_type ON vendor_outreach_history(email_type);
CREATE INDEX idx_vendor_outreach_history_status ON vendor_outreach_history(status);
CREATE INDEX idx_vendor_outreach_history_sent_at ON vendor_outreach_history(sent_at);

-- Compliance assessments indexes
CREATE INDEX idx_compliance_assessments_assessment_id ON compliance_assessments(assessment_id);
CREATE INDEX idx_compliance_assessments_tool_id ON compliance_assessments(tool_id);
CREATE INDEX idx_compliance_assessments_tool_name ON compliance_assessments(tool_name);
CREATE INDEX idx_compliance_assessments_vendor_id ON compliance_assessments(vendor_id);
CREATE INDEX idx_compliance_assessments_assessment_date ON compliance_assessments(assessment_date);
CREATE INDEX idx_compliance_assessments_overall_compliance_score ON compliance_assessments(overall_compliance_score);
CREATE INDEX idx_compliance_assessments_risk_level ON compliance_assessments(risk_level);

-- Create views for common queries

-- View for AI tool usage summary
CREATE VIEW ai_tool_usage_summary AS
SELECT 
    tool_id,
    tool_name,
    tool_url,
    vendor_name,
    vendor_url,
    COUNT(*) as total_usage,
    COUNT(DISTINCT client_id) as unique_clients,
    COUNT(DISTINCT session_id) as unique_sessions,
    MAX(timestamp) as last_used,
    MIN(timestamp) as first_used,
    MODE() WITHIN GROUP (ORDER BY compliance_status) as most_common_compliance_status,
    MODE() WITHIN GROUP (ORDER BY risk_level) as most_common_risk_level,
    AVG(CASE WHEN data_processed IS NOT NULL THEN 1 ELSE 0 END) as data_processing_rate
FROM ai_tool_usage_logs
GROUP BY tool_id, tool_name, tool_url, vendor_name, vendor_url;

-- View for compliance assessment summary
CREATE VIEW compliance_assessment_summary AS
SELECT 
    tool_id,
    tool_name,
    vendor_name,
    COUNT(*) as assessment_count,
    AVG(overall_compliance_score) as avg_compliance_score,
    MAX(overall_compliance_score) as best_compliance_score,
    MIN(overall_compliance_score) as worst_compliance_score,
    MODE() WITHIN GROUP (ORDER BY risk_level) as most_common_risk_level,
    MAX(assessment_date) as last_assessment,
    MIN(assessment_date) as first_assessment
FROM compliance_assessments
GROUP BY tool_id, tool_name, vendor_name;

-- View for monitoring source summary
CREATE VIEW monitoring_source_summary AS
SELECT 
    source_id,
    name,
    url,
    type,
    status,
    check_count,
    change_count,
    last_check,
    last_change,
    CASE 
        WHEN last_change IS NULL THEN 'no_changes'
        WHEN last_change > last_check THEN 'recent_changes'
        ELSE 'stable'
    END as change_status
FROM monitored_sources;

-- Create functions for common operations

-- Function to log AI tool usage
CREATE OR REPLACE FUNCTION log_ai_tool_usage(
    p_tool_name VARCHAR(500),
    p_usage_type VARCHAR(100),
    p_tool_url TEXT DEFAULT NULL,
    p_vendor_name VARCHAR(500) DEFAULT NULL,
    p_vendor_url TEXT DEFAULT NULL,
    p_data_processed TEXT DEFAULT NULL,
    p_compliance_status VARCHAR(50) DEFAULT 'unknown',
    p_risk_level VARCHAR(50) DEFAULT 'unknown',
    p_metadata JSONB DEFAULT '{}',
    p_client_id VARCHAR(255) DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL
) RETURNS VARCHAR(255) AS $$
DECLARE
    v_log_id VARCHAR(255);
    v_tool_id VARCHAR(255);
BEGIN
    -- Generate log ID
    v_log_id := 'log-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || substr(md5(random()::text), 1, 9);
    
    -- Check if tool exists
    SELECT tool_id INTO v_tool_id 
    FROM discovered_ai_tools 
    WHERE name = p_tool_name 
    LIMIT 1;
    
    -- Insert usage log
    INSERT INTO ai_tool_usage_logs (
        log_id,
        tool_id,
        tool_name,
        tool_url,
        vendor_name,
        vendor_url,
        usage_type,
        data_processed,
        compliance_status,
        risk_level,
        metadata,
        client_id,
        session_id,
        timestamp
    ) VALUES (
        v_log_id,
        v_tool_id,
        p_tool_name,
        p_tool_url,
        p_vendor_name,
        p_vendor_url,
        p_usage_type,
        p_data_processed,
        p_compliance_status,
        p_risk_level,
        p_metadata,
        p_client_id,
        p_session_id,
        NOW()
    );
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to discover new AI tool
CREATE OR REPLACE FUNCTION discover_ai_tool(
    p_name VARCHAR(500),
    p_source VARCHAR(100),
    p_url TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_category VARCHAR(100) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VARCHAR(255) AS $$
DECLARE
    v_tool_id VARCHAR(255);
BEGIN
    -- Generate tool ID
    v_tool_id := 'tool-' || substr(md5(p_name || p_source), 1, 8);
    
    -- Insert discovered tool
    INSERT INTO discovered_ai_tools (
        tool_id,
        name,
        source,
        url,
        description,
        category,
        discovered_at,
        metadata
    ) VALUES (
        v_tool_id,
        p_name,
        p_source,
        p_url,
        p_description,
        p_category,
        NOW(),
        p_metadata
    )
    ON CONFLICT (tool_id) DO UPDATE SET
        last_updated = NOW(),
        metadata = p_metadata;
    
    RETURN v_tool_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add monitored source
CREATE OR REPLACE FUNCTION add_monitored_source(
    p_name VARCHAR(500),
    p_url TEXT,
    p_type VARCHAR(100),
    p_check_interval INTEGER DEFAULT 300000,
    p_timeout INTEGER DEFAULT 30000
) RETURNS VARCHAR(255) AS $$
DECLARE
    v_source_id VARCHAR(255);
BEGIN
    -- Generate source ID
    v_source_id := 'src-' || substr(md5(p_url), 1, 8);
    
    -- Insert monitored source
    INSERT INTO monitored_sources (
        source_id,
        name,
        url,
        type,
        check_interval,
        timeout
    ) VALUES (
        v_source_id,
        p_name,
        p_url,
        p_type,
        p_check_interval,
        p_timeout
    )
    ON CONFLICT (source_id) DO UPDATE SET
        updated_at = NOW();
    
    RETURN v_source_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updates

-- Trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monitored_sources_updated_at
    BEFORE UPDATE ON monitored_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- Insert sample data for testing (optional)
INSERT INTO discovered_ai_tools (tool_id, name, source, url, description, category, discovered_at) VALUES
('tool-sample1', 'ChatGPT', 'github', 'https://openai.com/chatgpt', 'AI language model for conversation', 'chatbot', NOW()),
('tool-sample2', 'DALL-E', 'github', 'https://openai.com/dall-e', 'AI image generation model', 'image-generation', NOW()),
('tool-sample3', 'Claude', 'news', 'https://anthropic.com/claude', 'AI assistant with safety focus', 'chatbot', NOW());

-- Migration complete
COMMENT ON TABLE ai_tool_usage_logs IS 'Stores AI tool usage logs from client-side integrations';
COMMENT ON TABLE discovered_ai_tools IS 'Stores AI tools discovered by the discovery agent';
COMMENT ON TABLE vendor_data_extractions IS 'Stores data extraction results from vendor websites';
COMMENT ON TABLE monitored_sources IS 'Stores sources monitored by the monitoring agent';
COMMENT ON TABLE source_change_history IS 'Stores change history for monitored sources';
COMMENT ON TABLE vendor_outreach_history IS 'Stores vendor outreach communication history';
COMMENT ON TABLE compliance_assessments IS 'Stores compliance assessment results for AI tools';
