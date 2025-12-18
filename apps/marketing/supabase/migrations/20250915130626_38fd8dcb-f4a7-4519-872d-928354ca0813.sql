-- Fix the policy that's causing the migration to fail
-- The issue is with the get_user_enterprises function signature

-- Drop the problematic policy first
DROP POLICY IF EXISTS "Enterprise members can view audit trails" ON policy_processing_audit;

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

-- Enterprise members can view their audit trails (fixed policy)
CREATE POLICY "Enterprise members can view audit trails" 
ON policy_processing_audit 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM enterprise_members em 
  WHERE em.enterprise_id = policy_processing_audit.enterprise_id 
  AND em.user_id = auth.uid()
));

-- System can insert audit trails
CREATE POLICY "System can insert audit trails" 
ON policy_processing_audit 
FOR INSERT 
WITH CHECK (true);