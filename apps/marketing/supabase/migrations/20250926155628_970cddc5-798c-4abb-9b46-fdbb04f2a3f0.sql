-- Enhanced Real-Time Collaboration Database Schema

-- Document sections tracking for granular collaboration
CREATE TABLE public.document_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'policy', 'submission', 'evidence', etc.
  section_name TEXT NOT NULL,
  section_path TEXT NOT NULL, -- JSON path or identifier
  content_hash TEXT, -- For change detection
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document annotations and comments
CREATE TABLE public.document_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  section_id UUID REFERENCES public.document_sections(id),
  user_id UUID NOT NULL,
  annotation_type TEXT NOT NULL DEFAULT 'comment', -- 'comment', 'suggestion', 'approval', 'concern'
  content TEXT NOT NULL,
  position_data JSONB DEFAULT '{}', -- Stores cursor position, selection range, etc.
  parent_id UUID REFERENCES public.document_annotations(id), -- For threaded comments
  status TEXT DEFAULT 'active', -- 'active', 'resolved', 'archived'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced collaboration sessions
CREATE TABLE public.collaboration_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'viewing', -- 'viewing', 'editing', 'reviewing', 'approving', 'commenting', 'validating'
  section_id UUID REFERENCES public.document_sections(id),
  presence_data JSONB DEFAULT '{}', -- Cursor position, selection, activity details
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- In-app messaging for collaboration
CREATE TABLE public.collaboration_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID,
  document_type TEXT,
  workspace_id UUID,
  sender_id UUID NOT NULL,
  recipient_id UUID, -- NULL for group messages
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'voice', 'system', 'mention'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Voice note URLs, mentions, etc.
  thread_id UUID REFERENCES public.collaboration_messages(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced approval workflows
CREATE TABLE public.approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  workspace_id UUID,
  enterprise_id UUID,
  workflow_name TEXT NOT NULL,
  current_stage TEXT NOT NULL,
  stages JSONB NOT NULL, -- Array of stage definitions
  assignees JSONB DEFAULT '[]', -- Current stage assignees
  progress_percentage INTEGER DEFAULT 0,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  bottleneck_detected BOOLEAN DEFAULT false,
  escalation_triggered BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conflict resolution tracking
CREATE TABLE public.conflict_resolutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  section_id UUID REFERENCES public.document_sections(id),
  conflict_type TEXT NOT NULL, -- 'concurrent_edit', 'policy_conflict', 'approval_conflict'
  users_involved UUID[] NOT NULL,
  conflict_data JSONB NOT NULL, -- Original conflicting changes
  resolution_method TEXT, -- 'manual', 'auto_merge', 'latest_wins', 'expert_decision'
  resolved_by UUID,
  resolution_data JSONB,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_resolutions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_sections
CREATE POLICY "Users can view document sections for accessible documents"
ON public.document_sections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND (
      (document_type = 'policy' AND EXISTS (
        SELECT 1 FROM policies p WHERE p.id::text = document_id::text 
        AND p.enterprise_id = ANY(get_user_enterprises(auth.uid()))
      ))
      OR
      (document_type = 'submission' AND EXISTS (
        SELECT 1 FROM submissions s WHERE s.id::text = document_id::text 
        AND s.workspace_id = wm.workspace_id
      ))
    )
  )
);

CREATE POLICY "Users can create document sections for accessible documents"
ON public.document_sections FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND (
      (document_type = 'policy' AND EXISTS (
        SELECT 1 FROM policies p WHERE p.id::text = document_id::text 
        AND p.enterprise_id = ANY(get_user_enterprises(auth.uid()))
      ))
      OR
      (document_type = 'submission' AND EXISTS (
        SELECT 1 FROM submissions s WHERE s.id::text = document_id::text 
        AND s.workspace_id = wm.workspace_id
      ))
    )
  )
);

-- RLS Policies for document_annotations
CREATE POLICY "Users can view annotations for accessible documents"
ON public.document_annotations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND (
      (document_type = 'policy' AND EXISTS (
        SELECT 1 FROM policies p WHERE p.id::text = document_id::text 
        AND p.enterprise_id = ANY(get_user_enterprises(auth.uid()))
      ))
      OR
      (document_type = 'submission' AND EXISTS (
        SELECT 1 FROM submissions s WHERE s.id::text = document_id::text 
        AND s.workspace_id = wm.workspace_id
      ))
    )
  )
);

CREATE POLICY "Users can create annotations for accessible documents"
ON public.document_annotations FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND (
      (document_type = 'policy' AND EXISTS (
        SELECT 1 FROM policies p WHERE p.id::text = document_id::text 
        AND p.enterprise_id = ANY(get_user_enterprises(auth.uid()))
      ))
      OR
      (document_type = 'submission' AND EXISTS (
        SELECT 1 FROM submissions s WHERE s.id::text = document_id::text 
        AND s.workspace_id = wm.workspace_id
      ))
    )
  )
);

CREATE POLICY "Users can update their own annotations"
ON public.document_annotations FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for collaboration_sessions
CREATE POLICY "Users can manage their own collaboration sessions"
ON public.collaboration_sessions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view active collaboration sessions for accessible documents"
ON public.collaboration_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND (
      (document_type = 'policy' AND EXISTS (
        SELECT 1 FROM policies p WHERE p.id::text = document_id::text 
        AND p.enterprise_id = ANY(get_user_enterprises(auth.uid()))
      ))
      OR
      (document_type = 'submission' AND EXISTS (
        SELECT 1 FROM submissions s WHERE s.id::text = document_id::text 
        AND s.workspace_id = wm.workspace_id
      ))
    )
  )
);

-- RLS Policies for collaboration_messages
CREATE POLICY "Users can view messages in their workspace or as participants"
ON public.collaboration_messages FOR SELECT
USING (
  sender_id = auth.uid() OR 
  recipient_id = auth.uid() OR
  (workspace_id IS NOT NULL AND workspace_id = ANY(get_user_workspaces(auth.uid())))
);

CREATE POLICY "Users can send messages in accessible contexts"
ON public.collaboration_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  (workspace_id IS NULL OR workspace_id = ANY(get_user_workspaces(auth.uid())))
);

-- RLS Policies for approval_workflows
CREATE POLICY "Users can view approval workflows for accessible documents"
ON public.approval_workflows FOR SELECT
USING (
  (workspace_id IS NOT NULL AND workspace_id = ANY(get_user_workspaces(auth.uid()))) OR
  (enterprise_id IS NOT NULL AND enterprise_id = ANY(get_user_enterprises(auth.uid())))
);

CREATE POLICY "Users can create approval workflows for accessible documents"
ON public.approval_workflows FOR INSERT
WITH CHECK (
  (workspace_id IS NOT NULL AND workspace_id = ANY(get_user_workspaces(auth.uid()))) OR
  (enterprise_id IS NOT NULL AND enterprise_id = ANY(get_user_enterprises(auth.uid())))
);

CREATE POLICY "Users can update approval workflows in their context"
ON public.approval_workflows FOR UPDATE
USING (
  (workspace_id IS NOT NULL AND workspace_id = ANY(get_user_workspaces(auth.uid()))) OR
  (enterprise_id IS NOT NULL AND enterprise_id = ANY(get_user_enterprises(auth.uid())))
);

-- RLS Policies for conflict_resolutions
CREATE POLICY "Users can view conflicts for accessible documents"
ON public.conflict_resolutions FOR SELECT
USING (
  auth.uid() = ANY(users_involved) OR
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND (
      (document_type = 'policy' AND EXISTS (
        SELECT 1 FROM policies p WHERE p.id::text = document_id::text 
        AND p.enterprise_id = ANY(get_user_enterprises(auth.uid()))
      ))
      OR
      (document_type = 'submission' AND EXISTS (
        SELECT 1 FROM submissions s WHERE s.id::text = document_id::text 
        AND s.workspace_id = wm.workspace_id
      ))
    )
  )
);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_document_sections_updated_at
    BEFORE UPDATE ON public.document_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_annotations_updated_at
    BEFORE UPDATE ON public.document_annotations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
    BEFORE UPDATE ON public.approval_workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_document_sections_document_id ON public.document_sections(document_id, document_type);
CREATE INDEX idx_document_annotations_document_id ON public.document_annotations(document_id, document_type);
CREATE INDEX idx_collaboration_sessions_user_document ON public.collaboration_sessions(user_id, document_id, is_active);
CREATE INDEX idx_collaboration_messages_document ON public.collaboration_messages(document_id, created_at);
CREATE INDEX idx_approval_workflows_document ON public.approval_workflows(document_id, document_type);
CREATE INDEX idx_conflict_resolutions_document ON public.conflict_resolutions(document_id, resolved_at);