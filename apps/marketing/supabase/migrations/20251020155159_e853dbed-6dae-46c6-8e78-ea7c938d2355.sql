-- EPS Foundation Migration
-- Phase 1: Enhanced schema with idempotency and tenant scoping

-- 1) Core EPS snapshots table
CREATE TABLE IF NOT EXISTS public.effective_policy_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_instance_id uuid NOT NULL REFERENCES public.policy_instances(id) ON DELETE CASCADE,
  enterprise_id uuid NOT NULL,
  workspace_id uuid,
  scope_id uuid,
  effective_pom jsonb NOT NULL,
  content_hash text NOT NULL,
  idempotency_key text,
  hash_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  field_provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  UNIQUE(policy_instance_id, version),
  UNIQUE(policy_instance_id, idempotency_key)
);

CREATE INDEX idx_eps_enterprise ON public.effective_policy_snapshots (enterprise_id);
CREATE INDEX idx_eps_instance_version ON public.effective_policy_snapshots (policy_instance_id, version DESC);
CREATE INDEX idx_eps_hash ON public.effective_policy_snapshots (content_hash);
CREATE INDEX idx_eps_pom_controls_gin ON public.effective_policy_snapshots USING gin ((effective_pom->'controls'));

-- 2) Validation events with partitioning support
CREATE TABLE IF NOT EXISTS public.policy_validation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  tool_version_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  enterprise_id uuid NOT NULL,
  policy_instance_id uuid NOT NULL,
  eps_id uuid REFERENCES public.effective_policy_snapshots(id),
  eps_hash text,
  scope_path text,
  decision text NOT NULL CHECK (decision IN ('allowed', 'blocked', 'warn')),
  violations jsonb NOT NULL DEFAULT '[]'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  usage_context jsonb DEFAULT '{}'::jsonb,
  response_time_ms int,
  event_metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_validation_events_eps ON public.policy_validation_events(eps_id);
CREATE INDEX idx_validation_events_timestamp ON public.policy_validation_events(timestamp DESC);
CREATE INDEX idx_validation_events_enterprise ON public.policy_validation_events(enterprise_id);
CREATE INDEX idx_validation_events_decision ON public.policy_validation_events(decision, timestamp DESC);

-- 3) Enhance policy_instances
ALTER TABLE public.policy_instances
  ADD COLUMN IF NOT EXISTS current_eps_id uuid REFERENCES public.effective_policy_snapshots(id),
  ADD COLUMN IF NOT EXISTS eps_version int DEFAULT 0;

-- 4) Enhance policy_clauses
ALTER TABLE public.policy_clauses
  ADD COLUMN IF NOT EXISTS pom_field_mappings jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS applied_to_instances uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mapping_status text DEFAULT 'suggested' CHECK (mapping_status IN ('suggested','approved','auto_applied','rejected'));

-- 5) Update runtime_bindings
ALTER TABLE public.runtime_bindings
  ADD COLUMN IF NOT EXISTS scope_path text;

-- 6) RLS Policies
ALTER TABLE public.effective_policy_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_validation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enterprise members view EPS"
ON public.effective_policy_snapshots FOR SELECT
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role creates EPS"
ON public.effective_policy_snapshots FOR INSERT
WITH CHECK (true);

CREATE POLICY "Workspace members view validation events"
ON public.policy_validation_events FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role logs validations"
ON public.policy_validation_events FOR INSERT
WITH CHECK (true);

-- 7) Helper RPCs
CREATE OR REPLACE FUNCTION get_current_eps(p_policy_instance_id uuid)
RETURNS TABLE (
  id uuid,
  effective_pom jsonb,
  content_hash text,
  version int,
  activated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, effective_pom, content_hash, version, activated_at
  FROM effective_policy_snapshots
  WHERE policy_instance_id = p_policy_instance_id
    AND id = (SELECT current_eps_id FROM policy_instances WHERE id = p_policy_instance_id)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION list_eps_versions(p_policy_instance_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  version int,
  content_hash text,
  created_at timestamptz,
  activated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, version, content_hash, created_at, activated_at
  FROM effective_policy_snapshots
  WHERE policy_instance_id = p_policy_instance_id
  ORDER BY version DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION eps_next_version(p_policy_instance_id uuid)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next int;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next
  FROM effective_policy_snapshots
  WHERE policy_instance_id = p_policy_instance_id
  FOR UPDATE;
  
  RETURN v_next;
END;
$$;