-- =============================================================================
-- MIGRATION: Add Regulatory Compliance to Proof Bundles
-- PURPOSE: Extend proof bundles with regulatory framework compliance metadata
-- =============================================================================

-- Add regulatory_compliance JSONB column to proof_bundles table
ALTER TABLE public.proof_bundles 
  ADD COLUMN IF NOT EXISTS regulatory_compliance JSONB DEFAULT '{}'::jsonb;

-- Create index for GIN queries on regulatory_compliance
CREATE INDEX IF NOT EXISTS idx_proof_bundles_regulatory_compliance 
  ON public.proof_bundles USING GIN (regulatory_compliance);

-- Add comment explaining the structure
COMMENT ON COLUMN public.proof_bundles.regulatory_compliance IS 
'Regulatory compliance metadata: {
  "frameworks_addressed": [{
    "framework_id": "uuid",
    "framework_name": "string",
    "requirements_met": ["requirement_id"],
    "requirements_partial": ["requirement_id"],
    "requirements_missing": ["requirement_id"],
    "coverage_percentage": 0-100
  }],
  "export_formats_available": ["pdf", "json", "fda_ectd"],
  "disclosure_attestations": [{
    "framework_id": "uuid",
    "requirement_id": "uuid",
    "attested": true,
    "attested_at": "timestamp"
  }]
}';

