-- =============================================================================
-- MIGRATION: 002_create_policy_activations
-- PURPOSE: Track when policy digests become active for tenants/workspaces
-- =============================================================================

-- Policy activation history - when did each digest become "live"?
CREATE TABLE IF NOT EXISTS public.policy_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was activated
  policy_artifact_id UUID NOT NULL REFERENCES public.policy_artifacts(id),
  
  -- Where it was activated (scope)
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id),
  workspace_id UUID REFERENCES public.workspaces(id), -- NULL = enterprise-wide
  
  -- The digest that became active (denormalized for fast lookups)
  active_digest TEXT NOT NULL,
  
  -- Lifecycle
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_by UUID REFERENCES auth.users(id),
  
  -- Deactivation (when superseded by new activation)
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id),
  superseded_by UUID REFERENCES public.policy_activations(id),
  
  -- Audit fields
  activation_reason TEXT CHECK (activation_reason IN (
    'initial_deployment', 
    'policy_update', 
    'rollback', 
    'compliance_remediation',
    'emergency_change',
    'scheduled_update'
  )),
  activation_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup: "What's the active digest for this enterprise/workspace right now?"
CREATE INDEX IF NOT EXISTS idx_policy_activations_active 
  ON public.policy_activations(enterprise_id, workspace_id, activated_at DESC) 
  WHERE deactivated_at IS NULL;

-- Historical lookup: "What digest was active at time T?"
CREATE INDEX IF NOT EXISTS idx_policy_activations_history 
  ON public.policy_activations(enterprise_id, workspace_id, activated_at, deactivated_at);

-- Lookup by digest
CREATE INDEX IF NOT EXISTS idx_policy_activations_digest 
  ON public.policy_activations(active_digest);

-- Lookup by artifact
CREATE INDEX IF NOT EXISTS idx_policy_activations_artifact 
  ON public.policy_activations(policy_artifact_id);

-- Enable RLS
ALTER TABLE public.policy_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_activations_enterprise_select" ON public.policy_activations
  FOR SELECT TO authenticated USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "policy_activations_enterprise_insert" ON public.policy_activations
  FOR INSERT TO authenticated WITH CHECK (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "policy_activations_enterprise_update" ON public.policy_activations
  FOR UPDATE TO authenticated USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

-- Service role has full access
CREATE POLICY "policy_activations_service_role" ON public.policy_activations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- FUNCTION: Get active digest for a scope
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_active_policy_digest(
  p_enterprise_id UUID,
  p_workspace_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_digest TEXT;
BEGIN
  -- First try workspace-specific activation
  IF p_workspace_id IS NOT NULL THEN
    SELECT active_digest INTO v_digest
    FROM public.policy_activations
    WHERE enterprise_id = p_enterprise_id
      AND workspace_id = p_workspace_id
      AND deactivated_at IS NULL
    ORDER BY activated_at DESC
    LIMIT 1;
    
    IF v_digest IS NOT NULL THEN
      RETURN v_digest;
    END IF;
  END IF;
  
  -- Fall back to enterprise-wide activation
  SELECT active_digest INTO v_digest
  FROM public.policy_activations
  WHERE enterprise_id = p_enterprise_id
    AND workspace_id IS NULL
    AND deactivated_at IS NULL
  ORDER BY activated_at DESC
  LIMIT 1;
  
  RETURN v_digest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: Get digest that was active at a specific point in time
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_policy_digest_at_time(
  p_enterprise_id UUID,
  p_workspace_id UUID,
  p_at_time TIMESTAMPTZ
)
RETURNS TEXT AS $$
DECLARE
  v_digest TEXT;
BEGIN
  -- First try workspace-specific
  IF p_workspace_id IS NOT NULL THEN
    SELECT active_digest INTO v_digest
    FROM public.policy_activations
    WHERE enterprise_id = p_enterprise_id
      AND workspace_id = p_workspace_id
      AND activated_at <= p_at_time
      AND (deactivated_at IS NULL OR deactivated_at > p_at_time)
    ORDER BY activated_at DESC
    LIMIT 1;
    
    IF v_digest IS NOT NULL THEN
      RETURN v_digest;
    END IF;
  END IF;
  
  -- Fall back to enterprise-wide
  SELECT active_digest INTO v_digest
  FROM public.policy_activations
  WHERE enterprise_id = p_enterprise_id
    AND workspace_id IS NULL
    AND activated_at <= p_at_time
    AND (deactivated_at IS NULL OR deactivated_at > p_at_time)
  ORDER BY activated_at DESC
  LIMIT 1;
  
  RETURN v_digest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: Get full policy artifact details for a digest
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_policy_artifact_by_digest(
  p_digest TEXT
)
RETURNS TABLE (
  artifact_id UUID,
  policy_id UUID,
  version_number INTEGER,
  oci_registry TEXT,
  oci_repository TEXT,
  oci_tag TEXT,
  oci_digest TEXT,
  content_sha256 TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id AS artifact_id,
    pa.policy_id,
    pa.version_number,
    pa.oci_registry,
    pa.oci_repository,
    pa.oci_tag,
    pa.oci_digest,
    pa.content_sha256,
    pa.created_at
  FROM public.policy_artifacts pa
  WHERE pa.oci_digest = p_digest
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: Get activation history for an enterprise
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_policy_activation_history(
  p_enterprise_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  activation_id UUID,
  active_digest TEXT,
  policy_artifact_id UUID,
  workspace_id UUID,
  activated_at TIMESTAMPTZ,
  activated_by UUID,
  deactivated_at TIMESTAMPTZ,
  activation_reason TEXT,
  activation_notes TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id AS activation_id,
    pa.active_digest,
    pa.policy_artifact_id,
    pa.workspace_id,
    pa.activated_at,
    pa.activated_by,
    pa.deactivated_at,
    pa.activation_reason,
    pa.activation_notes,
    (pa.deactivated_at IS NULL) AS is_active
  FROM public.policy_activations pa
  WHERE pa.enterprise_id = p_enterprise_id
  ORDER BY pa.activated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.policy_activations IS 'Audit trail of when policy digests became active for enterprises/workspaces';
COMMENT ON FUNCTION public.get_active_policy_digest IS 'Returns the currently active policy digest for an enterprise/workspace scope';
COMMENT ON FUNCTION public.get_policy_digest_at_time IS 'Returns the policy digest that was active at a specific point in time';











