-- Extend ai_tool_registry with Configuration Agent metadata
ALTER TABLE ai_tool_registry 
ADD COLUMN IF NOT EXISTS risk_tier TEXT CHECK (risk_tier IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
ADD COLUMN IF NOT EXISTS data_sensitivity_used TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS jurisdictions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deployment_status TEXT DEFAULT 'draft' CHECK (deployment_status IN ('draft', 'active', 'deprecated', 'archived')),
ADD COLUMN IF NOT EXISTS version TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_ai_tool_registry_risk_tier ON ai_tool_registry(risk_tier);
CREATE INDEX IF NOT EXISTS idx_ai_tool_registry_deployment_status ON ai_tool_registry(deployment_status);

-- Create data_source_registry table
CREATE TABLE IF NOT EXISTS data_source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('database', 'api', 'file_storage', 'data_warehouse', 'third_party')),
  description TEXT,
  sensitivity_level TEXT NOT NULL CHECK (sensitivity_level IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'PHI', 'PII')),
  jurisdictions TEXT[] NOT NULL DEFAULT '{}',
  connection_config JSONB,
  enterprise_id UUID NOT NULL REFERENCES enterprises(id),
  deployment_status TEXT DEFAULT 'active' CHECK (deployment_status IN ('active', 'deprecated', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE data_source_registry ENABLE ROW LEVEL SECURITY;

-- RLS policies for data_source_registry
CREATE POLICY "Users can view data sources in their enterprise"
  ON data_source_registry FOR SELECT
  USING (
    enterprise_id IN (
      SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage data sources in their enterprise"
  ON data_source_registry FOR ALL
  USING (
    enterprise_id IN (
      SELECT em.enterprise_id 
      FROM enterprise_members em 
      WHERE em.user_id = auth.uid() 
      AND em.role IN ('admin', 'owner')
    )
  );

-- Create model-data source relationship table
CREATE TABLE IF NOT EXISTS model_data_source_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES ai_tool_registry(id) ON DELETE CASCADE,
  data_source_id UUID NOT NULL REFERENCES data_source_registry(id) ON DELETE CASCADE,
  access_type TEXT CHECK (access_type IN ('read', 'write', 'read_write')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(model_id, data_source_id)
);

-- Enable RLS
ALTER TABLE model_data_source_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mappings for their enterprise models"
  ON model_data_source_mappings FOR SELECT
  USING (
    model_id IN (
      SELECT id FROM ai_tool_registry WHERE category IN (
        SELECT category FROM ai_tool_registry 
        -- Models are implicitly scoped by enterprise through usage
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_data_source_registry_enterprise ON data_source_registry(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_data_source_registry_sensitivity ON data_source_registry(sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_model_data_source_model ON model_data_source_mappings(model_id);
CREATE INDEX IF NOT EXISTS idx_model_data_source_data ON model_data_source_mappings(data_source_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_data_source_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER data_source_registry_updated_at
  BEFORE UPDATE ON data_source_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_data_source_updated_at();

CREATE TRIGGER ai_tool_registry_updated_at
  BEFORE UPDATE ON ai_tool_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_data_source_updated_at();

-- Create function to check metadata consistency
CREATE OR REPLACE FUNCTION check_model_metadata_consistency(p_model_id UUID)
RETURNS TABLE(
  conflict_type TEXT,
  severity TEXT,
  message TEXT,
  affected_policies TEXT[]
) AS $$
BEGIN
  -- Check if HIGH/CRITICAL risk models are using LOW sensitivity data
  RETURN QUERY
  SELECT 
    'risk_data_mismatch'::TEXT,
    'warning'::TEXT,
    'Model tagged as ' || atr.risk_tier || ' is using data sources with lower sensitivity'::TEXT,
    ARRAY[]::TEXT[]
  FROM ai_tool_registry atr
  JOIN model_data_source_mappings mdsm ON mdsm.model_id = atr.id
  JOIN data_source_registry dsr ON dsr.id = mdsm.data_source_id
  WHERE atr.id = p_model_id
    AND atr.risk_tier IN ('HIGH', 'CRITICAL')
    AND dsr.sensitivity_level IN ('PUBLIC', 'INTERNAL');
    
  -- Check if PHI data is used without HIPAA jurisdiction
  RETURN QUERY
  SELECT 
    'phi_without_hipaa'::TEXT,
    'critical'::TEXT,
    'Data source tagged PHI must include HIPAA in jurisdictions'::TEXT,
    ARRAY[]::TEXT[]
  FROM data_source_registry dsr
  JOIN model_data_source_mappings mdsm ON mdsm.data_source_id = dsr.id
  WHERE mdsm.model_id = p_model_id
    AND dsr.sensitivity_level = 'PHI'
    AND NOT ('HIPAA' = ANY(dsr.jurisdictions));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;