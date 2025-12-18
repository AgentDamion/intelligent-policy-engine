-- Add mode column to sandbox_projects table
ALTER TABLE sandbox_projects 
ADD COLUMN IF NOT EXISTS mode text 
CHECK (mode IN ('tool_evaluation', 'policy_adaptation', 'partner_governance'));

-- Set default mode for existing projects
UPDATE sandbox_projects 
SET mode = 'tool_evaluation' 
WHERE mode IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN sandbox_projects.mode IS 'Project mode: tool_evaluation (compliance testing), policy_adaptation (template customization), partner_governance (multi-tenant workflows)';