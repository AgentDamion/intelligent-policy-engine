-- Migration: 20251228000002_policy_snapshot_embedding.sql
-- Purpose: Add full policy snapshots and context capture to decision records
-- Priority: P1 - Week 2 of 12-week pharma pilot timeline
--
-- This migration enables:
-- - Complete policy JSON embedding at decision time (FDA 21 CFR Part 11)
-- - Full context snapshots for decision replay capability
-- - Precedent linking infrastructure for context graph
-- - Electronic signature support for critical governance actions

BEGIN;

-- ============================================================
-- PART 1: Add policy snapshot columns to proof_bundles
-- ============================================================

ALTER TABLE public.proof_bundles
ADD COLUMN IF NOT EXISTS policy_snapshot JSONB,
ADD COLUMN IF NOT EXISTS policy_snapshot_version TEXT,
ADD COLUMN IF NOT EXISTS context_snapshot JSONB;

COMMENT ON COLUMN public.proof_bundles.policy_snapshot IS 
'Complete policy JSON that was in effect at decision time. FDA 21 CFR Part 11 requirement for complete audit trail reconstruction.';

COMMENT ON COLUMN public.proof_bundles.policy_snapshot_version IS 
'Version identifier of the policy snapshot for quick reference without parsing JSON.';

COMMENT ON COLUMN public.proof_bundles.context_snapshot IS 
'Complete decision context including partner state, tool profile, regulatory environment, and submission details.';

-- ============================================================
-- PART 2: Add context snapshot and precedent fields to governance_actions
-- ============================================================

ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS context_snapshot JSONB,
ADD COLUMN IF NOT EXISTS precedent_action_ids UUID[],
ADD COLUMN IF NOT EXISTS similar_decisions JSONB,
ADD COLUMN IF NOT EXISTS precedent_influence_score NUMERIC(3,2);

COMMENT ON COLUMN public.governance_actions.context_snapshot IS 
'Complete state capture at action time for decision replay capability. Includes policy state, partner state, tool state, and enterprise context.';

COMMENT ON COLUMN public.governance_actions.precedent_action_ids IS 
'Array of prior governance action IDs that influenced this decision. Enables context graph traversal and precedent-based reasoning.';

COMMENT ON COLUMN public.governance_actions.similar_decisions IS 
'JSON array of similar historical decisions with similarity scores. Format: [{decision_id, similarity_score, outcome}]';

COMMENT ON COLUMN public.governance_actions.precedent_influence_score IS 
'Aggregate influence score (0.00-1.00) indicating how much prior precedents affected this decision.';

-- ============================================================
-- PART 3: Add electronic signature support (FDA 21 CFR Part 11)
-- ============================================================

ALTER TABLE public.governance_actions
ADD COLUMN IF NOT EXISTS electronic_signature BYTEA,
ADD COLUMN IF NOT EXISTS signature_algorithm TEXT,
ADD COLUMN IF NOT EXISTS signature_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signer_certificate TEXT,
ADD COLUMN IF NOT EXISTS signature_reason TEXT,
ADD COLUMN IF NOT EXISTS signature_meaning TEXT;

-- Add constraint for signature algorithm (only if column was just added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'governance_actions_signature_algorithm_check'
  ) THEN
    ALTER TABLE public.governance_actions
    ADD CONSTRAINT governance_actions_signature_algorithm_check 
    CHECK (signature_algorithm IS NULL OR signature_algorithm IN ('RSA', 'ECDSA', 'EdDSA'));
  END IF;
END $$;

COMMENT ON COLUMN public.governance_actions.electronic_signature IS 
'FDA 21 CFR Part 11 compliant electronic signature for critical governance actions. Binary signature data.';

COMMENT ON COLUMN public.governance_actions.signature_algorithm IS 
'Cryptographic algorithm used for signature: RSA (recommended for pharma), ECDSA, or EdDSA.';

COMMENT ON COLUMN public.governance_actions.signature_timestamp IS 
'Server-side timestamp when signature was applied. Must be secure, computer-generated per 21 CFR 11.10(e).';

COMMENT ON COLUMN public.governance_actions.signer_certificate IS 
'X.509 certificate or public key identifier of the signer for signature verification.';

COMMENT ON COLUMN public.governance_actions.signature_reason IS 
'Reason for signing (e.g., "approval", "rejection", "escalation"). Required for 21 CFR 11.50.';

COMMENT ON COLUMN public.governance_actions.signature_meaning IS 
'Legal meaning of the signature (e.g., "I approve this governance decision"). Required for 21 CFR 11.50.';

-- ============================================================
-- PART 4: Create indexes for precedent lookups and context queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_governance_actions_precedents 
ON public.governance_actions USING GIN(precedent_action_ids);

CREATE INDEX IF NOT EXISTS idx_governance_actions_context_snapshot
ON public.governance_actions USING GIN(context_snapshot jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_proof_bundles_policy_snapshot
ON public.proof_bundles USING GIN(policy_snapshot jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_proof_bundles_context_snapshot
ON public.proof_bundles USING GIN(context_snapshot jsonb_path_ops);

-- Index for finding decisions by policy version
CREATE INDEX IF NOT EXISTS idx_proof_bundles_policy_version
ON public.proof_bundles(policy_snapshot_version);

-- Index for signature timestamp queries (audit trail)
CREATE INDEX IF NOT EXISTS idx_governance_actions_signature_timestamp
ON public.governance_actions(signature_timestamp)
WHERE signature_timestamp IS NOT NULL;

-- ============================================================
-- PART 5: Add user_id to vera.events for FDA compliance (if exists)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'vera' AND table_name = 'events'
  ) THEN
    -- Add user tracking columns
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'vera' AND table_name = 'events' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE vera.events ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'vera' AND table_name = 'events' AND column_name = 'actor_type'
    ) THEN
      ALTER TABLE vera.events ADD COLUMN actor_type TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'vera' AND table_name = 'events' AND column_name = 'agent_name'
    ) THEN
      ALTER TABLE vera.events ADD COLUMN agent_name TEXT;
    END IF;
  END IF;
END $$;

-- ============================================================
-- PART 6: Create system_validations table for FDA 21 CFR Part 11
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  validation_type TEXT NOT NULL,
  validation_date TIMESTAMPTZ NOT NULL,
  validated_by UUID NOT NULL REFERENCES auth.users(id),
  validation_document_url TEXT,
  validation_results JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT system_validations_type_check 
    CHECK (validation_type IN ('installation', 'operational', 'performance', 'periodic', 'change_control')),
  CONSTRAINT system_validations_status_check 
    CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'expired'))
);

-- Enable RLS on system_validations
ALTER TABLE public.system_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_validations_enterprise_access"
ON public.system_validations
FOR SELECT TO authenticated
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "system_validations_admin_insert"
ON public.system_validations
FOR INSERT TO authenticated
WITH CHECK (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "system_validations_admin_update"
ON public.system_validations
FOR UPDATE TO authenticated
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "system_validations_service_role"
ON public.system_validations
FOR ALL TO service_role
USING (true) WITH CHECK (true);

COMMENT ON TABLE public.system_validations IS 
'FDA 21 CFR Part 11 requirement: System validation records including IQ, OQ, PQ, and periodic revalidation. Required for pharma client compliance.';

-- ============================================================
-- PART 7: Create function for finding similar decisions (precedent system)
-- ============================================================

CREATE OR REPLACE FUNCTION public.find_similar_governance_decisions(
  p_enterprise_id UUID,
  p_action_type TEXT,
  p_context_keys TEXT[],
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  action_id UUID,
  thread_id UUID,
  action_type TEXT,
  rationale TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  similarity_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ga.id as action_id,
    ga.thread_id,
    ga.action_type,
    ga.rationale,
    ga.metadata,
    ga.created_at,
    -- Basic similarity score based on action type match and recency
    CASE 
      WHEN ga.action_type = p_action_type THEN 0.5
      ELSE 0.2
    END + 
    -- Recency bonus (more recent = higher score)
    GREATEST(0, 0.3 * (1 - EXTRACT(EPOCH FROM (NOW() - ga.created_at)) / (86400 * 365)))
    AS similarity_score
  FROM public.governance_actions ga
  JOIN public.governance_threads gt ON ga.thread_id = gt.id
  WHERE gt.enterprise_id = p_enterprise_id
    AND ga.action_type IN ('approve', 'reject', 'escalate', 'evaluate')
  ORDER BY similarity_score DESC, ga.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.find_similar_governance_decisions IS 
'Find similar historical governance decisions for precedent linking. Returns top N similar decisions based on action type and recency.';

-- ============================================================
-- PART 8: Complete FDA 21 CFR Part 11 evidence mapping
-- ============================================================

-- Map remaining FDA requirements to evidence sources
INSERT INTO public.requirement_evidence_map (
  requirement_id, 
  evidence_type, 
  evidence_source, 
  evidence_field, 
  evidence_filter,
  validation_rule, 
  validation_params, 
  coverage_contribution, 
  is_required
)
SELECT 
  fr.id,
  'electronic_signature',
  'governance_actions',
  'electronic_signature',
  '{"signature_timestamp": {"$ne": null}}'::jsonb,
  'exists',
  '{}'::jsonb,
  1.0,
  true
FROM public.framework_requirements fr
JOIN public.regulatory_frameworks rf ON fr.framework_id = rf.id
WHERE rf.short_name = 'FDA_21CFR11' 
  AND fr.requirement_code = '21CFR11_10C'
  AND NOT EXISTS (
    SELECT 1 FROM public.requirement_evidence_map rem 
    WHERE rem.requirement_id = fr.id 
      AND rem.evidence_type = 'electronic_signature'
  );

-- Access controls evidence (21CFR11_10B)
INSERT INTO public.requirement_evidence_map (
  requirement_id, 
  evidence_type, 
  evidence_source, 
  evidence_field, 
  evidence_filter,
  validation_rule, 
  validation_params, 
  coverage_contribution, 
  is_required
)
SELECT 
  fr.id,
  'access_control',
  'enterprise_members',
  'role',
  '{"role": {"$in": ["owner", "admin", "member"]}}'::jsonb,
  'exists',
  '{}'::jsonb,
  1.0,
  true
FROM public.framework_requirements fr
JOIN public.regulatory_frameworks rf ON fr.framework_id = rf.id
WHERE rf.short_name = 'FDA_21CFR11' 
  AND fr.requirement_code = '21CFR11_10B'
  AND NOT EXISTS (
    SELECT 1 FROM public.requirement_evidence_map rem 
    WHERE rem.requirement_id = fr.id 
      AND rem.evidence_type = 'access_control'
  );

-- System validation evidence (21CFR11_10A)
INSERT INTO public.requirement_evidence_map (
  requirement_id, 
  evidence_type, 
  evidence_source, 
  evidence_field, 
  evidence_filter,
  validation_rule, 
  validation_params, 
  coverage_contribution, 
  is_required
)
SELECT 
  fr.id,
  'system_validation',
  'system_validations',
  'status',
  '{"status": "approved"}'::jsonb,
  'exists',
  '{}'::jsonb,
  1.0,
  true
FROM public.framework_requirements fr
JOIN public.regulatory_frameworks rf ON fr.framework_id = rf.id
WHERE rf.short_name = 'FDA_21CFR11' 
  AND fr.requirement_code = '21CFR11_10A'
  AND NOT EXISTS (
    SELECT 1 FROM public.requirement_evidence_map rem 
    WHERE rem.requirement_id = fr.id 
      AND rem.evidence_type = 'system_validation'
  );

COMMIT;

