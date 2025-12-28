-- Migration: 20251228000001_rls_hardening_pharma_production.sql
-- Purpose: Complete RLS hardening for pharma production readiness
-- Priority: P0 - Week 1 of 12-week pharma pilot timeline
-- 
-- This migration addresses:
-- - 5 tables with RLS disabled
-- - 3 tables with RLS enabled but NO policies
-- 
-- FDA 21 CFR Part 11 Compliance: Data isolation for multi-tenant pharma clients

BEGIN;

-- ============================================================
-- PART 1: Enable RLS on 5 disabled tables
-- ============================================================

ALTER TABLE public.framework_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_bundle_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_evidence_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_frameworks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 2: Create policies for regulatory framework tables
-- These are read-only reference tables - all authenticated users can read
-- ============================================================

-- regulatory_frameworks: Reference data, all authenticated users can read
CREATE POLICY "regulatory_frameworks_read_access"
ON public.regulatory_frameworks
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "regulatory_frameworks_service_role"
ON public.regulatory_frameworks
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- framework_requirements: Reference data, all authenticated users can read
CREATE POLICY "framework_requirements_read_access"
ON public.framework_requirements
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "framework_requirements_service_role"
ON public.framework_requirements
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- requirement_evidence_map: Reference data, all authenticated users can read
CREATE POLICY "requirement_evidence_map_read_access"
ON public.requirement_evidence_map
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "requirement_evidence_map_service_role"
ON public.requirement_evidence_map
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- PART 3: Enterprise-scoped policies for workspace and compliance tables
-- ============================================================

-- workspace_frameworks: Enterprise members can access their workspaces' frameworks
CREATE POLICY "workspace_frameworks_enterprise_access"
ON public.workspace_frameworks
FOR SELECT TO authenticated
USING (
  workspace_id IN (
    SELECT w.id FROM public.workspaces w
    JOIN public.enterprise_members em ON w.enterprise_id = em.enterprise_id
    WHERE em.user_id = auth.uid()
  )
);

CREATE POLICY "workspace_frameworks_insert"
ON public.workspace_frameworks
FOR INSERT TO authenticated
WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM public.workspaces w
    JOIN public.enterprise_members em ON w.enterprise_id = em.enterprise_id
    WHERE em.user_id = auth.uid()
      AND em.role IN ('owner', 'admin')
  )
);

CREATE POLICY "workspace_frameworks_update"
ON public.workspace_frameworks
FOR UPDATE TO authenticated
USING (
  workspace_id IN (
    SELECT w.id FROM public.workspaces w
    JOIN public.enterprise_members em ON w.enterprise_id = em.enterprise_id
    WHERE em.user_id = auth.uid()
      AND em.role IN ('owner', 'admin')
  )
);

CREATE POLICY "workspace_frameworks_delete"
ON public.workspace_frameworks
FOR DELETE TO authenticated
USING (
  workspace_id IN (
    SELECT w.id FROM public.workspaces w
    JOIN public.enterprise_members em ON w.enterprise_id = em.enterprise_id
    WHERE em.user_id = auth.uid()
      AND em.role IN ('owner', 'admin')
  )
);

CREATE POLICY "workspace_frameworks_service_role"
ON public.workspace_frameworks
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- proof_bundle_compliance: Access via proof_bundle ownership
CREATE POLICY "proof_bundle_compliance_enterprise_access"
ON public.proof_bundle_compliance
FOR SELECT TO authenticated
USING (
  proof_bundle_id IN (
    SELECT id FROM public.proof_bundles
    WHERE enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "proof_bundle_compliance_service_role"
ON public.proof_bundle_compliance
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- PART 4: Create policies for 3 tables with RLS enabled but NO policies
-- ============================================================

-- proof_bundle_artifacts: Critical for pharma - cryptographic verification
CREATE POLICY "proof_bundle_artifacts_enterprise_access"
ON public.proof_bundle_artifacts
FOR SELECT TO authenticated
USING (
  proof_bundle_id IN (
    SELECT id FROM public.proof_bundles
    WHERE enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "proof_bundle_artifacts_service_role"
ON public.proof_bundle_artifacts
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- organizations: Access via enterprise membership (organizations belong to enterprises)
CREATE POLICY "organizations_enterprise_access"
ON public.organizations
FOR SELECT TO authenticated
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "organizations_service_role"
ON public.organizations
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- subtenants: Enterprise-scoped access
CREATE POLICY "subtenants_enterprise_access"
ON public.subtenants
FOR SELECT TO authenticated
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "subtenants_insert"
ON public.subtenants
FOR INSERT TO authenticated
WITH CHECK (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "subtenants_update"
ON public.subtenants
FOR UPDATE TO authenticated
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "subtenants_delete"
ON public.subtenants
FOR DELETE TO authenticated
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members 
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "subtenants_service_role"
ON public.subtenants
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- PART 5: Validation comments for FDA compliance documentation
-- ============================================================

COMMENT ON POLICY "proof_bundle_artifacts_enterprise_access" ON public.proof_bundle_artifacts IS 
'FDA 21 CFR Part 11 requirement: Cryptographic artifacts accessible only to authorized enterprise members. Ensures proof bundle integrity verification is enterprise-scoped.';

COMMENT ON POLICY "proof_bundle_compliance_enterprise_access" ON public.proof_bundle_compliance IS 
'Regulatory compliance status accessible only to enterprise members who own the proof bundle. Supports multi-tenant isolation for pharma clients.';

COMMENT ON POLICY "regulatory_frameworks_read_access" ON public.regulatory_frameworks IS 
'Reference data for regulatory frameworks (FDA 21 CFR Part 11, EU AI Act, etc.) is readable by all authenticated users. No enterprise isolation required for reference data.';

COMMENT ON POLICY "workspace_frameworks_enterprise_access" ON public.workspace_frameworks IS 
'Enterprise members can view which regulatory frameworks are enabled for their workspaces. Critical for pharma compliance posture visibility.';

-- ============================================================
-- PART 6: Create helper functions for cross-boundary queries
-- ============================================================

-- Note: Helper functions is_enterprise_member, is_enterprise_admin, get_user_enterprise_ids
-- already exist in the database and are used by other RLS policies.
-- Do not recreate them to avoid breaking existing dependencies.

COMMIT;

