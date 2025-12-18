-- Create sandbox_projects table
CREATE TABLE IF NOT EXISTS public.sandbox_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Project metadata
  project_name TEXT NOT NULL,
  project_description TEXT,
  project_goal TEXT,
  
  -- Organizational context
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  -- Ownership
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Project lifecycle
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'archived'
  started_at TIMESTAMPTZ DEFAULT now(),
  target_completion_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  tags JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Stats (computed via triggers)
  total_runs INTEGER DEFAULT 0,
  passed_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_sandbox_projects_workspace ON public.sandbox_projects(workspace_id);
CREATE INDEX idx_sandbox_projects_enterprise ON public.sandbox_projects(enterprise_id);
CREATE INDEX idx_sandbox_projects_status ON public.sandbox_projects(status);
CREATE INDEX idx_sandbox_projects_created_by ON public.sandbox_projects(created_by);

-- Updated_at trigger
CREATE TRIGGER update_sandbox_projects_updated_at
  BEFORE UPDATE ON public.sandbox_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add project_id to sandbox_runs
ALTER TABLE public.sandbox_runs 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.sandbox_projects(id) ON DELETE SET NULL;

-- Index for filtering runs by project
CREATE INDEX IF NOT EXISTS idx_sandbox_runs_project ON public.sandbox_runs(project_id);

-- Function to update project stats when runs are added/updated
CREATE OR REPLACE FUNCTION update_sandbox_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.sandbox_projects
    SET 
      total_runs = (
        SELECT COUNT(*) FROM sandbox_runs WHERE project_id = NEW.project_id
      ),
      passed_runs = (
        SELECT COUNT(*) FROM sandbox_runs 
        WHERE project_id = NEW.project_id 
        AND outputs_json->>'validation_result' = 'pass'
      ),
      failed_runs = (
        SELECT COUNT(*) FROM sandbox_runs 
        WHERE project_id = NEW.project_id 
        AND outputs_json->>'validation_result' = 'fail'
      ),
      updated_at = now()
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_project_stats
  AFTER INSERT OR UPDATE ON public.sandbox_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_sandbox_project_stats();

-- RLS Policies
ALTER TABLE public.sandbox_projects ENABLE ROW LEVEL SECURITY;

-- Users can view projects in their workspace
CREATE POLICY "Users can view workspace sandbox projects"
  ON public.sandbox_projects FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create projects in their workspace
CREATE POLICY "Users can create workspace sandbox projects"
  ON public.sandbox_projects FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update projects they created or have admin role
CREATE POLICY "Users can update their sandbox projects"
  ON public.sandbox_projects FOR UPDATE
  USING (
    created_by = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Users can delete projects they created or have admin role
CREATE POLICY "Users can delete their sandbox projects"
  ON public.sandbox_projects FOR DELETE
  USING (
    created_by = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );