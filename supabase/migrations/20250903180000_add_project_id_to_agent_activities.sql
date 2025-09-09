-- ================================
-- ADD PROJECT_ID TO AGENT_ACTIVITIES
-- ================================
-- This migration adds project_id as a foreign key to agent_activities table

-- Add project_id column to agent_activities table
ALTER TABLE public.agent_activities 
ADD COLUMN IF NOT EXISTS project_id UUID;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_agent_activities_project_id ON public.agent_activities(project_id);

-- Update RLS policy to include project-based access
DROP POLICY IF EXISTS "Users can view activities in their context" ON public.agent_activities;

CREATE POLICY "Users can view activities in their context" ON public.agent_activities
    FOR SELECT TO authenticated USING (
        enterprise_id IN (
            SELECT enterprise_id FROM public.enterprise_members 
            WHERE user_id = auth.uid()
        ) OR
        workspace_id IN (
            SELECT id FROM public.workspaces w
            JOIN public.enterprise_members em ON w.enterprise_id = em.enterprise_id
            WHERE em.user_id = auth.uid()
        ) OR
        project_id IN (
            SELECT p.id FROM public.projects p
            JOIN public.enterprise_members em ON p.organization_id = em.enterprise_id
            WHERE em.user_id = auth.uid()
        )
    );

-- Add constraint to projects table if it exists
DO $$
BEGIN
    -- Check if projects table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
        -- Add foreign key constraint
        ALTER TABLE public.agent_activities 
        ADD CONSTRAINT fk_agent_activities_project_id 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key constraint added to projects table';
    ELSE
        RAISE NOTICE 'Projects table does not exist yet, skipping foreign key constraint';
    END IF;
END $$;

-- Add platform integration tracking columns
ALTER TABLE public.agent_activities 
  ADD COLUMN IF NOT EXISTS platform_integration_status VARCHAR(20) DEFAULT 'pending' CHECK (platform_integration_status IN ('pending','processing','completed','failed')),
  ADD COLUMN IF NOT EXISTS platform_integration_errors JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_agent_activities_integration_status ON public.agent_activities(platform_integration_status);
