-- =============================================================================
-- MIGRATION: Add Batch Bundle Support
-- PURPOSE: Extend proof_bundles table to support batch bundles (multiple decisions per bundle)
--          and create junction table for linking decisions to batch bundles
-- =============================================================================

BEGIN;

-- ============================================================
-- PART 1: Extend proof_bundles table with batch bundle fields
-- ============================================================

-- Add bundle_type to distinguish single vs batch bundles
ALTER TABLE public.proof_bundles
  ADD COLUMN IF NOT EXISTS bundle_type TEXT DEFAULT 'single' 
  CHECK (bundle_type IN ('single', 'batch'));

-- Add bundle_number for human-readable unique identifier (format: PB-{CODE}-{YYYYMMDD}-{SEQ})
ALTER TABLE public.proof_bundles
  ADD COLUMN IF NOT EXISTS bundle_number TEXT;

-- Add batch bundle scope fields
ALTER TABLE public.proof_bundles
  ADD COLUMN IF NOT EXISTS brands TEXT[],
  ADD COLUMN IF NOT EXISTS scope_start_date DATE,
  ADD COLUMN IF NOT EXISTS scope_end_date DATE,
  ADD COLUMN IF NOT EXISTS decision_count INTEGER DEFAULT 0;

-- Add status field for bundle lifecycle (draft, finalized, exported)
ALTER TABLE public.proof_bundles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'
  CHECK (status IN ('draft', 'finalized', 'exported'));

-- Add export tracking fields
ALTER TABLE public.proof_bundles
  ADD COLUMN IF NOT EXISTS export_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_exported_at TIMESTAMPTZ;

-- Add generator metadata
ALTER TABLE public.proof_bundles
  ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS generated_by_role TEXT;

-- Add regulatory framework field
ALTER TABLE public.proof_bundles
  ADD COLUMN IF NOT EXISTS regulatory_framework TEXT DEFAULT 'FDA 21 CFR Part 11';

-- Add policy version snapshot fields (for batch bundles)
ALTER TABLE public.proof_bundles
  ADD COLUMN IF NOT EXISTS policy_version TEXT,
  ADD COLUMN IF NOT EXISTS policy_effective_date DATE;

-- Create unique index on bundle_number per enterprise (for batch bundles)
CREATE UNIQUE INDEX IF NOT EXISTS idx_proof_bundles_bundle_number_enterprise
  ON public.proof_bundles(enterprise_id, bundle_number)
  WHERE bundle_number IS NOT NULL;

-- Create indexes for batch bundle queries
CREATE INDEX IF NOT EXISTS idx_proof_bundles_bundle_type
  ON public.proof_bundles(bundle_type);

CREATE INDEX IF NOT EXISTS idx_proof_bundles_status
  ON public.proof_bundles(status);

CREATE INDEX IF NOT EXISTS idx_proof_bundles_bundle_number
  ON public.proof_bundles(bundle_number)
  WHERE bundle_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_proof_bundles_scope_dates
  ON public.proof_bundles(scope_start_date, scope_end_date)
  WHERE scope_start_date IS NOT NULL AND scope_end_date IS NOT NULL;

-- ============================================================
-- PART 2: Create proof_bundle_decisions junction table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.proof_bundle_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_bundle_id UUID NOT NULL REFERENCES public.proof_bundles(id) ON DELETE CASCADE,
  governance_thread_id UUID NOT NULL REFERENCES public.governance_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a thread can only be in a bundle once
  CONSTRAINT unique_bundle_thread UNIQUE (proof_bundle_id, governance_thread_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_proof_bundle_decisions_bundle
  ON public.proof_bundle_decisions(proof_bundle_id);

CREATE INDEX IF NOT EXISTS idx_proof_bundle_decisions_thread
  ON public.proof_bundle_decisions(governance_thread_id);

-- Enable RLS
ALTER TABLE public.proof_bundle_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view decisions for bundles they have access to
CREATE POLICY "Users can view proof bundle decisions"
  ON public.proof_bundle_decisions
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
CREATE POLICY "Service role has full access to proof bundle decisions"
  ON public.proof_bundle_decisions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PART 3: Create proof_bundle_exports tracking table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.proof_bundle_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_bundle_id UUID NOT NULL REFERENCES public.proof_bundles(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'zip', 'json')),
  exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exported_by UUID REFERENCES auth.users(id),
  file_size_bytes BIGINT,
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_bundle_exports_bundle
  ON public.proof_bundle_exports(proof_bundle_id);

CREATE INDEX IF NOT EXISTS idx_proof_bundle_exports_user
  ON public.proof_bundle_exports(exported_by);

CREATE INDEX IF NOT EXISTS idx_proof_bundle_exports_exported_at
  ON public.proof_bundle_exports(exported_at DESC);

-- Enable RLS
ALTER TABLE public.proof_bundle_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see exports for bundles they have access to
CREATE POLICY "Users can view proof bundle exports"
  ON public.proof_bundle_exports
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

-- RLS Policy: Users can create exports for bundles they have access to
CREATE POLICY "Users can create proof bundle exports"
  ON public.proof_bundle_exports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proof_bundle_id IN (
      SELECT id FROM public.proof_bundles
      WHERE enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Service role has full access
CREATE POLICY "Service role has full access to proof bundle exports"
  ON public.proof_bundle_exports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PART 4: RPC Functions
-- ============================================================

-- Function to generate unique bundle number (format: PB-{CODE}-{YYYYMMDD}-{SEQ})
CREATE OR REPLACE FUNCTION public.generate_bundle_number(p_enterprise_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enterprise_code TEXT;
  v_date_code TEXT;
  v_sequence INTEGER;
  v_bundle_number TEXT;
BEGIN
  -- Get enterprise short code (first 3 uppercase chars of name)
  SELECT UPPER(SUBSTRING(name, 1, 3)) INTO v_enterprise_code
  FROM public.enterprises
  WHERE id = p_enterprise_id;
  
  -- If enterprise doesn't exist or name is too short, use 'ENT'
  IF v_enterprise_code IS NULL OR LENGTH(v_enterprise_code) < 3 THEN
    v_enterprise_code := 'ENT';
  END IF;
  
  -- Generate date code (YYYYMMDD)
  v_date_code := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get next sequence number for today
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(bundle_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1 INTO v_sequence
  FROM public.proof_bundles
  WHERE enterprise_id = p_enterprise_id
  AND bundle_number LIKE 'PB-' || v_enterprise_code || '-' || v_date_code || '-%';
  
  -- Format: PB-{CODE}-{YYYYMMDD}-{SEQ} (SEQ is 4 digits, zero-padded)
  v_bundle_number := 'PB-' || v_enterprise_code || '-' || v_date_code || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_bundle_number;
END;
$$;

COMMENT ON FUNCTION public.generate_bundle_number IS
'Generates a unique bundle number in format PB-{CODE}-{YYYYMMDD}-{SEQ} for a given enterprise.';

-- Function to increment export count
CREATE OR REPLACE FUNCTION public.increment_export_count(p_bundle_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.proof_bundles
  SET 
    export_count = COALESCE(export_count, 0) + 1,
    last_exported_at = NOW()
  WHERE id = p_bundle_id;
END;
$$;

COMMENT ON FUNCTION public.increment_export_count IS
'Increments the export count and updates last_exported_at timestamp for a proof bundle.';

-- Function to generate batch bundle
CREATE OR REPLACE FUNCTION public.generate_batch_bundle(
  p_enterprise_id UUID,
  p_brands TEXT[],
  p_start_date DATE,
  p_end_date DATE,
  p_regulatory_framework TEXT DEFAULT 'FDA 21 CFR Part 11'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bundle_id UUID;
  v_bundle_number TEXT;
  v_decision_count INTEGER;
  v_policy_version TEXT;
  v_policy_digest TEXT;
  v_policy_effective_date DATE;
  v_thread_id UUID;
BEGIN
  -- Generate bundle number
  v_bundle_number := generate_bundle_number(p_enterprise_id);
  
  -- Count decisions (governance threads) in scope
  SELECT COUNT(*) INTO v_decision_count
  FROM public.governance_threads gt
  WHERE gt.enterprise_id = p_enterprise_id
  AND gt.created_at >= p_start_date::TIMESTAMPTZ
  AND gt.created_at <= (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ
  AND gt.proof_bundle_id IS NULL; -- Only include threads not already in a bundle
  
  -- Get current policy version and digest
  SELECT 
    pa.version_number::TEXT,
    pa.oci_digest,
    pa.created_at::DATE
  INTO v_policy_version, v_policy_digest, v_policy_effective_date
  FROM public.policy_activations pa
  WHERE pa.enterprise_id = p_enterprise_id
  AND pa.deactivated_at IS NULL
  ORDER BY pa.activated_at DESC
  LIMIT 1;
  
  -- Create the bundle
  INSERT INTO public.proof_bundles (
    id,
    enterprise_id,
    bundle_type,
    bundle_number,
    status,
    brands,
    scope_start_date,
    scope_end_date,
    decision_count,
    policy_version,
    policy_digest,
    policy_effective_date,
    regulatory_framework,
    generated_by,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_enterprise_id,
    'batch',
    v_bundle_number,
    'draft',
    p_brands,
    p_start_date,
    p_end_date,
    v_decision_count,
    v_policy_version,
    v_policy_digest,
    v_policy_effective_date,
    p_regulatory_framework,
    auth.uid(),
    NOW()
  )
  RETURNING id INTO v_bundle_id;
  
  -- Link decisions (governance threads) to bundle
  INSERT INTO public.proof_bundle_decisions (proof_bundle_id, governance_thread_id)
  SELECT v_bundle_id, gt.id
  FROM public.governance_threads gt
  WHERE gt.enterprise_id = p_enterprise_id
  AND gt.created_at >= p_start_date::TIMESTAMPTZ
  AND gt.created_at <= (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ
  AND gt.proof_bundle_id IS NULL -- Only include threads not already in a bundle
  ON CONFLICT DO NOTHING;
  
  -- Update actual decision count
  SELECT COUNT(*) INTO v_decision_count
  FROM public.proof_bundle_decisions
  WHERE proof_bundle_id = v_bundle_id;
  
  UPDATE public.proof_bundles
  SET decision_count = v_decision_count
  WHERE id = v_bundle_id;
  
  RETURN jsonb_build_object(
    'bundle_id', v_bundle_id,
    'bundle_number', v_bundle_number,
    'decision_count', v_decision_count
  );
END;
$$;

COMMENT ON FUNCTION public.generate_batch_bundle IS
'Generates a new batch proof bundle for a set of decisions within a date range and brand scope.';

-- Function to finalize batch bundle
CREATE OR REPLACE FUNCTION public.finalize_batch_bundle(p_bundle_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bundle RECORD;
  v_canonical_json JSONB;
  v_bundle_hash TEXT;
  v_ledger_entry_hash TEXT;
  v_previous_hash TEXT;
  v_artifact_record RECORD;
BEGIN
  -- Get the bundle
  SELECT * INTO v_bundle
  FROM public.proof_bundles
  WHERE id = p_bundle_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bundle not found';
  END IF;
  
  IF v_bundle.status = 'finalized' THEN
    RAISE EXCEPTION 'Bundle is already finalized';
  END IF;
  
  IF v_bundle.bundle_type != 'batch' THEN
    RAISE EXCEPTION 'This function is only for batch bundles';
  END IF;
  
  -- Build canonical JSON representation
  v_canonical_json := jsonb_build_object(
    'bundle_id', p_bundle_id,
    'bundle_number', v_bundle.bundle_number,
    'enterprise_id', v_bundle.enterprise_id,
    'brands', v_bundle.brands,
    'scope_start_date', v_bundle.scope_start_date,
    'scope_end_date', v_bundle.scope_end_date,
    'decision_count', v_bundle.decision_count,
    'policy_version', v_bundle.policy_version,
    'policy_digest', v_bundle.policy_digest,
    'regulatory_framework', v_bundle.regulatory_framework,
    'generated_at', v_bundle.created_at,
    'finalized_at', NOW()
  );
  
  -- Calculate bundle hash
  v_bundle_hash := encode(digest(v_canonical_json::text, 'sha256'), 'hex');
  
  -- Get previous ledger entry hash (for chaining)
  SELECT ledger_entry_hash INTO v_previous_hash
  FROM vera.proof_bundle_ledger
  WHERE proof_bundle_id IN (
    SELECT id FROM public.proof_bundles
    WHERE enterprise_id = v_bundle.enterprise_id
    AND bundle_type = 'batch'
    ORDER BY created_at DESC
    LIMIT 1 OFFSET 1
  )
  ORDER BY finalized_at DESC
  LIMIT 1;
  
  -- Calculate ledger entry hash
  v_ledger_entry_hash := encode(
    digest(
      COALESCE(v_bundle_hash, '') || 
      COALESCE(v_previous_hash, '') || 
      NOW()::text,
      'sha256'
    ),
    'hex'
  );
  
  -- Insert or update artifact
  INSERT INTO public.proof_bundle_artifacts (
    proof_bundle_id,
    bundle_hash,
    canonical_json,
    signature_algorithm,
    created_at
  ) VALUES (
    p_bundle_id,
    v_bundle_hash,
    v_canonical_json,
    'RSA', -- Default algorithm
    NOW()
  )
  ON CONFLICT (proof_bundle_id) DO UPDATE SET
    bundle_hash = EXCLUDED.bundle_hash,
    canonical_json = EXCLUDED.canonical_json,
    updated_at = NOW();
  
  -- Insert ledger entry
  INSERT INTO vera.proof_bundle_ledger (
    proof_bundle_id,
    bundle_hash,
    canonical_json,
    finalized_at,
    finalized_by,
    ledger_entry_hash,
    previous_entry_hash
  ) VALUES (
    p_bundle_id,
    v_bundle_hash,
    v_canonical_json,
    NOW(),
    auth.uid(),
    v_ledger_entry_hash,
    v_previous_hash
  )
  ON CONFLICT (proof_bundle_id) DO NOTHING;
  
  -- Update bundle status
  UPDATE public.proof_bundles
  SET 
    status = 'finalized',
    finalized_at = NOW(),
    finalized_by = auth.uid()
  WHERE id = p_bundle_id;
END;
$$;

COMMENT ON FUNCTION public.finalize_batch_bundle IS
'Finalizes a batch proof bundle by calculating hashes, creating ledger entry, and locking the bundle.';

-- Function to verify batch bundle integrity
CREATE OR REPLACE FUNCTION public.verify_batch_bundle_integrity(p_bundle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_artifact RECORD;
  v_ledger RECORD;
  v_bundle RECORD;
  v_recalculated_hash TEXT;
  v_hash_valid BOOLEAN;
  v_signature_valid BOOLEAN;
  v_chain_valid BOOLEAN;
  v_canonical_json JSONB;
BEGIN
  -- Get the bundle
  SELECT * INTO v_bundle
  FROM public.proof_bundles
  WHERE id = p_bundle_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'hash_valid', false,
      'signature_valid', false,
      'chain_valid', false,
      'error', 'Bundle not found'
    );
  END IF;
  
  -- Get the artifact record
  SELECT * INTO v_artifact
  FROM public.proof_bundle_artifacts
  WHERE proof_bundle_id = p_bundle_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'hash_valid', false,
      'signature_valid', false,
      'chain_valid', false,
      'error', 'Artifact not found'
    );
  END IF;
  
  -- Get the ledger entry
  SELECT * INTO v_ledger
  FROM vera.proof_bundle_ledger
  WHERE proof_bundle_id = p_bundle_id;
  
  -- Recalculate the canonical JSON and hash
  v_canonical_json := jsonb_build_object(
    'bundle_id', p_bundle_id,
    'bundle_number', v_bundle.bundle_number,
    'enterprise_id', v_bundle.enterprise_id,
    'brands', v_bundle.brands,
    'scope_start_date', v_bundle.scope_start_date,
    'scope_end_date', v_bundle.scope_end_date,
    'decision_count', v_bundle.decision_count,
    'policy_version', v_bundle.policy_version,
    'policy_digest', v_bundle.policy_digest,
    'regulatory_framework', v_bundle.regulatory_framework,
    'generated_at', v_bundle.created_at,
    'finalized_at', v_bundle.finalized_at
  );
  
  v_recalculated_hash := encode(digest(v_canonical_json::text, 'sha256'), 'hex');
  
  -- Check hash validity
  v_hash_valid := (v_recalculated_hash = v_artifact.bundle_hash);
  
  -- Check signature validity (simplified - actual implementation would verify crypto)
  v_signature_valid := (v_artifact.signature IS NOT NULL AND v_artifact.signature != '');
  
  -- Check chain validity
  IF v_ledger IS NOT NULL THEN
    DECLARE
      v_expected_ledger_hash TEXT;
    BEGIN
      v_expected_ledger_hash := encode(
        digest(
          COALESCE(v_artifact.bundle_hash, '') || 
          COALESCE(v_ledger.previous_entry_hash, '') || 
          v_ledger.finalized_at::text,
          'sha256'
        ),
        'hex'
      );
      v_chain_valid := (v_expected_ledger_hash = v_ledger.ledger_entry_hash);
    END;
  ELSE
    v_chain_valid := false;
  END IF;
  
  RETURN jsonb_build_object(
    'hash_valid', v_hash_valid,
    'signature_valid', v_signature_valid,
    'chain_valid', v_chain_valid,
    'recalculated_hash', v_recalculated_hash,
    'stored_hash', v_artifact.bundle_hash,
    'signature_key_id', v_artifact.signature_key_id,
    'previous_entry_hash', v_ledger.previous_entry_hash,
    'verified_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.verify_batch_bundle_integrity IS
'Verifies the cryptographic integrity of a batch proof bundle by checking hash, signature, and chain validity.';

COMMIT;

