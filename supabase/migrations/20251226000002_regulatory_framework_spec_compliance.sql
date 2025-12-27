-- =============================================================================
-- MIGRATION: Regulatory Framework Spec Compliance
-- PURPOSE: Create spec-compliant tables for workspace frameworks, evidence mapping,
--          policy framework mapping, proof bundle compliance, and partner identity
-- =============================================================================

-- Ensure regulatory_frameworks and framework_requirements exist (from migration 014)
-- This migration extends the existing structure

-- =============================================================================
-- WORKSPACE FRAMEWORKS
-- Links workspaces to applicable regulatory frameworks
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.workspace_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  framework_id UUID NOT NULL REFERENCES public.regulatory_frameworks(id) ON DELETE CASCADE,
  
  -- Configuration
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,                  -- For conflict resolution (higher = more priority)
  
  -- Customization
  configuration JSONB DEFAULT '{}'::jsonb,     -- Workspace-specific overrides
  excluded_requirements UUID[],                -- Requirements not applicable to this workspace
  custom_evidence_mappings JSONB,              -- Additional evidence sources
  
  -- Status
  compliance_target_date DATE,                 -- When workspace aims to be compliant
  last_assessment_date TIMESTAMPTZ,
  current_coverage_score NUMERIC(5,2),         -- 0.00 to 100.00
  
  -- Metadata
  enabled_by UUID REFERENCES auth.users(id),
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(workspace_id, framework_id)
);

-- Add foreign key constraint for workspace_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'workspace_frameworks_workspace_id_fkey'
    AND table_name = 'workspace_frameworks'
  ) THEN
    ALTER TABLE public.workspace_frameworks
      ADD CONSTRAINT workspace_frameworks_workspace_id_fkey
      FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_frameworks_workspace 
  ON public.workspace_frameworks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_frameworks_enabled 
  ON public.workspace_frameworks(workspace_id) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_workspace_frameworks_framework 
  ON public.workspace_frameworks(framework_id);

-- =============================================================================
-- REQUIREMENT EVIDENCE MAP
-- Maps framework requirements to AICOMPLYR evidence sources
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.requirement_evidence_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.framework_requirements(id) ON DELETE CASCADE,
  
  -- Evidence Source
  evidence_type TEXT NOT NULL,                 -- "audit_trail", "policy_config", "attestation", "document", "metadata"
  evidence_source TEXT NOT NULL,               -- Table or system name: "vera.events", "governance_actions", "proof_bundles"
  evidence_field TEXT,                         -- Specific field: "action_type", "decision_rationale"
  evidence_filter JSONB,                       -- Query filter: {"event_type": "human_review"}
  
  -- Validation
  validation_rule TEXT,                        -- "exists", "count_gte", "value_matches", "date_within"
  validation_params JSONB,                     -- {"min_count": 1, "value": "approved"}
  
  -- Coverage
  coverage_contribution NUMERIC(3,2),          -- 0.00 to 1.00 - how much this evidence contributes
  is_required BOOLEAN DEFAULT false,
  
  -- Partner-specific fields
  partner_id UUID,                             -- Optional: partner-specific evidence mapping
  attestation_status TEXT,                     -- "pending", "submitted", "verified"
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_evidence_type CHECK (evidence_type IN ('audit_trail', 'policy_config', 'attestation', 'document', 'metadata', 'workflow'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evidence_map_requirement 
  ON public.requirement_evidence_map(requirement_id);
CREATE INDEX IF NOT EXISTS idx_evidence_map_source 
  ON public.requirement_evidence_map(evidence_source);
CREATE INDEX IF NOT EXISTS idx_evidence_map_partner 
  ON public.requirement_evidence_map(partner_id) WHERE partner_id IS NOT NULL;

-- =============================================================================
-- POLICY FRAMEWORK MAP
-- Links policies to the frameworks and requirements they address
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.policy_framework_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL,
  framework_id UUID NOT NULL REFERENCES public.regulatory_frameworks(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES public.framework_requirements(id) ON DELETE CASCADE,
  
  -- Coverage Assessment
  coverage_type TEXT NOT NULL,                 -- "full", "partial", "indirect", "none"
  coverage_percentage NUMERIC(5,2),            -- 0.00 to 100.00
  coverage_notes TEXT,
  
  -- Detection
  auto_detected BOOLEAN DEFAULT false,         -- Was this mapping auto-generated?
  detection_confidence NUMERIC(3,2),           -- 0.00 to 1.00
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(policy_id, framework_id, requirement_id),
  CONSTRAINT valid_coverage_type CHECK (coverage_type IN ('full', 'partial', 'indirect', 'none'))
);

-- Add foreign key constraint for policy_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'policy_framework_map_policy_id_fkey'
    AND table_name = 'policy_framework_map'
  ) THEN
    -- Try to reference policies table (may have different structure)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policies') THEN
      ALTER TABLE public.policy_framework_map
        ADD CONSTRAINT policy_framework_map_policy_id_fkey
        FOREIGN KEY (policy_id) REFERENCES public.policies(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_policy_framework_policy 
  ON public.policy_framework_map(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_framework_framework 
  ON public.policy_framework_map(framework_id);
CREATE INDEX IF NOT EXISTS idx_policy_framework_requirement 
  ON public.policy_framework_map(requirement_id);

-- =============================================================================
-- PROOF BUNDLE COMPLIANCE
-- Stores compliance assessment results for each Proof Bundle
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.proof_bundle_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_bundle_id UUID NOT NULL,
  framework_id UUID NOT NULL REFERENCES public.regulatory_frameworks(id),
  
  -- Overall Assessment
  compliance_status TEXT NOT NULL,             -- "compliant", "partial", "non_compliant", "not_applicable"
  overall_coverage_percentage NUMERIC(5,2),    -- 0.00 to 100.00
  
  -- Detailed Results
  requirement_results JSONB NOT NULL,          -- See schema in spec
  evidence_collected JSONB NOT NULL,           -- References to actual evidence
  
  -- Gaps
  gaps JSONB,                                  -- See schema in spec
  recommendations TEXT[],
  
  -- Metadata
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  assessed_by TEXT,                            -- "system" or user_id
  assessment_version TEXT,                     -- Version of assessment logic
  
  -- Constraints
  UNIQUE(proof_bundle_id, framework_id),
  CONSTRAINT valid_compliance_status CHECK (compliance_status IN ('compliant', 'partial', 'non_compliant', 'not_applicable', 'pending'))
);

-- Add foreign key constraint for proof_bundle_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'proof_bundle_compliance_proof_bundle_id_fkey'
    AND table_name = 'proof_bundle_compliance'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proof_bundles') THEN
      ALTER TABLE public.proof_bundle_compliance
        ADD CONSTRAINT proof_bundle_compliance_proof_bundle_id_fkey
        FOREIGN KEY (proof_bundle_id) REFERENCES public.proof_bundles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bundle_compliance_bundle 
  ON public.proof_bundle_compliance(proof_bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_compliance_framework 
  ON public.proof_bundle_compliance(framework_id);
CREATE INDEX IF NOT EXISTS idx_bundle_compliance_status 
  ON public.proof_bundle_compliance(compliance_status);
CREATE INDEX IF NOT EXISTS idx_bundle_compliance_bundle_hash 
  ON public.proof_bundle_compliance(proof_bundle_id, framework_id);

-- =============================================================================
-- PARTNER IDENTITY TABLES
-- Support partner authentication and attestations
-- =============================================================================

-- Partner API Keys
CREATE TABLE IF NOT EXISTS public.partner_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,                    -- References enterprise or organization
  key_name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,                  -- Hashed API key (never store plaintext)
  scopes TEXT[],                               -- Permissions: ["read", "write", "attest"]
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(api_key_hash)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_api_keys_partner 
  ON public.partner_api_keys(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_api_keys_active 
  ON public.partner_api_keys(partner_id) WHERE is_active = true;

-- Partner Attestations
CREATE TABLE IF NOT EXISTS public.partner_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  requirement_id UUID REFERENCES public.framework_requirements(id),
  proof_bundle_id UUID,
  
  -- Attestation Data
  attestation_data JSONB NOT NULL,             -- Encrypted at rest
  attestation_type TEXT NOT NULL,              -- "tool_usage", "compliance", "disclosure"
  status TEXT NOT NULL DEFAULT 'pending',      -- "pending", "submitted", "verified", "rejected"
  
  -- Verification
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_attestation_status CHECK (status IN ('pending', 'submitted', 'verified', 'rejected'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_attestations_partner 
  ON public.partner_attestations(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_attestations_requirement 
  ON public.partner_attestations(requirement_id);
CREATE INDEX IF NOT EXISTS idx_partner_attestations_proof_bundle 
  ON public.partner_attestations(proof_bundle_id);
CREATE INDEX IF NOT EXISTS idx_partner_attestations_status 
  ON public.partner_attestations(status);

-- =============================================================================
-- GOVERNANCE AUDIT EVENTS
-- Log enforcement actions and policy violations
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.governance_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  enterprise_id UUID,
  partner_id UUID,
  
  -- Event Details
  event_type TEXT NOT NULL,                    -- "policy_violation", "enforcement_action", "tool_blocked"
  event_category TEXT NOT NULL,                -- "compliance", "security", "governance"
  severity TEXT NOT NULL,                      -- "low", "medium", "high", "critical"
  
  -- Context
  policy_id UUID,
  framework_id UUID REFERENCES public.regulatory_frameworks(id),
  requirement_id UUID REFERENCES public.framework_requirements(id),
  proof_bundle_id UUID,
  
  -- Details
  event_data JSONB NOT NULL,                   -- Full event details
  action_taken TEXT,                           -- "blocked", "allowed", "flagged", "escalated"
  user_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Indexes (consider partitioning by date for large tables)
CREATE INDEX IF NOT EXISTS idx_governance_audit_events_workspace 
  ON public.governance_audit_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_governance_audit_events_enterprise 
  ON public.governance_audit_events(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_governance_audit_events_occurred_at 
  ON public.governance_audit_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_governance_audit_events_severity 
  ON public.governance_audit_events(severity);
CREATE INDEX IF NOT EXISTS idx_governance_audit_events_framework 
  ON public.governance_audit_events(framework_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Workspace Frameworks
ALTER TABLE public.workspace_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_frameworks_access" ON public.workspace_frameworks
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Requirement Evidence Map (public read, admin write)
ALTER TABLE public.requirement_evidence_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_map_public_read" ON public.requirement_evidence_map
  FOR SELECT USING (true);

CREATE POLICY "evidence_map_admin_write" ON public.requirement_evidence_map
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Policy Framework Map
ALTER TABLE public.policy_framework_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_framework_map_access" ON public.policy_framework_map
  FOR ALL USING (
    policy_id IN (
      SELECT id FROM public.policies
      WHERE enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Proof Bundle Compliance
ALTER TABLE public.proof_bundle_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proof_bundle_compliance_access" ON public.proof_bundle_compliance
  FOR ALL USING (
    proof_bundle_id IN (
      SELECT id FROM public.proof_bundles
      WHERE enterprise_id IN (
        SELECT enterprise_id FROM public.enterprise_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Partner API Keys
ALTER TABLE public.partner_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_api_keys_access" ON public.partner_api_keys
  FOR ALL USING (
    partner_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

-- Partner Attestations
ALTER TABLE public.partner_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_attestations_access" ON public.partner_attestations
  FOR ALL USING (
    partner_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

-- Governance Audit Events
ALTER TABLE public.governance_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "governance_audit_events_access" ON public.governance_audit_events
  FOR SELECT USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

-- Service role has full access to all tables
CREATE POLICY "service_role_full_access_workspace_frameworks" ON public.workspace_frameworks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_requirement_evidence_map" ON public.requirement_evidence_map
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_policy_framework_map" ON public.policy_framework_map
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_proof_bundle_compliance" ON public.proof_bundle_compliance
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_partner_api_keys" ON public.partner_api_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_partner_attestations" ON public.partner_attestations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_governance_audit_events" ON public.governance_audit_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Create or replace update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_workspace_frameworks_updated_at 
  BEFORE UPDATE ON public.workspace_frameworks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requirement_evidence_map_updated_at 
  BEFORE UPDATE ON public.requirement_evidence_map 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_framework_map_updated_at 
  BEFORE UPDATE ON public.policy_framework_map 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_api_keys_updated_at 
  BEFORE UPDATE ON public.partner_api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_attestations_updated_at 
  BEFORE UPDATE ON public.partner_attestations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.workspace_frameworks IS 
'Links workspaces to applicable regulatory frameworks with configuration and compliance tracking';

COMMENT ON TABLE public.requirement_evidence_map IS 
'Maps framework requirements to AICOMPLYR evidence sources for automated compliance assessment';

COMMENT ON TABLE public.policy_framework_map IS 
'Links policies to regulatory frameworks and requirements they address';

COMMENT ON TABLE public.proof_bundle_compliance IS 
'Stores compliance assessment results for each proof bundle per framework';

COMMENT ON TABLE public.partner_api_keys IS 
'API keys for partner authentication and access control';

COMMENT ON TABLE public.partner_attestations IS 
'Partner-submitted attestations for regulatory compliance evidence';

COMMENT ON TABLE public.governance_audit_events IS 
'Immutable audit log of governance actions, policy violations, and enforcement events';

