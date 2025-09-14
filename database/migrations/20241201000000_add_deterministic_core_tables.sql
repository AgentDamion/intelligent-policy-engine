-- Migration: Add Deterministic Core Tables
-- Date: 2024-12-01
-- Description: Add tables for deterministic document processing, audit trails, and rule engine

-- ===== AUDIT TRAIL TABLES =====

-- Enhanced agent_decisions table with deterministic core fields
ALTER TABLE agent_decisions 
ADD COLUMN IF NOT EXISTS trace_id UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS schema_version TEXT NOT NULL DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS tool_versions JSONB,
ADD COLUMN IF NOT EXISTS input_hash TEXT,
ADD COLUMN IF NOT EXISTS validator_outcome TEXT CHECK (validator_outcome IN ('STRICT_PASS', 'STRICT_FAIL', 'SOFT_WARN')),
ADD COLUMN IF NOT EXISTS gated_outcome TEXT CHECK (gated_outcome IN ('APPROVE', 'REJECT', 'HIL')),
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS budget_used JSONB;

-- Document processing logs
CREATE TABLE IF NOT EXISTS document_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NOT NULL,
    enterprise_id UUID NOT NULL,
    partner_id UUID,
    document_id UUID NOT NULL,
    processing_method TEXT NOT NULL CHECK (processing_method IN ('gdocai', 'textract', 'template', 'fallback')),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    extracted_text TEXT,
    entities JSONB,
    tables JSONB,
    processing_time_ms INTEGER NOT NULL,
    error_details TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_doc_processing_trace_id (trace_id),
    INDEX idx_doc_processing_enterprise_id (enterprise_id),
    INDEX idx_doc_processing_created_at (created_at)
);

-- Rule engine execution logs
CREATE TABLE IF NOT EXISTS rule_engine_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NOT NULL,
    enterprise_id UUID NOT NULL,
    rule_id TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    rule_category TEXT NOT NULL CHECK (rule_category IN ('compliance', 'security', 'business', 'technical')),
    outcome TEXT NOT NULL CHECK (outcome IN ('STRICT_PASS', 'STRICT_FAIL', 'SOFT_WARN')),
    message TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    applicable BOOLEAN NOT NULL,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_rule_engine_trace_id (trace_id),
    INDEX idx_rule_engine_enterprise_id (enterprise_id),
    INDEX idx_rule_engine_outcome (outcome),
    INDEX idx_rule_engine_created_at (created_at)
);

-- Confidence calculation logs
CREATE TABLE IF NOT EXISTS confidence_calculation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NOT NULL,
    enterprise_id UUID NOT NULL,
    parser_method_score DECIMAL(3,2) CHECK (parser_method_score >= 0 AND parser_method_score <= 1),
    schema_conformance_score DECIMAL(3,2) CHECK (schema_conformance_score >= 0 AND schema_conformance_score <= 1),
    rule_outcome_score DECIMAL(3,2) CHECK (rule_outcome_score >= 0 AND rule_outcome_score <= 1),
    model_reliability_score DECIMAL(3,2) CHECK (model_reliability_score >= 0 AND model_reliability_score <= 1),
    historical_agreement_score DECIMAL(3,2) CHECK (historical_agreement_score >= 0 AND historical_agreement_score <= 1),
    final_confidence DECIMAL(3,2) CHECK (final_confidence >= 0 AND final_confidence <= 1),
    breakdown JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_confidence_trace_id (trace_id),
    INDEX idx_confidence_enterprise_id (enterprise_id),
    INDEX idx_confidence_final_confidence (final_confidence),
    INDEX idx_confidence_created_at (created_at)
);

-- ===== PROCESSING METRICS TABLES =====

-- SLO metrics tracking
CREATE TABLE IF NOT EXISTS slo_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(5,4) NOT NULL CHECK (metric_value >= 0 AND metric_value <= 1),
    time_window TEXT NOT NULL DEFAULT '1h',
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_slo_metrics_name (metric_name),
    INDEX idx_slo_metrics_timestamp (timestamp)
);

-- Drift metrics tracking
CREATE TABLE IF NOT EXISTS drift_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(5,4) NOT NULL,
    time_window TEXT NOT NULL DEFAULT '1h',
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_drift_metrics_name (metric_name),
    INDEX idx_drift_metrics_timestamp (timestamp)
);

-- ===== RULE ENGINE TABLES =====

-- Rule definitions
CREATE TABLE IF NOT EXISTS rule_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id TEXT UNIQUE NOT NULL,
    rule_name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('compliance', 'security', 'business', 'technical')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    rule_logic JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_rule_definitions_rule_id (rule_id),
    INDEX idx_rule_definitions_category (category),
    INDEX idx_rule_definitions_enabled (enabled)
);

-- Rule execution statistics
CREATE TABLE IF NOT EXISTS rule_execution_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id TEXT NOT NULL,
    executions INTEGER NOT NULL DEFAULT 0,
    passes INTEGER NOT NULL DEFAULT 0,
    fails INTEGER NOT NULL DEFAULT 0,
    warnings INTEGER NOT NULL DEFAULT 0,
    pass_rate DECIMAL(5,4) CHECK (pass_rate >= 0 AND pass_rate <= 1),
    fail_rate DECIMAL(5,4) CHECK (fail_rate >= 0 AND fail_rate <= 1),
    warning_rate DECIMAL(5,4) CHECK (warning_rate >= 0 AND warning_rate <= 1),
    last_execution TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_rule_stats_rule_id (rule_id),
    INDEX idx_rule_stats_last_execution (last_execution)
);

-- ===== CACHE TABLES =====

-- Document processing cache
CREATE TABLE IF NOT EXISTS document_processing_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT UNIQUE NOT NULL,
    parsed_result JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    
    -- Indexes for performance
    INDEX idx_doc_cache_content_hash (content_hash),
    INDEX idx_doc_cache_expires_at (expires_at)
);

-- ===== HISTORICAL DATA TABLES =====

-- Enterprise trust levels
CREATE TABLE IF NOT EXISTS enterprise_trust_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID UNIQUE NOT NULL,
    similar_decisions INTEGER NOT NULL DEFAULT 0,
    agreement_rate DECIMAL(5,4) CHECK (agreement_rate >= 0 AND agreement_rate <= 1),
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_enterprise_trust_enterprise_id (enterprise_id),
    INDEX idx_enterprise_trust_agreement_rate (agreement_rate)
);

-- Model reliability scores
CREATE TABLE IF NOT EXISTS model_reliability_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT UNIQUE NOT NULL,
    success_rate DECIMAL(5,4) CHECK (success_rate >= 0 AND success_rate <= 1),
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_model_reliability_model_name (model_name),
    INDEX idx_model_reliability_success_rate (success_rate)
);

-- ===== TRIGGERS =====

-- Update rule execution stats trigger
CREATE OR REPLACE FUNCTION update_rule_execution_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO rule_execution_stats (rule_id, executions, passes, fails, warnings, pass_rate, fail_rate, warning_rate, last_execution)
    VALUES (NEW.rule_id, 1, 
            CASE WHEN NEW.outcome = 'STRICT_PASS' THEN 1 ELSE 0 END,
            CASE WHEN NEW.outcome = 'STRICT_FAIL' THEN 1 ELSE 0 END,
            CASE WHEN NEW.outcome = 'SOFT_WARN' THEN 1 ELSE 0 END,
            CASE WHEN NEW.outcome = 'STRICT_PASS' THEN 1.0 ELSE 0.0 END,
            CASE WHEN NEW.outcome = 'STRICT_FAIL' THEN 1.0 ELSE 0.0 END,
            CASE WHEN NEW.outcome = 'SOFT_WARN' THEN 1.0 ELSE 0.0 END,
            NOW())
    ON CONFLICT (rule_id) DO UPDATE SET
        executions = rule_execution_stats.executions + 1,
        passes = rule_execution_stats.passes + CASE WHEN NEW.outcome = 'STRICT_PASS' THEN 1 ELSE 0 END,
        fails = rule_execution_stats.fails + CASE WHEN NEW.outcome = 'STRICT_FAIL' THEN 1 ELSE 0 END,
        warnings = rule_execution_stats.warnings + CASE WHEN NEW.outcome = 'SOFT_WARN' THEN 1 ELSE 0 END,
        pass_rate = (rule_execution_stats.passes + CASE WHEN NEW.outcome = 'STRICT_PASS' THEN 1 ELSE 0 END)::DECIMAL / (rule_execution_stats.executions + 1),
        fail_rate = (rule_execution_stats.fails + CASE WHEN NEW.outcome = 'STRICT_FAIL' THEN 1 ELSE 0 END)::DECIMAL / (rule_execution_stats.executions + 1),
        warning_rate = (rule_execution_stats.warnings + CASE WHEN NEW.outcome = 'SOFT_WARN' THEN 1 ELSE 0 END)::DECIMAL / (rule_execution_stats.executions + 1),
        last_execution = NOW(),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rule_execution_stats
    AFTER INSERT ON rule_engine_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_rule_execution_stats();

-- ===== INITIAL DATA =====

-- Insert default rule definitions
INSERT INTO rule_definitions (rule_id, rule_name, description, category, severity, enabled, rule_logic) VALUES
('compliance-gdpr-data-types', 'GDPR Data Types Check', 'Ensure GDPR compliance for personal data processing', 'compliance', 'critical', true, '{"type": "gdpr_compliance", "conditions": ["personal_data"], "requirements": ["gdpr_compliance"]}'),
('security-client-facing-restriction', 'Client-Facing Tool Restriction', 'Restrict certain tools from client-facing use', 'security', 'high', true, '{"type": "client_facing_restriction", "restricted_tools": ["image-generator", "deepfake", "voice-clone"]}'),
('business-urgency-approval', 'Urgency Approval Requirement', 'High urgency requests require additional approval', 'business', 'medium', true, '{"type": "urgency_approval", "threshold": 0.8, "requirement": "urgent_approval"}'),
('technical-file-size-limit', 'File Size Limit', 'Enforce file size limits for processing', 'technical', 'medium', true, '{"type": "file_size_limit", "max_size_bytes": 10485760}'),
('document-processing-confidence', 'Document Processing Confidence', 'Ensure document processing meets minimum confidence threshold', 'technical', 'high', true, '{"type": "processing_confidence", "min_confidence": 0.7}');

-- Insert default model reliability scores
INSERT INTO model_reliability_scores (model_name, success_rate) VALUES
('gpt-4', 0.92),
('gpt-3.5-turbo', 0.85),
('claude-3', 0.90),
('claude-2', 0.88),
('default', 0.80);

-- ===== COMMENTS =====

COMMENT ON TABLE document_processing_logs IS 'Logs all document processing operations with deterministic results';
COMMENT ON TABLE rule_engine_logs IS 'Logs all rule engine executions with outcomes';
COMMENT ON TABLE confidence_calculation_logs IS 'Logs confidence calculations with breakdown';
COMMENT ON TABLE slo_metrics IS 'Tracks SLO metrics for monitoring';
COMMENT ON TABLE drift_metrics IS 'Tracks drift metrics for alerting';
COMMENT ON TABLE rule_definitions IS 'Stores rule definitions for the rule engine';
COMMENT ON TABLE rule_execution_stats IS 'Tracks statistics for rule executions';
COMMENT ON TABLE document_processing_cache IS 'Caches parsed document results for idempotency';
COMMENT ON TABLE enterprise_trust_levels IS 'Tracks enterprise trust levels for confidence calculation';
COMMENT ON TABLE model_reliability_scores IS 'Tracks model reliability scores for confidence calculation';

-- ===== GRANTS =====

-- Grant permissions to service role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;