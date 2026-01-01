-- =============================================================================
-- MIGRATION: 003_extend_proof_bundles_with_digest
-- PURPOSE: Pin every Proof Bundle to the exact policy digest that governed it
-- =============================================================================

-- Add digest reference to proof_bundles table
ALTER TABLE public.proof_bundles 
  ADD COLUMN IF NOT EXISTS policy_digest TEXT,
  ADD COLUMN IF NOT EXISTS policy_artifact_id UUID,
  ADD COLUMN IF NOT EXISTS trace_id TEXT,
  ADD COLUMN IF NOT EXISTS trace_context JSONB DEFAULT '{}';

-- Add foreign key constraint for policy_artifact_id if the column was just added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_proof_bundles_policy_artifact'
    AND table_name = 'proof_bundles'
  ) THEN
    ALTER TABLE public.proof_bundles
      ADD CONSTRAINT fk_proof_bundles_policy_artifact
      FOREIGN KEY (policy_artifact_id) REFERENCES public.policy_artifacts(id);
  END IF;
END $$;

-- Index for digest-based lookups
CREATE INDEX IF NOT EXISTS idx_proof_bundles_policy_digest ON public.proof_bundles(policy_digest);
CREATE INDEX IF NOT EXISTS idx_proof_bundles_trace_id ON public.proof_bundles(trace_id);

-- Index for finding bundles by policy artifact
CREATE INDEX IF NOT EXISTS idx_proof_bundles_policy_artifact_id ON public.proof_bundles(policy_artifact_id);

COMMENT ON COLUMN public.proof_bundles.policy_digest IS 'OCI digest of the policy that governed this decision - immutable reference';
COMMENT ON COLUMN public.proof_bundles.policy_artifact_id IS 'Reference to the policy artifact record';
COMMENT ON COLUMN public.proof_bundles.trace_id IS 'W3C traceparent trace ID for distributed tracing correlation';
COMMENT ON COLUMN public.proof_bundles.trace_context IS 'Full W3C tracestate and context metadata for debugging';











