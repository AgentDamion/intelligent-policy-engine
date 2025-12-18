-- Phase 1: Core Governance Tables Migration

-- AI Tools Registry
CREATE TABLE IF NOT EXISTS public.ai_tool_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_ai_tool_registry_category ON public.ai_tool_registry(category);
CREATE INDEX idx_ai_tool_registry_provider ON public.ai_tool_registry(provider);

-- AI Tool Versions
CREATE TABLE IF NOT EXISTS public.ai_tool_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES public.ai_tool_registry(id) ON DELETE CASCADE NOT NULL,
  version text NOT NULL,
  release_date timestamptz NOT NULL,
  deprecates_version_id uuid REFERENCES public.ai_tool_versions(id) ON DELETE SET NULL,
  capabilities jsonb DEFAULT '{}'::jsonb,
  known_limitations text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(tool_id, version)
);

CREATE INDEX idx_ai_tool_versions_tool ON public.ai_tool_versions(tool_id);
CREATE INDEX idx_ai_tool_versions_release_date ON public.ai_tool_versions(release_date DESC);

-- Policy Instances
CREATE TABLE IF NOT EXISTS public.policy_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid,
  tool_version_id uuid REFERENCES public.ai_tool_versions(id) ON DELETE RESTRICT NOT NULL,
  use_case text NOT NULL,
  jurisdiction text[] DEFAULT ARRAY[]::text[],
  audience text[] DEFAULT ARRAY[]::text[],
  pom jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  updated_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  expires_at timestamptz,
  enterprise_id uuid NOT NULL,
  workspace_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (status IN ('draft', 'in_review', 'approved', 'active', 'deprecated'))
);

CREATE INDEX idx_policy_instances_tool_version ON public.policy_instances(tool_version_id);
CREATE INDEX idx_policy_instances_enterprise ON public.policy_instances(enterprise_id);
CREATE INDEX idx_policy_instances_workspace ON public.policy_instances(workspace_id);
CREATE INDEX idx_policy_instances_status ON public.policy_instances(status);

-- Approvals (generic approval workflow)
CREATE TABLE IF NOT EXISTS public.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  stage text NOT NULL,
  required_roles text[] DEFAULT ARRAY[]::text[],
  decision text,
  decided_by uuid,
  decided_at timestamptz,
  rationale text,
  conditions text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  CHECK (object_type IN ('policy_instance', 'sandbox_run', 'policy_template', 'runtime_binding')),
  CHECK (decision IS NULL OR decision IN ('approved', 'rejected', 'conditional'))
);

CREATE INDEX idx_approvals_object ON public.approvals(object_type, object_id);
CREATE INDEX idx_approvals_decided_by ON public.approvals(decided_by);

-- Runtime Bindings
CREATE TABLE IF NOT EXISTS public.runtime_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_instance_id uuid REFERENCES public.policy_instances(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid,
  workspace_id uuid,
  enterprise_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  activated_at timestamptz DEFAULT now() NOT NULL,
  deactivated_at timestamptz,
  last_verified_at timestamptz,
  violation_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (status IN ('active', 'suspended', 'deprecated'))
);

CREATE INDEX idx_runtime_bindings_policy_instance ON public.runtime_bindings(policy_instance_id);
CREATE INDEX idx_runtime_bindings_enterprise ON public.runtime_bindings(enterprise_id);
CREATE INDEX idx_runtime_bindings_workspace ON public.runtime_bindings(workspace_id);
CREATE INDEX idx_runtime_bindings_status ON public.runtime_bindings(status);

-- RLS Policies for ai_tool_registry
ALTER TABLE public.ai_tool_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view AI tools"
ON public.ai_tool_registry FOR SELECT
USING (true);

CREATE POLICY "Admins can manage AI tools"
ON public.ai_tool_registry FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- RLS Policies for ai_tool_versions
ALTER TABLE public.ai_tool_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tool versions"
ON public.ai_tool_versions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tool versions"
ON public.ai_tool_versions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- RLS Policies for policy_instances
ALTER TABLE public.policy_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view policy instances in their enterprise"
ON public.policy_instances FOR SELECT
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create policy instances in their workspace"
ON public.policy_instances FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid()
  ) AND
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update policy instances they created or in their workspace"
ON public.policy_instances FOR UPDATE
USING (
  created_by = auth.uid() OR
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Workspace admins can delete policy instances"
ON public.policy_instances FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- RLS Policies for approvals
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals for their objects"
ON public.approvals FOR SELECT
USING (
  (object_type = 'policy_instance' AND object_id IN (
    SELECT id FROM public.policy_instances
    WHERE enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members
      WHERE user_id = auth.uid()
    )
  )) OR
  decided_by = auth.uid()
);

CREATE POLICY "System can create approvals"
ON public.approvals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authorized users can update approvals"
ON public.approvals FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles
    WHERE role IN ('admin', 'owner')
  )
);

-- RLS Policies for runtime_bindings
ALTER TABLE public.runtime_bindings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view runtime bindings in their enterprise"
ON public.runtime_bindings FOR SELECT
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage runtime bindings"
ON public.runtime_bindings FOR ALL
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_policy_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_policy_instances_updated_at
BEFORE UPDATE ON public.policy_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_policy_instances_updated_at();

CREATE OR REPLACE FUNCTION public.update_runtime_bindings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_runtime_bindings_updated_at
BEFORE UPDATE ON public.runtime_bindings
FOR EACH ROW
EXECUTE FUNCTION public.update_runtime_bindings_updated_at();