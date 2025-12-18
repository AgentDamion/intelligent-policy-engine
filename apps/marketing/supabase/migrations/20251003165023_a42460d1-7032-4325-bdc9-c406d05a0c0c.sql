-- Link existing workspaces to enterprises + auto-link future workspaces

-- Step 1: Link existing workspaces to their correct enterprises
UPDATE workspaces
SET enterprise_id = '550e8400-e29b-41d4-a716-446655440002'
WHERE id = '550e8400-e29b-41d4-a716-446655440002'
  AND enterprise_id IS NULL;

UPDATE workspaces
SET enterprise_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE id = '660e8400-e29b-41d4-a716-446655440001'
  AND enterprise_id IS NULL;

-- For any remaining unlinked workspaces, infer from enterprise_members
UPDATE workspaces w
SET enterprise_id = (
  SELECT em.enterprise_id
  FROM workspace_members wm
  JOIN enterprise_members em ON em.user_id = wm.user_id
  WHERE wm.workspace_id = w.id
  LIMIT 1
)
WHERE w.enterprise_id IS NULL
  AND EXISTS (
    SELECT 1 FROM workspace_members WHERE workspace_id = w.id
  );

-- Step 2: Create trigger to auto-populate enterprise_id for new workspaces
CREATE OR REPLACE FUNCTION public.auto_link_workspace_to_enterprise()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.enterprise_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.created_by IS NOT NULL THEN
    SELECT enterprise_id INTO NEW.enterprise_id
    FROM enterprise_members
    WHERE user_id = NEW.created_by
    LIMIT 1;
  END IF;

  IF NEW.enterprise_id IS NULL THEN
    SELECT enterprise_id INTO NEW.enterprise_id
    FROM enterprise_members
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_link_workspace_enterprise ON workspaces;
CREATE TRIGGER auto_link_workspace_enterprise
  BEFORE INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_workspace_to_enterprise();

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_enterprise_id ON workspaces(enterprise_id);