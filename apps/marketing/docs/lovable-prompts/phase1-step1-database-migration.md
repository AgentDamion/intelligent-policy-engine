# Phase 1, Step 1: Database Migration - Tool Disclosure & Validation

## Prompt to paste into Lovable:

```
Create a database migration to extend the policy system with tool disclosure and validation capabilities.

EXTEND the following existing table:
- policy_versions: Add columns for tool_whitelist (jsonb), control_mappings (jsonb), and jurisdictions (text[])

CREATE the following new tables:

1. rfp_tool_disclosures
   - Links to policy_distributions (the RFP)
   - Stores tool name, version, provider, intended_use, data_scope (jsonb), connectors (text[])
   - Tracks created_at, updated_at

2. policy_resolutions
   - Stores validation results for RFP tool disclosures
   - Links to policy_distributions
   - Contains resolution_data (jsonb) with per-tool compliance status
   - Tracks overall_score (0-100), created_at

IMPORTANT RLS Requirements:
- rfp_tool_disclosures: Agency members can CRUD their own RFP disclosures; Enterprise members can view disclosures for RFPs they sent
- policy_resolutions: Anyone who can view the RFP can view the resolution

Use proper foreign key constraints and indexes for performance.
```

## Expected SQL (reference):

```sql
-- Extend policy_versions
ALTER TABLE policy_versions 
ADD COLUMN IF NOT EXISTS tool_whitelist jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS control_mappings jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS jurisdictions text[] DEFAULT ARRAY[]::text[];

-- Create rfp_tool_disclosures
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

-- Create policy_resolutions
CREATE TABLE IF NOT EXISTS policy_resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id uuid REFERENCES policy_distributions(id) ON DELETE CASCADE NOT NULL,
  resolution_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_policy_resolutions_distribution ON policy_resolutions(distribution_id);

-- RLS for rfp_tool_disclosures
ALTER TABLE rfp_tool_disclosures ENABLE ROW LEVEL SECURITY;

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

-- RLS for policy_resolutions
ALTER TABLE policy_resolutions ENABLE ROW LEVEL SECURITY;

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

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_rfp_tool_disclosures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_rfp_tool_disclosures_updated_at
BEFORE UPDATE ON rfp_tool_disclosures
FOR EACH ROW
EXECUTE FUNCTION update_rfp_tool_disclosures_updated_at();
```

## RLS Security Checklist:
- ✅ Agency members can create/read/update/delete their own tool disclosures
- ✅ Enterprise members can view tool disclosures for RFPs they distributed
- ✅ Both parties can view policy resolutions for accessible RFPs
- ✅ No public access without authentication
- ✅ Proper cascading deletes when RFP is deleted
