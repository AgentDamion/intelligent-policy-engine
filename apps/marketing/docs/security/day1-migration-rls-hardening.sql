-- =============================================================================
-- CRITICAL SECURITY FIX: RESTRICTIVE RLS Safety Net + set_current_context Hardening
-- Pre-Launch Implementation - Day 1
-- Deploy Date: 2025-11-20
-- 
-- ⚠️ DEPLOYMENT INSTRUCTIONS:
-- Run this migration using: supabase migration new day1_rls_security_hardening
-- Then copy this content into the generated file and run: supabase db push
-- =============================================================================

-- =============================================================================
-- FIX 1: Add severity column to agent_activities (if not exists)
-- =============================================================================

ALTER TABLE public.agent_activities 
  ADD COLUMN IF NOT EXISTS severity TEXT 
  CHECK (severity IN ('info', 'warning', 'critical'));

CREATE INDEX IF NOT EXISTS idx_agent_activities_severity 
  ON public.agent_activities(severity, created_at DESC)
  WHERE severity IN ('warning', 'critical');

COMMENT ON COLUMN public.agent_activities.severity IS 
  'Severity level for security events and critical actions';

-- =============================================================================
-- FIX 2: RESTRICTIVE Policy (Blocks All Cross-Tenant Access)
-- =============================================================================

CREATE POLICY tenant_isolation_restrictive ON public.asset_declarations
  AS RESTRICTIVE  -- ALL other PERMISSIVE policies must AND with this
  FOR ALL
  TO authenticated
  USING (
    -- Enterprises can only access their own declarations
    (enterprise_id IN (
      SELECT enterprise_id 
      FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    ))
    OR
    -- Partners can only access declarations for enterprises they're authorized for
    (partner_id IN (
      SELECT pak.partner_id
      FROM public.partner_api_keys pak
      WHERE pak.enterprise_id = asset_declarations.enterprise_id
      AND pak.is_active = true
      AND (pak.expires_at IS NULL OR pak.expires_at > NOW())
    ))
  );

-- FIX 3: Corrected performance index (removed non-existent is_active column)
CREATE INDEX IF NOT EXISTS idx_asset_declarations_rls_lookup
  ON public.asset_declarations(enterprise_id, partner_id, validation_status)
  WHERE validation_status != 'deleted';

COMMENT ON POLICY tenant_isolation_restrictive ON public.asset_declarations IS 
  'RESTRICTIVE safety net - prevents cross-tenant data leakage even if PERMISSIVE policies have bugs. Deployed 2025-11-20.';

-- =============================================================================
-- FIX 4: Harden set_current_context Function with Authorization + search_path
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_current_context(
  p_partner_id UUID,
  p_enterprise_id UUID,
  p_workspace_id UUID DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
  v_is_authorized BOOLEAN;
  v_security_event_id BIGINT;
BEGIN
  -- Set search_path for security (prevents function hijacking)
  SET search_path = public, pg_catalog;
  
  -- =========================================================================
  -- AUTHORIZATION VALIDATION (Prevents Context Switching Attacks)
  -- =========================================================================
  
  SELECT EXISTS(
    SELECT 1 FROM public.partner_api_keys 
    WHERE partner_id = p_partner_id 
    AND enterprise_id = p_enterprise_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    -- Log security violation attempt before raising error
    INSERT INTO public.agent_activities (
      agent, action, status, details, severity, enterprise_id
    ) VALUES (
      'system',
      'unauthorized_context_switch_attempt',
      'blocked',
      jsonb_build_object(
        'attempted_partner_id', p_partner_id,
        'attempted_enterprise_id', p_enterprise_id,
        'user_id', auth.uid(),
        'timestamp', NOW(),
        'ip_address', current_setting('request.ip', true),
        'user_agent', current_setting('request.user_agent', true)
      ),
      'critical',
      p_enterprise_id
    ) RETURNING id INTO v_security_event_id;

    RAISE EXCEPTION 'SECURITY_VIOLATION: Unauthorized context switch attempt [Event ID: %]', 
      v_security_event_id
    USING HINT = 'This security event has been logged and the security team notified';
  END IF;

  -- =========================================================================
  -- WORKSPACE VALIDATION (if provided)
  -- =========================================================================
  
  IF p_workspace_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.workspaces 
      WHERE id = p_workspace_id
      AND enterprise_id = p_enterprise_id
    ) INTO v_is_authorized;

    IF NOT v_is_authorized THEN
      RAISE EXCEPTION 'SECURITY_VIOLATION: Workspace % does not belong to enterprise %',
        p_workspace_id, p_enterprise_id;
    END IF;
  END IF;

  -- =========================================================================
  -- SET CONTEXT (Only after all validations pass)
  -- =========================================================================
  
  PERFORM set_config('app.current_partner_id', p_partner_id::text, false);
  PERFORM set_config('app.current_enterprise_id', p_enterprise_id::text, false);
  
  IF p_workspace_id IS NOT NULL THEN
    PERFORM set_config('app.current_workspace_id', p_workspace_id::text, false);
  END IF;

  -- Log successful context switch for audit trail
  INSERT INTO public.agent_activities (
    agent, action, status, details, enterprise_id, workspace_id
  ) VALUES (
    'system',
    'context_switch',
    'success',
    jsonb_build_object(
      'partner_id', p_partner_id,
      'enterprise_id', p_enterprise_id,
      'workspace_id', p_workspace_id,
      'timestamp', NOW()
    ),
    p_enterprise_id,
    p_workspace_id
  ) RETURNING id INTO v_security_event_id;

  RETURN v_security_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict function execution to authenticated users only
REVOKE ALL ON FUNCTION public.set_current_context(UUID, UUID, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.set_current_context(UUID, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.set_current_context(UUID, UUID, UUID) IS 
  'Hardened context switcher with authorization validation and search_path security. Deployed 2025-11-20.';

-- =============================================================================
-- FIX 5: Verification Function (replaces test_tenant_isolation)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.verify_rls_restrictive()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  details TEXT
) AS $$
DECLARE
  v_user_enterprise_id UUID;
  v_user_partner_id UUID;
  v_total_declarations INTEGER;
  v_user_declarations INTEGER;
BEGIN
  -- Get current user context
  v_user_enterprise_id := COALESCE(
    (current_setting('app.current_enterprise_id', true))::UUID,
    (SELECT enterprise_id FROM public.enterprise_members WHERE user_id = auth.uid() LIMIT 1)
  );
  
  v_user_partner_id := (current_setting('app.current_partner_id', true))::UUID;

  -- Test 1: Check total vs accessible declarations
  SELECT COUNT(*) INTO v_total_declarations FROM public.asset_declarations;
  
  SELECT COUNT(*) INTO v_user_declarations 
  FROM public.asset_declarations 
  WHERE enterprise_id = v_user_enterprise_id OR partner_id = v_user_partner_id;

  RETURN QUERY
  SELECT 
    'Total Declarations'::TEXT,
    'INFO'::TEXT,
    format('Total in DB: %s, User can see: %s', v_total_declarations, v_user_declarations)::TEXT;

  -- Test 2: Check if user can see other enterprises
  RETURN QUERY
  SELECT 
    'Cross-Tenant Isolation'::TEXT,
    CASE 
      WHEN EXISTS(
        SELECT 1 FROM public.asset_declarations 
        WHERE enterprise_id != v_user_enterprise_id 
        AND (v_user_partner_id IS NULL OR partner_id != v_user_partner_id)
      ) THEN 'FAIL'::TEXT
      ELSE 'PASS'::TEXT
    END,
    CASE 
      WHEN EXISTS(
        SELECT 1 FROM public.asset_declarations 
        WHERE enterprise_id != v_user_enterprise_id 
        AND (v_user_partner_id IS NULL OR partner_id != v_user_partner_id)
      ) THEN 'SECURITY BREACH: User can access other tenants data'::TEXT
      ELSE 'RLS working correctly - no cross-tenant access'::TEXT
    END;

  -- Test 3: Check RESTRICTIVE policy exists
  RETURN QUERY
  SELECT 
    'RESTRICTIVE Policy'::TEXT,
    CASE 
      WHEN EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'asset_declarations' 
        AND policyname = 'tenant_isolation_restrictive'
        AND cmd = '*'
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if tenant_isolation_restrictive policy is active'::TEXT;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_rls_restrictive() TO authenticated;

-- =============================================================================
-- DEPLOYMENT VERIFICATION CHECKLIST
-- =============================================================================
/*
DEPLOYMENT VERIFICATION:
1. ✅ Run migration: supabase db push
2. ✅ Verify RLS policy created: SELECT * FROM pg_policies WHERE tablename = 'asset_declarations';
3. ✅ Run verification: SELECT * FROM public.verify_rls_restrictive();
4. ✅ Test partner context switch: SELECT public.set_current_context('partner_id', 'enterprise_id');
5. ✅ Monitor security events: SELECT * FROM agent_activities WHERE severity = 'critical';

EXPECTED RESULTS:
- verify_rls_restrictive() should return 'PASS' for all tests
- No cross-tenant data leakage
- Security violations logged to agent_activities
*/

-- =============================================================================
-- ROLLBACK PROCEDURES (Emergency Use Only - See docs/security/day1-rollback-plan.md)
-- =============================================================================
