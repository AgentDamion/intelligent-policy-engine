-- Create partner_knowledge_base table for storing partner documentation
CREATE TABLE IF NOT EXISTS public.partner_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'policy', 'certificate', 'process_doc', 'training_material', 'audit_report'
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- Full text content for AI processing
  file_url TEXT, -- Storage path if file uploaded
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_knowledge_base_workspace ON public.partner_knowledge_base(workspace_id);
CREATE INDEX idx_knowledge_base_type ON public.partner_knowledge_base(document_type);
CREATE INDEX idx_knowledge_base_tags ON public.partner_knowledge_base USING GIN(tags);

-- Enable RLS
ALTER TABLE public.partner_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Workspace members can view knowledge base
CREATE POLICY "Workspace members can view knowledge base"
ON public.partner_knowledge_base
FOR SELECT
USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

-- Workspace members can create knowledge base entries
CREATE POLICY "Workspace members can create knowledge base entries"
ON public.partner_knowledge_base
FOR INSERT
WITH CHECK (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  AND uploaded_by = auth.uid()
);

-- Workspace members can update their knowledge base entries
CREATE POLICY "Workspace members can update knowledge base entries"
ON public.partner_knowledge_base
FOR UPDATE
USING (
  workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);

-- Workspace admins can delete knowledge base entries
CREATE POLICY "Workspace admins can delete knowledge base entries"
ON public.partner_knowledge_base
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.partner_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();