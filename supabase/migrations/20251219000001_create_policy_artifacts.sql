-- =============================================================================
-- MIGRATION: 001_create_policy_artifacts
-- PURPOSE: Track policy versions as OCI artifacts with immutable digests
-- =============================================================================

-- Policy artifact registry - the source of truth for deployed policies
CREATE TABLE IF NOT EXISTS public.policy_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy reference
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- OCI artifact reference (immutable)
  oci_registry TEXT NOT NULL DEFAULT 'ghcr.io/aicomplyr',
  oci_repository TEXT NOT NULL, -- e.g., 'policies/pfizer-mlr'
  oci_tag TEXT, -- e.g., 'v1.4.2' (mutable, for convenience)
  oci_digest TEXT NOT NULL, -- e.g., 'sha256:94a00394bc5a...' (immutable)
  
  -- Artifact metadata
  artifact_size_bytes BIGINT,
  artifact_type TEXT DEFAULT 'application/vnd.aicomplyr.policy.v1+json',
  
  -- Content hash for verification
  content_sha256 TEXT NOT NULL, -- Hash of the policy JSON content
  
  -- Build provenance (SLSA compliance)
  build_provenance JSONB DEFAULT '{}',
  -- Example: { "builder": "github-actions", "commit": "abc123", "workflow": "policy-build.yml" }
  
  -- Signing information
  signature_keyid TEXT,
  signature BYTEA,
  signed_at TIMESTAMPTZ,
  
  -- Lifecycle
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique version per policy
  CONSTRAINT unique_policy_version UNIQUE (policy_id, version_number),
  -- Ensure unique digest (immutable guarantee)
  CONSTRAINT unique_oci_digest UNIQUE (oci_digest)
);

-- Index for digest lookups (the primary access pattern)
CREATE INDEX IF NOT EXISTS idx_policy_artifacts_digest ON public.policy_artifacts(oci_digest);
CREATE INDEX IF NOT EXISTS idx_policy_artifacts_policy_id ON public.policy_artifacts(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_artifacts_created_at ON public.policy_artifacts(created_at DESC);

-- Enable RLS
ALTER TABLE public.policy_artifacts ENABLE ROW LEVEL SECURITY;

-- RLS: Enterprise-scoped access (same pattern as existing policies table)
CREATE POLICY "policy_artifacts_enterprise_select" ON public.policy_artifacts
  FOR SELECT TO authenticated USING (
    policy_id IN (
      SELECT p.id FROM public.policies p
      WHERE p.enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "policy_artifacts_enterprise_insert" ON public.policy_artifacts
  FOR INSERT TO authenticated WITH CHECK (
    policy_id IN (
      SELECT p.id FROM public.policies p
      WHERE p.enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "policy_artifacts_enterprise_update" ON public.policy_artifacts
  FOR UPDATE TO authenticated USING (
    policy_id IN (
      SELECT p.id FROM public.policies p
      WHERE p.enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Service role has full access
CREATE POLICY "policy_artifacts_service_role" ON public.policy_artifacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.policy_artifacts IS 'Immutable registry of policy versions as OCI artifacts with cryptographic digests';
COMMENT ON COLUMN public.policy_artifacts.oci_digest IS 'Immutable SHA256 digest of OCI artifact - the canonical policy identifier';
COMMENT ON COLUMN public.policy_artifacts.content_sha256 IS 'SHA256 hash of the policy JSON content for verification';
COMMENT ON COLUMN public.policy_artifacts.build_provenance IS 'SLSA-compliant build provenance metadata';











