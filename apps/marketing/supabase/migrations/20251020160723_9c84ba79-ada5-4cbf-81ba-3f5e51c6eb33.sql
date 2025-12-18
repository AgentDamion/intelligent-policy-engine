-- Phase 3.B: EPS Runtime Enforcement Schema Enhancements
-- Adds response time telemetry, EPS binding for proof bundles, and indices

-- 1. Add response time and enterprise denormalization to validation events
ALTER TABLE public.policy_validation_events
  ADD COLUMN IF NOT EXISTS response_time_ms integer,
  ADD COLUMN IF NOT EXISTS enterprise_id uuid REFERENCES public.enterprises(id);

CREATE INDEX IF NOT EXISTS idx_validation_events_enterprise
  ON public.policy_validation_events (enterprise_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_validation_events_eps
  ON public.policy_validation_events (eps_id, timestamp DESC);

-- 2. Add EPS binding columns to proof_bundles
ALTER TABLE public.proof_bundles
  ADD COLUMN IF NOT EXISTS eps_id uuid REFERENCES public.effective_policy_snapshots(id),
  ADD COLUMN IF NOT EXISTS eps_hash text,
  ADD COLUMN IF NOT EXISTS signature text;

CREATE INDEX IF NOT EXISTS idx_proof_bundles_eps
  ON public.proof_bundles (eps_id);

-- 3. Add index for current_eps_id lookups on policy_instances
CREATE INDEX IF NOT EXISTS idx_policy_instances_current_eps
  ON public.policy_instances (current_eps_id) WHERE current_eps_id IS NOT NULL;

-- 4. Add index for backfill queries (status + missing EPS)
CREATE INDEX IF NOT EXISTS idx_policy_instances_backfill
  ON public.policy_instances (status, current_eps_id) 
  WHERE status IN ('approved', 'active') AND current_eps_id IS NULL;

COMMENT ON COLUMN public.policy_validation_events.response_time_ms IS 'Validation latency in milliseconds for SLO monitoring';
COMMENT ON COLUMN public.policy_validation_events.enterprise_id IS 'Denormalized for fast tenant-scoped audit queries';
COMMENT ON COLUMN public.proof_bundles.eps_id IS 'Immutable EPS snapshot this proof bundle is bound to';
COMMENT ON COLUMN public.proof_bundles.eps_hash IS 'Content hash of the EPS for tamper detection';
COMMENT ON COLUMN public.proof_bundles.signature IS 'Cryptographic signature of the proof bundle';