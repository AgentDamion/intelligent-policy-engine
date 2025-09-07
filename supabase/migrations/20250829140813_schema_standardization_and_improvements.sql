-- ================================
-- AICOMPLYR.IO — SCHEMA STANDARDIZATION & IMPROVEMENTS
-- ================================
-- This migration standardizes the schema to use enterprise_id consistently
-- and incorporates suggested improvements while maintaining backward compatibility

-- ========== SCHEMA STANDARDIZATION ==========

-- 1. Add enterprise_id columns to existing tables for backward compatibility
DO $$ BEGIN
  -- Add enterprise_id to workspaces if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workspaces' AND column_name = 'enterprise_id') THEN
    ALTER TABLE workspaces ADD COLUMN enterprise_id UUID;
  END IF;
  
  -- Add enterprise_id to policies if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'policies' AND column_name = 'enterprise_id') THEN
    ALTER TABLE policies ADD COLUMN enterprise_id UUID;
  END IF;
  
  -- Add enterprise_id to policy_templates if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'policy_templates' AND column_name = 'enterprise_id') THEN
    ALTER TABLE policy_templates ADD COLUMN enterprise_id UUID;
  END IF;
  
  -- Add enterprise_id to policy_distribution if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'policy_distribution' AND column_name = 'enterprise_id') THEN
    ALTER TABLE policy_distribution ADD COLUMN enterprise_id UUID;
  END IF;
  
  -- Add enterprise_id to audit_entries if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'audit_entries' AND column_name = 'enterprise_id') THEN
    ALTER TABLE audit_entries ADD COLUMN enterprise_id UUID;
  END IF;
  
  -- Add enterprise_id to cost_centers if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cost_centers' AND column_name = 'enterprise_id') THEN
    ALTER TABLE cost_centers ADD COLUMN enterprise_id UUID;
  END IF;
  
  -- Add enterprise_id to billing_accounts if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'billing_accounts' AND column_name = 'enterprise_id') THEN
    ALTER TABLE billing_accounts ADD COLUMN enterprise_id UUID;
  END IF;
  
  -- Add enterprise_id to contracts if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'enterprise_id') THEN
    ALTER TABLE contracts ADD COLUMN enterprise_id UUID;
  END IF;
  
  -- Add enterprise_id to users_enhanced if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users_enhanced' AND column_name = 'enterprise_id') THEN
    ALTER TABLE users_enhanced ADD COLUMN enterprise_id UUID;
  END IF;
END $$;

-- 2. Create a mapping table for organization_id to enterprise_id conversion
CREATE TABLE IF NOT EXISTS organization_enterprise_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, enterprise_id)
);

-- 3. Function to populate enterprise_id from organization_id
CREATE OR REPLACE FUNCTION populate_enterprise_ids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_record RECORD;
BEGIN
  -- For each organization, create an enterprise if it doesn't exist
  FOR org_record IN 
    SELECT DISTINCT o.id, o.name, o.type, o.competitive_group, o.industry, o.size, o.settings, o.status
    FROM organizations_enhanced o
    WHERE o.id NOT IN (SELECT organization_id FROM organization_enterprise_mapping)
  LOOP
    -- Create enterprise
    INSERT INTO enterprises (id, name, created_at)
    VALUES (org_record.id, org_record.name, org_record.created_at)
    ON CONFLICT (id) DO NOTHING;
    
    -- Create mapping
    INSERT INTO organization_enterprise_mapping (organization_id, enterprise_id)
    VALUES (org_record.id, org_record.id)
    ON CONFLICT (organization_id, enterprise_id) DO NOTHING;
    
    -- Update enterprise_id in related tables
    UPDATE workspaces SET enterprise_id = org_record.id WHERE organization_id = org_record.id;
    UPDATE policies SET enterprise_id = org_record.id WHERE organization_id = org_record.id;
    UPDATE policy_templates SET enterprise_id = org_record.id WHERE organization_id = org_record.id;
    UPDATE policy_distribution SET enterprise_id = org_record.id WHERE organization_id = org_record.id;
    UPDATE audit_entries SET enterprise_id = org_record.id WHERE organization_id = org_record.id;
    UPDATE cost_centers SET enterprise_id = org_record.id WHERE organization_id = org_record.id;
    UPDATE billing_accounts SET enterprise_id = org_record.id WHERE organization_id = org_record.id;
    UPDATE contracts SET enterprise_id = org_record.id WHERE organization_id = org_record.id;
    UPDATE users_enhanced SET enterprise_id = org_record.id WHERE organization_id = org_record.id;
  END LOOP;
END;
$$;

-- 4. Execute the population function
SELECT populate_enterprise_ids();

-- ========== TABLE IMPROVEMENTS ==========

-- 5. Improve workspaces table
ALTER TABLE workspaces 
  ALTER COLUMN name SET DATA TYPE TEXT,
  ALTER COLUMN name SET NOT NULL,
  ADD CONSTRAINT workspaces_name_length CHECK (length(name) > 0),
  ALTER COLUMN enterprise_name SET DATA TYPE TEXT,
  ALTER COLUMN enterprise_name SET NOT NULL,
  ADD CONSTRAINT workspaces_enterprise_name_length CHECK (length(enterprise_name) > 0),
  ALTER COLUMN created_at SET DATA TYPE TIMESTAMPTZ,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW();

-- 6. Improve invitation_keys table
ALTER TABLE invitation_keys 
  ALTER COLUMN token SET DATA TYPE TEXT,
  ALTER COLUMN token SET NOT NULL,
  ADD CONSTRAINT invitation_keys_token_length CHECK (length(token) > 0),
  ADD CONSTRAINT invitation_keys_token_unique UNIQUE (token),
  ALTER COLUMN email SET DATA TYPE TEXT,
  ALTER COLUMN email SET NOT NULL,
  ADD CONSTRAINT invitation_keys_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ALTER COLUMN role SET DATA TYPE TEXT,
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'partner_user',
  ALTER COLUMN expires_at SET DATA TYPE TIMESTAMPTZ,
  ALTER COLUMN expires_at SET NOT NULL,
  ALTER COLUMN used SET DATA TYPE BOOLEAN,
  ALTER COLUMN used SET NOT NULL,
  ALTER COLUMN used SET DEFAULT FALSE,
  ALTER COLUMN created_at SET DATA TYPE TIMESTAMPTZ,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW();

-- 7. Improve tool_submissions table (rename from local_submissions if needed)
DO $$ BEGIN
  -- Rename local_submissions to tool_submissions if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'local_submissions') THEN
    ALTER TABLE local_submissions RENAME TO tool_submissions;
  END IF;
END $$;

-- Create tool_submissions if it doesn't exist
CREATE TABLE IF NOT EXISTS tool_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  submitted_by TEXT NOT NULL CHECK (length(submitted_by) > 0),
  tool_name TEXT NOT NULL CHECK (length(tool_name) > 0),
  vendor TEXT,
  category TEXT,
  use_case TEXT,
  risk_level TEXT,
  mlr_required BOOLEAN,
  meta_loop_score JSONB,
  policy_version TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Add enterprise_id to tool_submissions
ALTER TABLE tool_submissions ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE;

-- ========== RLS IMPROVEMENTS ==========

-- 9. Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_enterprise_mapping ENABLE ROW LEVEL SECURITY;

-- 10. Create improved RLS policies
-- Workspaces: visible to enterprise members
DROP POLICY IF EXISTS "Workspaces enterprise access" ON workspaces;
CREATE POLICY "Workspaces enterprise access" ON workspaces
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprise_members em 
      WHERE em.enterprise_id = workspaces.enterprise_id 
      AND em.user_id = auth.uid()
    )
  );

-- Invitation keys: invitee can read own invites, workspace members can manage
DROP POLICY IF EXISTS "Invitation keys access" ON invitation_keys;
CREATE POLICY "Invitation keys access" ON invitation_keys
  FOR SELECT TO authenticated
  USING (
    email = (SELECT auth.email()) OR
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = invitation_keys.workspace_id 
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Invitation keys management" ON invitation_keys
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = invitation_keys.workspace_id 
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Tool submissions: workspace members can view, submitter can manage own
DROP POLICY IF EXISTS "Tool submissions access" ON tool_submissions;
CREATE POLICY "Tool submissions access" ON tool_submissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = tool_submissions.workspace_id 
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Tool submissions management" ON tool_submissions
  FOR ALL TO authenticated
  USING (
    submitted_by = (SELECT auth.email()) OR
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = tool_submissions.workspace_id 
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- ========== INDEX IMPROVEMENTS ==========

-- 11. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_enterprise_name ON workspaces(enterprise_name);
CREATE INDEX IF NOT EXISTS idx_invitation_keys_email ON invitation_keys(email);
CREATE INDEX IF NOT EXISTS idx_invitation_keys_token ON invitation_keys(token);
CREATE INDEX IF NOT EXISTS idx_tool_submissions_workspace ON tool_submissions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tool_submissions_status ON tool_submissions(status);
CREATE INDEX IF NOT EXISTS idx_tool_submissions_submitted_by ON tool_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_organization_enterprise_mapping_org ON organization_enterprise_mapping(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_enterprise_mapping_ent ON organization_enterprise_mapping(enterprise_id);

-- ========== BACKWARD COMPATIBILITY VIEWS ==========

-- 12. Create views for backward compatibility
CREATE OR REPLACE VIEW organizations_enhanced_compat AS
SELECT 
  o.*,
  e.id as enterprise_id,
  e.name as enterprise_name
FROM organizations_enhanced o
LEFT JOIN organization_enterprise_mapping oem ON o.id = oem.organization_id
LEFT JOIN enterprises e ON oem.enterprise_id = e.id;

-- ========== CLEANUP ==========

-- 13. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON 
  organization_enterprise_mapping,
  tool_submissions
TO authenticated;

-- 14. Add comments for documentation
COMMENT ON TABLE organization_enterprise_mapping IS 'Mapping table for backward compatibility between organization_id and enterprise_id';
COMMENT ON TABLE tool_submissions IS 'Improved tool submission tracking with enterprise isolation';
COMMENT ON COLUMN workspaces.enterprise_id IS 'Enterprise ID for multi-tenancy (backward compatible with organization_id)';

-- ================================
-- END MIGRATION
-- ================================
