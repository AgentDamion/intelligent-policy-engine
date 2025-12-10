-- ================================
-- PROOF REQUIREMENTS SPINE v1
-- ================================
-- Migration: 20250115000000
-- Description: Create proof requirements system with atoms, packs, profiles, and atom states
-- This implements the Proof Spine v1 architecture for managing proof requirements per submission

-- ============================================
-- STEP 1: Add enterprise_id to submissions if missing
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE submissions ADD COLUMN enterprise_id UUID;
    
    -- Try to populate from organization_enterprise_mapping if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_enterprise_mapping') THEN
      UPDATE submissions s
      SET enterprise_id = (
        SELECT enterprise_id 
        FROM organization_enterprise_mapping oem 
        WHERE oem.organization_id = s.organization_id 
        LIMIT 1
      )
      WHERE enterprise_id IS NULL;
    END IF;
    
    -- Add foreign key constraint
    ALTER TABLE submissions 
      ADD CONSTRAINT submissions_enterprise_id_fkey 
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE;
    
    -- Add index
    CREATE INDEX IF NOT EXISTS idx_submissions_enterprise ON submissions(enterprise_id);
  END IF;
END $$;

-- ============================================
-- STEP 2: PROOF ATOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.proof_atoms (
  id TEXT PRIMARY KEY,              -- e.g. 'AI_ORIGIN_LABEL'
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,           -- 'ai_usage', 'provenance', 'compliance', etc.
  data_type TEXT NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'enum', 'object', 'array')),
  schema JSONB,                     -- JSON schema for validation (optional)
  collection_method TEXT NOT NULL CHECK (collection_method IN ('auto', 'manual', 'hybrid')),
  sensitivity_level TEXT NOT NULL CHECK (sensitivity_level IN ('low', 'medium', 'high')),
  version TEXT NOT NULL,
  enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE, -- NULL = global atom
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_atoms_category ON public.proof_atoms(category);
CREATE INDEX IF NOT EXISTS idx_proof_atoms_enterprise ON public.proof_atoms(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_proof_atoms_collection_method ON public.proof_atoms(collection_method);

-- ============================================
-- STEP 3: PROOF PACKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.proof_packs (
  id TEXT PRIMARY KEY,              -- e.g. 'eu_public_ai_content_v1'
  enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE, -- NULL = global pack
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- optional; can be NULL for global
  label TEXT NOT NULL,
  description TEXT,
  priority INT NOT NULL DEFAULT 0,
  applies_when JSONB DEFAULT '{}'::jsonb, -- { jurisdictions: [], channels: [], assetTypes: [], categories: [], aiUsed: boolean }
  severity TEXT NOT NULL CHECK (severity IN ('regulatory', 'contractual', 'advisory')),
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_packs_enterprise ON public.proof_packs(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_proof_packs_organization ON public.proof_packs(organization_id);
CREATE INDEX IF NOT EXISTS idx_proof_packs_priority ON public.proof_packs(priority DESC);

-- ============================================
-- STEP 4: PROOF PACK ATOMS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS public.proof_pack_atoms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proof_pack_id TEXT NOT NULL REFERENCES public.proof_packs(id) ON DELETE CASCADE,
  atom_id TEXT NOT NULL REFERENCES public.proof_atoms(id) ON DELETE RESTRICT,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  constraints JSONB DEFAULT '{}'::jsonb, -- { allowedValues: [], forbiddenValues: [], min: number, max: number }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proof_pack_id, atom_id)
);

CREATE INDEX IF NOT EXISTS idx_proof_pack_atoms_pack ON public.proof_pack_atoms(proof_pack_id);
CREATE INDEX IF NOT EXISTS idx_proof_pack_atoms_atom ON public.proof_pack_atoms(atom_id);
CREATE INDEX IF NOT EXISTS idx_proof_pack_atoms_required ON public.proof_pack_atoms(required);

-- ============================================
-- STEP 5: REQUIREMENTS PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.requirements_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  profile_key TEXT NOT NULL,        -- e.g. 'eu_public_ai_content_v1+us_pharma_promo_v1'
  source_packs TEXT[] NOT NULL,     -- array of pack ids
  required_atoms TEXT[] NOT NULL,    -- array of atom ids
  optional_atoms TEXT[] NOT NULL,    -- array of atom ids
  constraints JSONB DEFAULT '{}'::jsonb, -- { [atomId]: { allowedValues, forbiddenValues, min, max } }
  conflicts TEXT[] DEFAULT '[]'::text[], -- array of conflict strings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id)              -- One profile per submission
);

CREATE INDEX IF NOT EXISTS idx_requirements_profiles_submission ON public.requirements_profiles(submission_id);
CREATE INDEX IF NOT EXISTS idx_requirements_profiles_enterprise ON public.requirements_profiles(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_requirements_profiles_organization ON public.requirements_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_requirements_profiles_profile_key ON public.requirements_profiles(profile_key);

-- ============================================
-- STEP 6: SUBMISSION ATOM STATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.submission_atom_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  atom_id TEXT NOT NULL REFERENCES public.proof_atoms(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('missing', 'present', 'waived', 'invalid')),
  value JSONB,
  source_packs TEXT[] NOT NULL DEFAULT '[]'::text[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(submission_id, atom_id)
);

CREATE INDEX IF NOT EXISTS idx_submission_atom_states_submission ON public.submission_atom_states(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_atom_states_atom ON public.submission_atom_states(atom_id);
CREATE INDEX IF NOT EXISTS idx_submission_atom_states_status ON public.submission_atom_states(status);
CREATE INDEX IF NOT EXISTS idx_submission_atom_states_enterprise ON public.submission_atom_states(enterprise_id);

-- ============================================
-- STEP 7: PROOF BUNDLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.proof_bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  requirements_profile_id UUID REFERENCES public.requirements_profiles(id) ON DELETE SET NULL,
  atom_states_snapshot JSONB DEFAULT '[]'::jsonb, -- snapshot of submission_atom_states at decision time
  decision TEXT CHECK (decision IN ('approved', 'rejected', 'needs_review', 'pending')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_bundles_submission ON public.proof_bundles(submission_id);
CREATE INDEX IF NOT EXISTS idx_proof_bundles_profile ON public.proof_bundles(requirements_profile_id);
CREATE INDEX IF NOT EXISTS idx_proof_bundles_enterprise ON public.proof_bundles(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_proof_bundles_decision ON public.proof_bundles(decision);

-- ============================================
-- STEP 8: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Proof Atoms: Global atoms readable by all, tenant atoms by enterprise members
ALTER TABLE public.proof_atoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view global proof atoms" ON public.proof_atoms
  FOR SELECT TO authenticated USING (enterprise_id IS NULL);

CREATE POLICY "Users can view enterprise proof atoms" ON public.proof_atoms
  FOR SELECT TO authenticated USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to proof_atoms" ON public.proof_atoms
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Proof Packs: Similar pattern
ALTER TABLE public.proof_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view global proof packs" ON public.proof_packs
  FOR SELECT TO authenticated USING (enterprise_id IS NULL);

CREATE POLICY "Users can view enterprise proof packs" ON public.proof_packs
  FOR SELECT TO authenticated USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to proof_packs" ON public.proof_packs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Proof Pack Atoms: Inherit from packs
ALTER TABLE public.proof_pack_atoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proof pack atoms for accessible packs" ON public.proof_pack_atoms
  FOR SELECT TO authenticated USING (
    proof_pack_id IN (
      SELECT id FROM public.proof_packs WHERE 
        enterprise_id IS NULL OR
        enterprise_id IN (
          SELECT enterprise_id FROM public.enterprise_members 
          WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Service role has full access to proof_pack_atoms" ON public.proof_pack_atoms
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Requirements Profiles: Enterprise-scoped
ALTER TABLE public.requirements_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requirements profiles in their enterprise" ON public.requirements_profiles
  FOR SELECT TO authenticated USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to requirements_profiles" ON public.requirements_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Submission Atom States: Enterprise-scoped
ALTER TABLE public.submission_atom_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view atom states in their enterprise" ON public.submission_atom_states
  FOR SELECT TO authenticated USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update atom states in their enterprise" ON public.submission_atom_states
  FOR UPDATE TO authenticated USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to submission_atom_states" ON public.submission_atom_states
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Proof Bundles: Enterprise-scoped
ALTER TABLE public.proof_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proof bundles in their enterprise" ON public.proof_bundles
  FOR SELECT TO authenticated USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to proof_bundles" ON public.proof_bundles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- STEP 9: TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proof_atoms_updated_at
  BEFORE UPDATE ON public.proof_atoms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proof_packs_updated_at
  BEFORE UPDATE ON public.proof_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proof_pack_atoms_updated_at
  BEFORE UPDATE ON public.proof_pack_atoms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requirements_profiles_updated_at
  BEFORE UPDATE ON public.requirements_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submission_atom_states_updated_at
  BEFORE UPDATE ON public.submission_atom_states
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STEP 10: SEED DATA - Proof Atoms
-- ============================================
INSERT INTO public.proof_atoms (id, label, description, category, data_type, collection_method, sensitivity_level, version, enterprise_id) VALUES
  ('AI_ORIGIN_LABEL', 'AI Origin Label', 'Label indicating AI-generated content origin', 'ai_usage', 'string', 'auto', 'medium', '1.0', NULL),
  ('C2PA_MANIFEST_HASH', 'C2PA Manifest Hash', 'Cryptographic hash of C2PA manifest proving content provenance', 'provenance', 'string', 'auto', 'high', '1.0', NULL),
  ('HUMAN_REVIEW_EVENT', 'Human Review Event', 'Record of human review/approval event', 'compliance', 'object', 'manual', 'high', '1.0', NULL),
  ('POLICY_SNAPSHOT_ID', 'Policy Snapshot ID', 'Reference to policy version in effect at decision time', 'compliance', 'string', 'auto', 'medium', '1.0', NULL),
  ('TOOL_VERSION_LIST', 'Tool Version List', 'List of AI tools and versions used in content creation', 'ai_usage', 'array', 'auto', 'medium', '1.0', NULL),
  ('JURISDICTION_TAGS', 'Jurisdiction Tags', 'Tags indicating applicable jurisdictions/regulations', 'compliance', 'array', 'manual', 'high', '1.0', NULL),
  ('ANCHOR_HASH', 'Anchor Hash', 'Blockchain anchor hash for immutable proof record', 'provenance', 'string', 'auto', 'high', '1.0', NULL),
  ('DATA_CLASSIFICATION', 'Data Classification', 'Classification of data sensitivity (PII, PHI, etc.)', 'compliance', 'enum', 'manual', 'high', '1.0', NULL),
  ('VENDOR_CERTIFICATION', 'Vendor Certification', 'Vendor compliance certifications (SOC2, ISO27001, etc.)', 'compliance', 'array', 'manual', 'medium', '1.0', NULL),
  ('CONTENT_MODERATION_RESULT', 'Content Moderation Result', 'Result from content moderation/safety checks', 'compliance', 'object', 'auto', 'medium', '1.0', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 11: SEED DATA - Test Proof Pack
-- ============================================
INSERT INTO public.proof_packs (id, enterprise_id, organization_id, label, description, priority, applies_when, severity, version) VALUES
  ('eu_public_ai_content_v1', NULL, NULL, 'EU Public AI Content Requirements', 'EU AI Act requirements for public-facing AI-generated content', 10, 
   '{"jurisdictions": ["EU"], "channels": ["public", "paid_social"], "assetTypes": ["image", "video", "text"], "aiUsed": true}'::jsonb,
   'regulatory', '1.0')
ON CONFLICT (id) DO NOTHING;

-- Link atoms to the test pack
INSERT INTO public.proof_pack_atoms (proof_pack_id, atom_id, required, constraints) VALUES
  ('eu_public_ai_content_v1', 'AI_ORIGIN_LABEL', TRUE, '{}'::jsonb),
  ('eu_public_ai_content_v1', 'C2PA_MANIFEST_HASH', TRUE, '{}'::jsonb),
  ('eu_public_ai_content_v1', 'HUMAN_REVIEW_EVENT', TRUE, '{}'::jsonb),
  ('eu_public_ai_content_v1', 'POLICY_SNAPSHOT_ID', TRUE, '{}'::jsonb),
  ('eu_public_ai_content_v1', 'JURISDICTION_TAGS', TRUE, '{"allowedValues": ["EU"]}'::jsonb),
  ('eu_public_ai_content_v1', 'TOOL_VERSION_LIST', FALSE, '{}'::jsonb)
ON CONFLICT (proof_pack_id, atom_id) DO NOTHING;

