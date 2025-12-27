-- =============================================================================
-- MIGRATION: Unify Proof Bundle Schema
-- PURPOSE: Create proof_bundle_artifacts table for cryptographic fields and
--          ensure proof_bundle_compliance aligns with standardized schema
-- =============================================================================

-- Create proof_bundle_artifacts table for cryptographic fields
CREATE TABLE IF NOT EXISTS public.proof_bundle_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_bundle_id UUID NOT NULL,
  bundle_hash TEXT NOT NULL,                    -- SHA-256 hash of canonical_json
  canonical_json JSONB NOT NULL,                -- Deterministic JSON representation
  signature TEXT,                                -- Cryptographic signature
  signature_algorithm TEXT,                      -- RSA, ECDSA, EdDSA
  signature_key_id TEXT,                         -- Key identifier for verification
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(proof_bundle_id),
  CONSTRAINT valid_signature_algorithm CHECK (signature_algorithm IN ('RSA', 'ECDSA', 'EdDSA', NULL))
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_proof_bundle_artifacts_bundle_hash 
  ON public.proof_bundle_artifacts(bundle_hash);
CREATE INDEX IF NOT EXISTS idx_proof_bundle_artifacts_proof_bundle_id 
  ON public.proof_bundle_artifacts(proof_bundle_id);

-- Add bundle_hash column to proof_bundles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proof_bundles' 
    AND column_name = 'bundle_hash'
  ) THEN
    ALTER TABLE public.proof_bundles 
      ADD COLUMN bundle_hash TEXT;
  END IF;
END $$;

-- Ensure trace_id and policy_digest exist (they may already exist from previous migrations)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proof_bundles' 
    AND column_name = 'trace_id'
  ) THEN
    ALTER TABLE public.proof_bundles 
      ADD COLUMN trace_id TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proof_bundles' 
    AND column_name = 'policy_digest'
  ) THEN
    ALTER TABLE public.proof_bundles 
      ADD COLUMN policy_digest TEXT;
  END IF;
END $$;

-- Create indexes on proof_bundles for framework_id lookups (will be used by proof_bundle_compliance)
CREATE INDEX IF NOT EXISTS idx_proof_bundles_bundle_hash 
  ON public.proof_bundles(bundle_hash) 
  WHERE bundle_hash IS NOT NULL;

-- Add comments
COMMENT ON TABLE public.proof_bundle_artifacts IS 
'Stores cryptographic artifacts (hashes, signatures) for proof bundles separately from compliance metadata';

COMMENT ON COLUMN public.proof_bundle_artifacts.bundle_hash IS 
'SHA-256 hash of the canonical JSON representation of the proof bundle';

COMMENT ON COLUMN public.proof_bundle_artifacts.canonical_json IS 
'Deterministic JSON representation of the proof bundle for hashing and verification';

COMMENT ON COLUMN public.proof_bundle_artifacts.signature IS 
'Cryptographic signature of the bundle_hash for authenticity verification';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_proof_bundle_artifacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proof_bundle_artifacts_updated_at
  BEFORE UPDATE ON public.proof_bundle_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_proof_bundle_artifacts_updated_at();

-- Enable RLS
ALTER TABLE public.proof_bundle_artifacts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view artifacts for bundles they have access to
CREATE POLICY "Users can view proof bundle artifacts"
  ON public.proof_bundle_artifacts
  FOR SELECT
  TO authenticated
  USING (
    proof_bundle_id IN (
      SELECT id FROM public.proof_bundles
      WHERE enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Service role has full access
CREATE POLICY "Service role has full access to proof bundle artifacts"
  ON public.proof_bundle_artifacts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

