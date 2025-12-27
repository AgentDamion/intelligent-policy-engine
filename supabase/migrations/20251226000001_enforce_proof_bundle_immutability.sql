-- =============================================================================
-- MIGRATION: Enforce Proof Bundle Immutability
-- PURPOSE: Create append-only ledger table and block updates on finalized bundles
-- =============================================================================

-- Create vera schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS vera;

-- Create append-only ledger table for finalized bundles
CREATE TABLE IF NOT EXISTS vera.proof_bundle_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_bundle_id UUID NOT NULL,
  bundle_hash TEXT NOT NULL,
  canonical_json JSONB NOT NULL,
  signature TEXT,
  signature_algorithm TEXT,
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_by UUID REFERENCES auth.users(id),
  ledger_entry_hash TEXT NOT NULL,              -- Hash of this ledger entry for chain integrity
  previous_entry_hash TEXT,                     -- Hash of previous entry for chaining
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(proof_bundle_id),
  CONSTRAINT valid_signature_algorithm CHECK (signature_algorithm IN ('RSA', 'ECDSA', 'EdDSA', NULL))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proof_bundle_ledger_bundle_hash 
  ON vera.proof_bundle_ledger(bundle_hash);
CREATE INDEX IF NOT EXISTS idx_proof_bundle_ledger_proof_bundle_id 
  ON vera.proof_bundle_ledger(proof_bundle_id);
CREATE INDEX IF NOT EXISTS idx_proof_bundle_ledger_finalized_at 
  ON vera.proof_bundle_ledger(finalized_at);
CREATE INDEX IF NOT EXISTS idx_proof_bundle_ledger_ledger_entry_hash 
  ON vera.proof_bundle_ledger(ledger_entry_hash);

-- Add finalized_at and finalized_by columns to proof_bundles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proof_bundles' 
    AND column_name = 'finalized_at'
  ) THEN
    ALTER TABLE public.proof_bundles 
      ADD COLUMN finalized_at TIMESTAMPTZ,
      ADD COLUMN finalized_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create function to prevent updates/deletes on finalized bundles
CREATE OR REPLACE FUNCTION prevent_finalized_bundle_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if bundle is finalized
  IF OLD.finalized_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot modify finalized proof bundle. Bundle was finalized at %', OLD.finalized_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to block updates on finalized bundles
DROP TRIGGER IF EXISTS prevent_finalized_bundle_update ON public.proof_bundles;
CREATE TRIGGER prevent_finalized_bundle_update
  BEFORE UPDATE ON public.proof_bundles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_finalized_bundle_modification();

-- Create trigger to block deletes on finalized bundles
DROP TRIGGER IF EXISTS prevent_finalized_bundle_delete ON public.proof_bundles;
CREATE TRIGGER prevent_finalized_bundle_delete
  BEFORE DELETE ON public.proof_bundles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_finalized_bundle_modification();

-- Create function to move finalized bundle to ledger
CREATE OR REPLACE FUNCTION move_finalized_bundle_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
  artifact_record RECORD;
  previous_hash TEXT;
  ledger_entry_hash TEXT;
BEGIN
  -- Only process if bundle is being finalized
  IF NEW.finalized_at IS NOT NULL AND OLD.finalized_at IS NULL THEN
    -- Get artifact record
    SELECT * INTO artifact_record
    FROM public.proof_bundle_artifacts
    WHERE proof_bundle_id = NEW.id;
    
    -- Get previous ledger entry hash (for chaining)
    SELECT ledger_entry_hash INTO previous_hash
    FROM vera.proof_bundle_ledger
    ORDER BY finalized_at DESC
    LIMIT 1;
    
    -- Calculate ledger entry hash (hash of bundle_hash + previous_hash + finalized_at)
    ledger_entry_hash := encode(
      digest(
        COALESCE(artifact_record.bundle_hash, '') || 
        COALESCE(previous_hash, '') || 
        NEW.finalized_at::text,
        'sha256'
      ),
      'hex'
    );
    
    -- Insert into ledger
    INSERT INTO vera.proof_bundle_ledger (
      proof_bundle_id,
      bundle_hash,
      canonical_json,
      signature,
      signature_algorithm,
      finalized_at,
      finalized_by,
      ledger_entry_hash,
      previous_entry_hash
    ) VALUES (
      NEW.id,
      artifact_record.bundle_hash,
      artifact_record.canonical_json,
      artifact_record.signature,
      artifact_record.signature_algorithm,
      NEW.finalized_at,
      NEW.finalized_by,
      ledger_entry_hash,
      previous_hash
    )
    ON CONFLICT (proof_bundle_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically move finalized bundles to ledger
DROP TRIGGER IF EXISTS auto_move_to_ledger ON public.proof_bundles;
CREATE TRIGGER auto_move_to_ledger
  AFTER UPDATE ON public.proof_bundles
  FOR EACH ROW
  EXECUTE FUNCTION move_finalized_bundle_to_ledger();

-- Enable RLS on ledger table
ALTER TABLE vera.proof_bundle_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view ledger entries for bundles they have access to
CREATE POLICY "Users can view proof bundle ledger entries"
  ON vera.proof_bundle_ledger
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
CREATE POLICY "Service role has full access to proof bundle ledger"
  ON vera.proof_bundle_ledger
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE vera.proof_bundle_ledger IS 
'Append-only ledger for finalized proof bundles. Provides immutable audit trail.';

COMMENT ON COLUMN vera.proof_bundle_ledger.ledger_entry_hash IS 
'Hash of this ledger entry (bundle_hash + previous_hash + finalized_at) for chain integrity';

COMMENT ON COLUMN vera.proof_bundle_ledger.previous_entry_hash IS 
'Hash of previous ledger entry for chaining and tamper detection';

