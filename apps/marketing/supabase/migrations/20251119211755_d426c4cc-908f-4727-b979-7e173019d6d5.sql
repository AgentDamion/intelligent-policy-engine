-- Add risk_tier and deployment_status columns to ai_tool_registry
-- Safer migration that handles existing data

-- First, add columns without constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ai_tool_registry' AND column_name = 'risk_tier') THEN
    ALTER TABLE ai_tool_registry ADD COLUMN risk_tier TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ai_tool_registry' AND column_name = 'deployment_status') THEN
    ALTER TABLE ai_tool_registry ADD COLUMN deployment_status TEXT DEFAULT 'draft';
  END IF;
END $$;

-- Update any null or invalid values
UPDATE ai_tool_registry 
SET risk_tier = 'MEDIUM' 
WHERE risk_tier IS NULL OR risk_tier NOT IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

UPDATE ai_tool_registry 
SET deployment_status = 'approved' 
WHERE deployment_status IS NULL OR deployment_status NOT IN ('draft', 'approved', 'banned', 'deprecated');

-- Now add the check constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_tool_registry_risk_tier_check') THEN
    ALTER TABLE ai_tool_registry ADD CONSTRAINT ai_tool_registry_risk_tier_check 
      CHECK (risk_tier IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_tool_registry_deployment_status_check2') THEN
    ALTER TABLE ai_tool_registry ADD CONSTRAINT ai_tool_registry_deployment_status_check2
      CHECK (deployment_status IN ('draft', 'approved', 'banned', 'deprecated'));
  END IF;
END $$;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_ai_tool_registry_risk_status 
ON ai_tool_registry(risk_tier, deployment_status);

-- Add helpful comments
COMMENT ON COLUMN ai_tool_registry.risk_tier IS 'Risk classification: LOW (minimal risk), MEDIUM (standard review), HIGH (requires approval), CRITICAL (banned or strict oversight)';
COMMENT ON COLUMN ai_tool_registry.deployment_status IS 'Deployment status: draft (not ready), approved (safe to use), banned (policy violation), deprecated (superseded)';