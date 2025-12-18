-- Create governance entities table to store clients, partners, tools, and policies
CREATE TABLE IF NOT EXISTS public.governance_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('client', 'partner', 'tool', 'policy')),
  enterprise_id UUID REFERENCES public.enterprises(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  compliance_score INTEGER NOT NULL DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  tool_approval_score INTEGER NOT NULL DEFAULT 0 CHECK (tool_approval_score >= 0 AND tool_approval_score <= 100),
  audit_completeness_score INTEGER NOT NULL DEFAULT 0 CHECK (audit_completeness_score >= 0 AND audit_completeness_score <= 100),
  open_risks INTEGER NOT NULL DEFAULT 0,
  owner_name TEXT,
  region TEXT,
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Create governance alerts table
CREATE TABLE IF NOT EXISTS public.governance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  description TEXT,
  entity_name TEXT,
  entity_type TEXT CHECK (entity_type IN ('client', 'partner', 'tool', 'policy')),
  entity_id UUID REFERENCES public.governance_entities(id),
  enterprise_id UUID REFERENCES public.enterprises(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  days_open INTEGER NOT NULL DEFAULT 0,
  assignee_name TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on governance tables
ALTER TABLE public.governance_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for governance_entities
CREATE POLICY "Enterprise members can view governance entities" 
ON public.governance_entities 
FOR SELECT 
USING (enterprise_id = ANY (get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise members can insert governance entities" 
ON public.governance_entities 
FOR INSERT 
WITH CHECK (enterprise_id = ANY (get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise members can update governance entities" 
ON public.governance_entities 
FOR UPDATE 
USING (enterprise_id = ANY (get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise members can delete governance entities" 
ON public.governance_entities 
FOR DELETE 
USING (enterprise_id = ANY (get_user_enterprises(auth.uid())));

-- RLS policies for governance_alerts
CREATE POLICY "Enterprise members can view governance alerts" 
ON public.governance_alerts 
FOR SELECT 
USING (enterprise_id = ANY (get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise members can insert governance alerts" 
ON public.governance_alerts 
FOR INSERT 
WITH CHECK (enterprise_id = ANY (get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise members can update governance alerts" 
ON public.governance_alerts 
FOR UPDATE 
USING (enterprise_id = ANY (get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise members can delete governance alerts" 
ON public.governance_alerts 
FOR DELETE 
USING (enterprise_id = ANY (get_user_enterprises(auth.uid())));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_governance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_governance_entities_updated_at
  BEFORE UPDATE ON public.governance_entities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_governance_updated_at();

CREATE TRIGGER update_governance_alerts_updated_at
  BEFORE UPDATE ON public.governance_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_governance_updated_at();