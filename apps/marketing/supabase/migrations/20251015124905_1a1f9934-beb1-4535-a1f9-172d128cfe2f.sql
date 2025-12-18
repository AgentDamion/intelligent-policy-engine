-- ============================================
-- Policy Object Model (POM) Infrastructure
-- ============================================

-- Add pom column to policies table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'policies' 
    AND column_name = 'pom'
  ) THEN
    ALTER TABLE public.policies ADD COLUMN pom JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create proof_bundles table with immutability
CREATE TABLE IF NOT EXISTS public.proof_bundles (
  bundle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  rfp_id TEXT,
  workflow_trace JSONB NOT NULL DEFAULT '[]'::jsonb,
  artifacts JSONB NOT NULL DEFAULT '{}'::jsonb,
  hash TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create policy_gaps table
CREATE TABLE IF NOT EXISTS public.policy_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE NOT NULL,
  field_path TEXT NOT NULL,
  gap_type TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  hint TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create policy_alignments table
CREATE TABLE IF NOT EXISTS public.policy_alignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE NOT NULL,
  client_id UUID,
  client_enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE,
  external_policy_id TEXT,
  external_policy_name TEXT,
  snapshot_id TEXT NOT NULL,
  harmonized_pom JSONB NOT NULL DEFAULT '{}'::jsonb,
  conflicts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create rfp_profiles table
CREATE TABLE IF NOT EXISTS public.rfp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  requires JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme_weights JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create policy_ingest_mappings table
CREATE TABLE IF NOT EXISTS public.policy_ingest_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  extractor_version TEXT NOT NULL,
  mapping_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  field_extractors JSONB DEFAULT '{}'::jsonb,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_type, extractor_version)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- GIN index on policies.pom for JSONB queries
CREATE INDEX IF NOT EXISTS idx_policies_pom_gin ON public.policies USING GIN (pom);

-- Composite index on policy_gaps for efficient gap queries
CREATE INDEX IF NOT EXISTS idx_policy_gaps_policy_severity 
  ON public.policy_gaps(policy_id, severity) WHERE resolved_at IS NULL;

-- Index on policy_alignments for client lookups
CREATE INDEX IF NOT EXISTS idx_policy_alignments_policy_id 
  ON public.policy_alignments(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_alignments_client_enterprise 
  ON public.policy_alignments(client_enterprise_id);

-- Index on proof_bundles for hash verification
CREATE INDEX IF NOT EXISTS idx_proof_bundles_hash 
  ON public.proof_bundles(hash);

-- Index on rfp_profiles for profile_id lookups
CREATE INDEX IF NOT EXISTS idx_rfp_profiles_profile_id 
  ON public.rfp_profiles(profile_id);

-- ============================================
-- Immutability Trigger for proof_bundles
-- ============================================

CREATE OR REPLACE FUNCTION prevent_proof_bundle_modifications()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    RAISE EXCEPTION 'Cannot delete proof bundles - immutable audit record';
  ELSIF (TG_OP = 'UPDATE') THEN
    RAISE EXCEPTION 'Cannot modify proof bundles - immutable audit record';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_proof_bundle_delete
  BEFORE DELETE ON public.proof_bundles
  FOR EACH ROW EXECUTE FUNCTION prevent_proof_bundle_modifications();

CREATE TRIGGER prevent_proof_bundle_update
  BEFORE UPDATE ON public.proof_bundles
  FOR EACH ROW EXECUTE FUNCTION prevent_proof_bundle_modifications();

-- ============================================
-- Updated_at Triggers
-- ============================================

CREATE TRIGGER update_policy_alignments_updated_at
  BEFORE UPDATE ON public.policy_alignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfp_profiles_updated_at
  BEFORE UPDATE ON public.rfp_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_ingest_mappings_updated_at
  BEFORE UPDATE ON public.policy_ingest_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE public.proof_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_ingest_mappings ENABLE ROW LEVEL SECURITY;

-- Proof Bundles: Users can view bundles for their workspaces/enterprises
CREATE POLICY "Users can view proof bundles in their context"
  ON public.proof_bundles FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id::text = (artifacts->>'submission_id')::text
        AND s.workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

-- Proof Bundles: Service role can create bundles
CREATE POLICY "Service role can create proof bundles"
  ON public.proof_bundles FOR INSERT
  WITH CHECK (true);

-- Policy Gaps: Users can view gaps for policies they have access to
CREATE POLICY "Users can view policy gaps for accessible policies"
  ON public.policy_gaps FOR SELECT
  USING (
    policy_id IN (
      SELECT p.id FROM public.policies p
      WHERE p.enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy Gaps: Users can update gaps for their enterprise policies
CREATE POLICY "Users can resolve policy gaps"
  ON public.policy_gaps FOR UPDATE
  USING (
    policy_id IN (
      SELECT p.id FROM public.policies p
      WHERE p.enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy Gaps: System can create gaps
CREATE POLICY "System can create policy gaps"
  ON public.policy_gaps FOR INSERT
  WITH CHECK (true);

-- Policy Alignments: Users can view alignments for accessible policies
CREATE POLICY "Users can view policy alignments"
  ON public.policy_alignments FOR SELECT
  USING (
    policy_id IN (
      SELECT p.id FROM public.policies p
      WHERE p.enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy Alignments: Users can create alignments for their policies
CREATE POLICY "Users can create policy alignments"
  ON public.policy_alignments FOR INSERT
  WITH CHECK (
    policy_id IN (
      SELECT p.id FROM public.policies p
      WHERE p.enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid()
      )
    )
  );

-- RFP Profiles: All authenticated users can view profiles
CREATE POLICY "Authenticated users can view RFP profiles"
  ON public.rfp_profiles FOR SELECT
  TO authenticated
  USING (true);

-- RFP Profiles: Admins can manage profiles
CREATE POLICY "Admins can manage RFP profiles"
  ON public.rfp_profiles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Policy Ingest Mappings: All authenticated users can view mappings
CREATE POLICY "Authenticated users can view ingest mappings"
  ON public.policy_ingest_mappings FOR SELECT
  TO authenticated
  USING (true);

-- Policy Ingest Mappings: Admins can manage mappings
CREATE POLICY "Admins can manage ingest mappings"
  ON public.policy_ingest_mappings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- Seed RFP Profiles
-- ============================================

INSERT INTO public.rfp_profiles (profile_id, name, description, client_name, requires, theme_weights)
VALUES 
  (
    'RFP_JNJ_STD_2025',
    'Johnson & Johnson Standard RFP',
    'Standard AI usage disclosure requirements for J&J RFPs',
    'Johnson & Johnson',
    '["usage_disclosure.*", "tools[].{name,version,purpose,approval}", "data_controls.{data_classes,isolation}", "controls.{hitl,validation,bias,redaction}", "auditability.{log_scope,export_formats}", "alignment.{client_policy_refs,contractual_addenda}"]'::jsonb,
    '{"disclosure": 0.25, "tools": 0.20, "data": 0.15, "controls": 0.20, "audit": 0.10, "alignment": 0.10}'::jsonb
  ),
  (
    'RFP_PFE_STD_2025',
    'Pfizer Standard RFP',
    'Standard AI compliance requirements for Pfizer RFPs',
    'Pfizer',
    '["usage_disclosure.*", "tools[].{name,version,purpose,approval,contexts}", "data_controls.{data_classes,isolation,retention,third_parties}", "controls.{hitl,validation,testing,bias}", "governance.{roles,approvals}", "auditability.{log_scope,signature,export_formats}"]'::jsonb,
    '{"disclosure": 0.20, "tools": 0.20, "data": 0.20, "controls": 0.20, "governance": 0.10, "audit": 0.10}'::jsonb
  ),
  (
    'RFP_NVS_STD_2025',
    'Novartis Standard RFP',
    'Standard AI governance requirements for Novartis RFPs',
    'Novartis',
    '["usage_disclosure.*", "tools[].{name,version,provider,purpose,approval}", "data_controls.{data_classes,isolation,third_parties}", "controls.{hitl,validation,bias,redaction}", "governance.{roles,approvals,exceptions}", "alignment.{client_policy_refs}"]'::jsonb,
    '{"disclosure": 0.20, "tools": 0.15, "data": 0.20, "controls": 0.20, "governance": 0.15, "alignment": 0.10}'::jsonb
  )
ON CONFLICT (profile_id) DO NOTHING;