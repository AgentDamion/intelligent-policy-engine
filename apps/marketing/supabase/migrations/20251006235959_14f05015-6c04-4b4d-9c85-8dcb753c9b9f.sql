-- Phase 1, Step 1: Tool Disclosure & Validation Database Schema

-- Extend policy_versions table with policy pack fields
ALTER TABLE policy_versions 
ADD COLUMN IF NOT EXISTS tool_whitelist jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS control_mappings jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS jurisdictions text[] DEFAULT ARRAY[]::text[];

-- Create rfp_tool_disclosures table
CREATE TABLE IF NOT EXISTS rfp_tool_disclosures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id uuid REFERENCES policy_distributions(id) ON DELETE CASCADE NOT NULL,
  tool_id uuid,
  tool_name text NOT NULL,
  version text,
  provider text,
  intended_use text,
  data_scope jsonb DEFAULT '{}'::jsonb,
  connectors text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_rfp_tool_disclosures_distribution ON rfp_tool_disclosures(distribution_id);

-- Create policy_resolutions table
CREATE TABLE IF NOT EXISTS policy_resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id uuid REFERENCES policy_distributions(id) ON DELETE CASCADE NOT NULL,
  resolution_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_policy_resolutions_distribution ON policy_resolutions(distribution_id);

-- Enable RLS on rfp_tool_disclosures
ALTER TABLE rfp_tool_disclosures ENABLE ROW LEVEL SECURITY;

-- Agency members can manage their RFP tool disclosures
CREATE POLICY "Agency members can manage their RFP tool disclosures"
ON rfp_tool_disclosures
FOR ALL
USING (
  distribution_id IN (
    SELECT pd.id 
    FROM policy_distributions pd
    JOIN workspace_members wm ON wm.workspace_id = pd.target_workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

-- Enterprise members can view tool disclosures for RFPs they sent
CREATE POLICY "Enterprise members can view tool disclosures for their RFPs"
ON rfp_tool_disclosures
FOR SELECT
USING (
  distribution_id IN (
    SELECT pd.id
    FROM policy_distributions pd
    JOIN policy_versions pv ON pv.id = pd.policy_version_id
    JOIN policies p ON p.id = pv.policy_id
    WHERE p.enterprise_id IN (
      SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()
    )
  )
);

-- Enable RLS on policy_resolutions
ALTER TABLE policy_resolutions ENABLE ROW LEVEL SECURITY;

-- Users can view policy resolutions for RFPs they have access to
CREATE POLICY "Users can view policy resolutions for accessible RFPs"
ON policy_resolutions
FOR SELECT
USING (
  distribution_id IN (
    SELECT pd.id 
    FROM policy_distributions pd
    WHERE pd.target_workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM policy_versions pv
      JOIN policies p ON p.id = pv.policy_id
      WHERE pv.id = pd.policy_version_id
        AND p.enterprise_id IN (
          SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()
        )
    )
  )
);

-- Create trigger function for updated_at on rfp_tool_disclosures
CREATE OR REPLACE FUNCTION update_rfp_tool_disclosures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to rfp_tool_disclosures
CREATE TRIGGER set_rfp_tool_disclosures_updated_at
BEFORE UPDATE ON rfp_tool_disclosures
FOR EACH ROW
EXECUTE FUNCTION update_rfp_tool_disclosures_updated_at();