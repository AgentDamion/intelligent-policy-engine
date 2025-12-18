-- Enable RLS on all new tables
ALTER TABLE public.enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_workspaces(user_uuid UUID)
RETURNS UUID[]
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(workspace_id) 
  FROM workspace_members 
  WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_enterprises(user_uuid UUID)
RETURNS UUID[]
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(enterprise_id) 
  FROM user_roles 
  WHERE user_id = user_uuid AND enterprise_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(user_uuid UUID, workspace_uuid UUID, required_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND workspace_id = workspace_uuid 
    AND role >= required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_enterprise_role(user_uuid UUID, enterprise_uuid UUID, required_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND enterprise_id = enterprise_uuid 
    AND role >= required_role
  );
$$;

-- RLS Policies for enterprises
CREATE POLICY "Enterprise members can view their enterprises" 
ON public.enterprises FOR SELECT 
USING (id = ANY(public.get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise admins can update enterprises" 
ON public.enterprises FOR UPDATE 
USING (public.has_enterprise_role(auth.uid(), id, 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their workspaces/enterprises" 
ON public.user_roles FOR SELECT 
USING (
  workspace_id = ANY(public.get_user_workspaces(auth.uid())) OR
  enterprise_id = ANY(public.get_user_enterprises(auth.uid()))
);

CREATE POLICY "Enterprise/workspace admins can manage roles" 
ON public.user_roles FOR ALL 
USING (
  (workspace_id IS NOT NULL AND public.has_workspace_role(auth.uid(), workspace_id, 'admin')) OR
  (enterprise_id IS NOT NULL AND public.has_enterprise_role(auth.uid(), enterprise_id, 'admin'))
);

-- RLS Policies for policies
CREATE POLICY "Enterprise members can view policies" 
ON public.policies FOR SELECT 
USING (enterprise_id = ANY(public.get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise members can create policies" 
ON public.policies FOR INSERT 
WITH CHECK (
  enterprise_id = ANY(public.get_user_enterprises(auth.uid())) AND
  public.has_enterprise_role(auth.uid(), enterprise_id, 'member')
);

CREATE POLICY "Policy creators and enterprise admins can update policies" 
ON public.policies FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  public.has_enterprise_role(auth.uid(), enterprise_id, 'admin')
);

-- RLS Policies for policy_versions
CREATE POLICY "Users can view policy versions for accessible policies" 
ON public.policy_versions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM policies p 
    WHERE p.id = policy_id 
    AND p.enterprise_id = ANY(public.get_user_enterprises(auth.uid()))
  )
);

CREATE POLICY "Policy creators can manage versions" 
ON public.policy_versions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM policies p 
    WHERE p.id = policy_id 
    AND (p.created_by = auth.uid() OR public.has_enterprise_role(auth.uid(), p.enterprise_id, 'admin'))
  )
);

-- RLS Policies for policy_distributions
CREATE POLICY "Enterprise and workspace members can view distributions" 
ON public.policy_distributions FOR SELECT 
USING (
  target_workspace_id = ANY(public.get_user_workspaces(auth.uid())) OR
  EXISTS (
    SELECT 1 FROM policy_versions pv 
    JOIN policies p ON p.id = pv.policy_id 
    WHERE pv.id = policy_version_id 
    AND p.enterprise_id = ANY(public.get_user_enterprises(auth.uid()))
  )
);

CREATE POLICY "Enterprise members can distribute policies" 
ON public.policy_distributions FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM policy_versions pv 
    JOIN policies p ON p.id = pv.policy_id 
    WHERE pv.id = policy_version_id 
    AND public.has_enterprise_role(auth.uid(), p.enterprise_id, 'member')
  )
);

-- RLS Policies for submissions
CREATE POLICY "Workspace members can view submissions" 
ON public.submissions FOR SELECT 
USING (workspace_id = ANY(public.get_user_workspaces(auth.uid())));

CREATE POLICY "Workspace members can create submissions" 
ON public.submissions FOR INSERT 
WITH CHECK (
  workspace_id = ANY(public.get_user_workspaces(auth.uid())) AND
  public.has_workspace_role(auth.uid(), workspace_id, 'member')
);

CREATE POLICY "Submission creators can update their submissions" 
ON public.submissions FOR UPDATE 
USING (
  submitted_by = auth.uid() OR 
  public.has_workspace_role(auth.uid(), workspace_id, 'admin')
);

-- RLS Policies for submission_items
CREATE POLICY "Users can view submission items for accessible submissions" 
ON public.submission_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM submissions s 
    WHERE s.id = submission_id 
    AND s.workspace_id = ANY(public.get_user_workspaces(auth.uid()))
  )
);

CREATE POLICY "Users can manage items for accessible submissions" 
ON public.submission_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM submissions s 
    WHERE s.id = submission_id 
    AND (s.submitted_by = auth.uid() OR public.has_workspace_role(auth.uid(), s.workspace_id, 'admin'))
  )
);

-- RLS Policies for decisions
CREATE POLICY "Users can view decisions for accessible submissions" 
ON public.decisions FOR SELECT 
USING (
  (submission_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM submissions s 
    WHERE s.id = submission_id 
    AND s.workspace_id = ANY(public.get_user_workspaces(auth.uid()))
  )) OR
  (submission_item_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM submission_items si 
    JOIN submissions s ON s.id = si.submission_id 
    WHERE si.id = submission_item_id 
    AND s.workspace_id = ANY(public.get_user_workspaces(auth.uid()))
  ))
);

CREATE POLICY "Enterprise reviewers can create decisions" 
ON public.decisions FOR INSERT 
WITH CHECK (
  (submission_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM submissions s 
    JOIN policy_versions pv ON pv.id = s.policy_version_id 
    JOIN policies p ON p.id = pv.policy_id 
    WHERE s.id = submission_id 
    AND public.has_enterprise_role(auth.uid(), p.enterprise_id, 'member')
  )) OR
  (submission_item_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM submission_items si 
    JOIN submissions s ON s.id = si.submission_id 
    JOIN policy_versions pv ON pv.id = s.policy_version_id 
    JOIN policies p ON p.id = pv.policy_id 
    WHERE si.id = submission_item_id 
    AND public.has_enterprise_role(auth.uid(), p.enterprise_id, 'member')
  ))
);

-- RLS Policies for scores
CREATE POLICY "Users can view scores for accessible submissions" 
ON public.scores FOR SELECT 
USING (
  (submission_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM submissions s 
    WHERE s.id = submission_id 
    AND s.workspace_id = ANY(public.get_user_workspaces(auth.uid()))
  )) OR
  (submission_item_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM submission_items si 
    JOIN submissions s ON s.id = si.submission_id 
    WHERE si.id = submission_item_id 
    AND s.workspace_id = ANY(public.get_user_workspaces(auth.uid()))
  ))
);

-- RLS Policies for evidence
CREATE POLICY "Users can view evidence for accessible submission items" 
ON public.evidence FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM submission_items si 
    JOIN submissions s ON s.id = si.submission_id 
    WHERE si.id = submission_item_id 
    AND s.workspace_id = ANY(public.get_user_workspaces(auth.uid()))
  )
);

CREATE POLICY "Workspace members can upload evidence" 
ON public.evidence FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM submission_items si 
    JOIN submissions s ON s.id = si.submission_id 
    WHERE si.id = submission_item_id 
    AND s.workspace_id = ANY(public.get_user_workspaces(auth.uid()))
    AND public.has_workspace_role(auth.uid(), s.workspace_id, 'member')
  )
);

-- RLS Policies for audit_events (append-only, workspace-scoped reads)
CREATE POLICY "Users can view audit events for their workspaces" 
ON public.audit_events FOR SELECT 
USING (
  workspace_id = ANY(public.get_user_workspaces(auth.uid())) OR
  enterprise_id = ANY(public.get_user_enterprises(auth.uid()))
);

-- Make audit_events immutable (prevent updates/deletes)
CREATE OR REPLACE FUNCTION public.prevent_audit_modifications()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_updates
  BEFORE UPDATE ON public.audit_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_modifications();

CREATE TRIGGER prevent_audit_deletes
  BEFORE DELETE ON public.audit_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_modifications();

-- Set up realtime for audit events
ALTER TABLE public.audit_events REPLICA IDENTITY FULL;

-- Triggers for updated_at columns
CREATE TRIGGER update_enterprises_updated_at
    BEFORE UPDATE ON public.enterprises
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON public.policies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();