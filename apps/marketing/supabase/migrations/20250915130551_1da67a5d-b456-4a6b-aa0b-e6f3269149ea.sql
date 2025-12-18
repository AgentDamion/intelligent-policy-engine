-- Add audit trail support to existing tables
-- This migration adds deterministic processing fields for complete traceability

-- Add trace_id and schema versioning to audit_events
ALTER TABLE audit_events
  ADD COLUMN IF NOT EXISTS trace_id UUID,
  ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS tool_versions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS processing_method TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5, 4),
  ADD COLUMN IF NOT EXISTS final_outcome TEXT;

-- Create index for trace_id lookups
CREATE INDEX IF NOT EXISTS idx_audit_events_trace_id ON audit_events(trace_id);

-- Add deterministic processing fields to ai_agent_decisions
ALTER TABLE ai_agent_decisions
  ADD COLUMN IF NOT EXISTS trace_id UUID,
  ADD COLUMN IF NOT EXISTS input_checksum_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS validation_outcome JSONB,
  ADD COLUMN IF NOT EXISTS final_confidence NUMERIC(5, 4),
  ADD COLUMN IF NOT EXISTS gated_outcome TEXT;

-- Create indexes for faster audit queries
CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_trace_id ON ai_agent_decisions(trace_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_checksum ON ai_agent_decisions(input_checksum_sha256);

-- Create policy_processing_audit table for deterministic audit trails
CREATE TABLE IF NOT EXISTS policy_processing_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id UUID NOT NULL UNIQUE,
  enterprise_id UUID NOT NULL,
  input_document JSONB NOT NULL,
  parsed_document JSONB NOT NULL,
  agent_decision JSONB NOT NULL,
  validation_result JSONB NOT NULL,
  schema_version TEXT NOT NULL DEFAULT 'v1.0',
  tool_versions JSONB DEFAULT '{}',
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for the new audit table
CREATE INDEX IF NOT EXISTS idx_policy_processing_audit_enterprise ON policy_processing_audit(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_policy_processing_audit_created ON policy_processing_audit(created_at);

-- Add RLS policies for the new audit table
ALTER TABLE policy_processing_audit ENABLE ROW LEVEL SECURITY;

-- Enterprise members can view their audit trails
CREATE POLICY "Enterprise members can view audit trails" 
ON policy_processing_audit 
FOR SELECT 
USING (enterprise_id IN (SELECT get_user_enterprises(auth.uid())));

-- System can insert audit trails
CREATE POLICY "System can insert audit trails" 
ON policy_processing_audit 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_policy_processing_audit_updated_at
    BEFORE UPDATE ON policy_processing_audit
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();