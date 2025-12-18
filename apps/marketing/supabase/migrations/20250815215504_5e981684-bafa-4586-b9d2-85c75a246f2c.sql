-- Create compliance metrics table
CREATE TABLE public.compliance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  tools_approved INTEGER NOT NULL DEFAULT 0,
  tools_flagged INTEGER NOT NULL DEFAULT 0,
  metaloop_learnings INTEGER NOT NULL DEFAULT 0,
  compliance_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent statuses table
CREATE TABLE public.agent_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'idle',
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create active workflows table
CREATE TABLE public.active_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  workflow_name VARCHAR(255) NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quick actions table
CREATE TABLE public.quick_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  action_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  action_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization-based access
CREATE POLICY "Users can view organization compliance metrics" 
ON public.compliance_metrics FOR SELECT 
USING (organization_id IN (
  SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
));

CREATE POLICY "Users can view organization agent statuses" 
ON public.agent_statuses FOR SELECT 
USING (organization_id IN (
  SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
));

CREATE POLICY "Users can view organization workflows" 
ON public.active_workflows FOR SELECT 
USING (organization_id IN (
  SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
));

CREATE POLICY "Users can view organization quick actions" 
ON public.quick_actions FOR SELECT 
USING (organization_id IN (
  SELECT organization_id FROM users_enhanced WHERE id = auth.uid()
));

-- Admins can manage all data
CREATE POLICY "Admins can manage compliance metrics" 
ON public.compliance_metrics FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users_enhanced 
  WHERE organization_id = compliance_metrics.organization_id 
  AND id = auth.uid() 
  AND role = 'admin'
));

CREATE POLICY "Admins can manage agent statuses" 
ON public.agent_statuses FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users_enhanced 
  WHERE organization_id = agent_statuses.organization_id 
  AND id = auth.uid() 
  AND role = 'admin'
));

CREATE POLICY "Admins can manage workflows" 
ON public.active_workflows FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users_enhanced 
  WHERE organization_id = active_workflows.organization_id 
  AND id = auth.uid() 
  AND role = 'admin'
));

CREATE POLICY "Admins can manage quick actions" 
ON public.quick_actions FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users_enhanced 
  WHERE organization_id = quick_actions.organization_id 
  AND id = auth.uid() 
  AND role = 'admin'
));

-- Create updated_at triggers
CREATE TRIGGER update_compliance_metrics_updated_at
  BEFORE UPDATE ON public.compliance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_time();

CREATE TRIGGER update_agent_statuses_updated_at
  BEFORE UPDATE ON public.agent_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_time();

CREATE TRIGGER update_active_workflows_updated_at
  BEFORE UPDATE ON public.active_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_time();

CREATE TRIGGER update_quick_actions_updated_at
  BEFORE UPDATE ON public.quick_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_time();

-- Insert sample data for testing
INSERT INTO public.compliance_metrics (organization_id, tools_approved, tools_flagged, metaloop_learnings, compliance_score)
VALUES 
  ((SELECT id FROM organizations_enhanced LIMIT 1), 24, 6, 4, 91.00);

INSERT INTO public.agent_statuses (organization_id, agent_name, status)
VALUES 
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'Context Agent', 'idle'),
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'Policy Agent', 'active'),
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'Negotiation Agent', 'monitoring'),
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'Audit Agent', 'flagged');

INSERT INTO public.active_workflows (organization_id, workflow_name, progress, status)
VALUES 
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'MLR Review: Diabetes Campaign', 75, 'running'),
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'FDA Update Response', 100, 'completed'),
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'Tool Compliance Check', 45, 'running');

INSERT INTO public.quick_actions (organization_id, action_name, description, icon, action_type)
VALUES 
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'Submit new AI tool', 'Add a new AI tool for compliance review', 'plus', 'submit'),
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'Review flagged policies', 'Review policies that need attention', 'document', 'review'),
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'Revalidate expired tools', 'Check tools that need revalidation', 'refresh', 'revalidate'),
  ((SELECT id FROM organizations_enhanced LIMIT 1), 'Export audit package', 'Download compliance documentation', 'download', 'export');