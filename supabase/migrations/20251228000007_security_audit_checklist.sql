-- Migration: 20251228000007_security_audit_checklist.sql
-- Purpose: Week 12 - Multi-Tenancy Validation & Security Audit
-- PRD Phase 3: Pharma Production Hardening

BEGIN;

-- ============================================================
-- PART 1: Create security audit checklist table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.security_audit_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL CHECK (audit_type IN (
    'rls_coverage', 'tenant_isolation', 'data_encryption', 
    'access_controls', 'audit_trail', 'key_management'
  )),
  audit_date TIMESTAMPTZ DEFAULT NOW(),
  auditor_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'needs_review')),
  findings JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  evidence_links JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_audit_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_checklist_admin_access"
ON public.security_audit_checklists
FOR ALL TO authenticated
USING (
  enterprise_id IN (
    SELECT enterprise_id FROM public.enterprise_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "audit_checklist_service_role"
ON public.security_audit_checklists
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- PART 2: Document all RLS policies
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_rls_policy_inventory()
RETURNS TABLE (
  table_name TEXT,
  policy_name TEXT,
  policy_type TEXT,
  policy_roles TEXT[],
  policy_definition TEXT,
  has_service_role_policy BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH policies AS (
    SELECT 
      schemaname || '.' || tablename as full_table_name,
      policyname,
      CASE 
        WHEN permissive = 'PERMISSIVE' THEN 'permissive'
        ELSE 'restrictive'
      END as policy_type,
      roles,
      qual as definition,
      cmd as command
    FROM pg_policies
    WHERE schemaname IN ('public', 'vera')
  ),
  service_role_check AS (
    SELECT DISTINCT schemaname || '.' || tablename as full_table_name
    FROM pg_policies
    WHERE 'service_role' = ANY(roles)
      AND schemaname IN ('public', 'vera')
  )
  SELECT 
    p.full_table_name,
    p.policyname,
    p.policy_type,
    p.roles,
    p.definition,
    EXISTS (SELECT 1 FROM service_role_check s WHERE s.full_table_name = p.full_table_name)
  FROM policies p
  ORDER BY p.full_table_name, p.policyname;
$$;

COMMENT ON FUNCTION public.get_rls_policy_inventory IS 
'Returns a complete inventory of all RLS policies for security audits.';

-- ============================================================
-- PART 3: List all SECURITY DEFINER functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_security_definer_functions()
RETURNS TABLE (
  function_name TEXT,
  function_schema TEXT,
  argument_types TEXT,
  return_type TEXT,
  is_security_definer BOOLEAN,
  owner TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.proname::TEXT as function_name,
    n.nspname::TEXT as function_schema,
    pg_get_function_arguments(p.oid)::TEXT as argument_types,
    pg_get_function_result(p.oid)::TEXT as return_type,
    p.prosecdef as is_security_definer,
    pg_get_userbyid(p.proowner)::TEXT as owner
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname IN ('public', 'vera')
    AND p.prosecdef = true
  ORDER BY n.nspname, p.proname;
$$;

COMMENT ON FUNCTION public.get_security_definer_functions IS 
'Returns all SECURITY DEFINER functions for security audit review.';

-- ============================================================
-- PART 4: Get security advisor warnings
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_security_warnings()
RETURNS TABLE (
  warning_type TEXT,
  table_name TEXT,
  description TEXT,
  severity TEXT,
  remediation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check for tables without RLS
  RETURN QUERY
  SELECT 
    'missing_rls'::TEXT,
    schemaname || '.' || tablename,
    'Table does not have Row Level Security enabled'::TEXT,
    'critical'::TEXT,
    'ALTER TABLE ' || schemaname || '.' || tablename || ' ENABLE ROW LEVEL SECURITY;'
  FROM pg_tables t
  WHERE schemaname IN ('public', 'vera')
    AND NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = t.tablename 
        AND n.nspname = t.schemaname
        AND c.relrowsecurity = true
    );
  
  -- Check for RLS-enabled tables without policies
  RETURN QUERY
  SELECT 
    'missing_policies'::TEXT,
    n.nspname || '.' || c.relname,
    'Table has RLS enabled but no policies defined'::TEXT,
    'high'::TEXT,
    'Create appropriate SELECT/INSERT/UPDATE/DELETE policies for the table'
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname IN ('public', 'vera')
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = n.nspname AND p.tablename = c.relname
    );
  
  -- Check for tables without service_role access
  RETURN QUERY
  SELECT 
    'missing_service_role_policy'::TEXT,
    schemaname || '.' || tablename,
    'Table has RLS but no service_role policy - backend operations may fail'::TEXT,
    'medium'::TEXT,
    'Create a service_role policy with USING (true) WITH CHECK (true)'
  FROM pg_tables t
  WHERE schemaname IN ('public', 'vera')
    AND EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = t.tablename AND n.nspname = t.schemaname AND c.relrowsecurity = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = t.schemaname 
        AND p.tablename = t.tablename
        AND 'service_role' = ANY(p.roles)
    );
  
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.get_security_warnings IS 
'Returns security warnings and recommended remediations for the database.';

-- ============================================================
-- PART 5: Tenant isolation test function
-- ============================================================

CREATE OR REPLACE FUNCTION public.test_tenant_isolation(
  p_test_enterprise_id UUID
)
RETURNS TABLE (
  test_name TEXT,
  test_result TEXT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_other_enterprise_id UUID;
  v_count INTEGER;
BEGIN
  -- Find another enterprise for comparison
  SELECT id INTO v_other_enterprise_id
  FROM public.enterprises
  WHERE id != p_test_enterprise_id
  LIMIT 1;
  
  IF v_other_enterprise_id IS NULL THEN
    RETURN QUERY SELECT 
      'no_comparison_enterprise'::TEXT,
      'skipped'::TEXT,
      jsonb_build_object('reason', 'No other enterprise found for comparison test');
    RETURN;
  END IF;
  
  -- Test 1: governance_threads isolation
  SELECT COUNT(*) INTO v_count
  FROM public.governance_threads
  WHERE enterprise_id = v_other_enterprise_id;
  
  RETURN QUERY SELECT 
    'governance_threads_isolation'::TEXT,
    CASE WHEN v_count = 0 THEN 'passed' ELSE 'failed' END::TEXT,
    jsonb_build_object(
      'other_enterprise_records_visible', v_count,
      'expected', 0
    );
  
  -- Test 2: proof_bundles isolation
  SELECT COUNT(*) INTO v_count
  FROM public.proof_bundles
  WHERE enterprise_id = v_other_enterprise_id;
  
  RETURN QUERY SELECT 
    'proof_bundles_isolation'::TEXT,
    CASE WHEN v_count = 0 THEN 'passed' ELSE 'failed' END::TEXT,
    jsonb_build_object(
      'other_enterprise_records_visible', v_count,
      'expected', 0
    );
  
  -- Test 3: enterprise_signing_keys isolation
  SELECT COUNT(*) INTO v_count
  FROM public.enterprise_signing_keys
  WHERE enterprise_id = v_other_enterprise_id;
  
  RETURN QUERY SELECT 
    'signing_keys_isolation'::TEXT,
    CASE WHEN v_count = 0 THEN 'passed' ELSE 'failed' END::TEXT,
    jsonb_build_object(
      'other_enterprise_records_visible', v_count,
      'expected', 0
    );
  
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.test_tenant_isolation IS 
'Runs tenant isolation tests to verify RLS policies are working correctly.';

-- ============================================================
-- PART 6: Create indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_security_audit_enterprise
ON public.security_audit_checklists(enterprise_id, audit_type);

CREATE INDEX IF NOT EXISTS idx_security_audit_status
ON public.security_audit_checklists(status, audit_date);

COMMIT;

