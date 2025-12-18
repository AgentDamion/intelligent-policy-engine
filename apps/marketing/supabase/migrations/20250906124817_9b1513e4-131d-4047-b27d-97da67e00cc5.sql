-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_description TEXT,
  expected_delivery_date DATE,
  workspace_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_tool_usage table
CREATE TABLE public.ai_tool_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  how_it_was_used TEXT NOT NULL,
  files_created TEXT[], -- Array of file paths/names
  date_used DATE NOT NULL,
  workspace_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Workspace members can view projects" 
ON public.projects 
FOR SELECT 
USING (workspace_id = ANY (get_user_workspaces(auth.uid())));

CREATE POLICY "Workspace members can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (workspace_id = ANY (get_user_workspaces(auth.uid())) AND has_workspace_role(auth.uid(), workspace_id, 'member'::app_role));

CREATE POLICY "Project creators and workspace admins can update projects" 
ON public.projects 
FOR UPDATE 
USING ((created_by = auth.uid()) OR has_workspace_role(auth.uid(), workspace_id, 'admin'::app_role));

-- RLS Policies for ai_tool_usage
CREATE POLICY "Workspace members can view ai tool usage" 
ON public.ai_tool_usage 
FOR SELECT 
USING (workspace_id = ANY (get_user_workspaces(auth.uid())));

CREATE POLICY "Workspace members can create ai tool usage records" 
ON public.ai_tool_usage 
FOR INSERT 
WITH CHECK (workspace_id = ANY (get_user_workspaces(auth.uid())) AND has_workspace_role(auth.uid(), workspace_id, 'member'::app_role));

CREATE POLICY "Record creators and workspace admins can update ai tool usage" 
ON public.ai_tool_usage 
FOR UPDATE 
USING ((created_by = auth.uid()) OR has_workspace_role(auth.uid(), workspace_id, 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_ai_tool_usage_workspace_id ON public.ai_tool_usage(workspace_id);
CREATE INDEX idx_ai_tool_usage_project_id ON public.ai_tool_usage(project_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_tool_usage_updated_at
BEFORE UPDATE ON public.ai_tool_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();