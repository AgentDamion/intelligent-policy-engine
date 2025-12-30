-- ============================================================
-- GOVERNANCE_ACTIONS & GOVERNANCE_AUDIT_EVENTS RLS HARDENING
-- NIST SP 800-53 / OWASP Top 10 Compliant
-- 
-- Security Controls:
-- - NIST AC-3: Access Enforcement - Enterprise Isolation
-- - NIST AU-9: Audit Protection - Immutable audit trail
-- - OWASP A01:2021: Broken Access Control Prevention
-- ============================================================

BEGIN;

-- ============================================================
-- GOVERNANCE_ACTIONS TABLE
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "enterprise_member_access" ON public.governance_actions;
DROP POLICY IF EXISTS "service_role_full_access" ON public.governance_actions;
DROP POLICY IF EXISTS "governance_actions_enterprise_access" ON public.governance_actions;
DROP POLICY IF EXISTS "governance_actions_service_role" ON public.governance_actions;

-- Ensure RLS is enabled and forced
ALTER TABLE public.governance_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_actions FORCE ROW LEVEL SECURITY;

-- ============================================================
-- POLICY 1: Enterprise Member SELECT Access
-- Via thread membership - enterprise isolation
-- ============================================================

CREATE POLICY "ga_enterprise_member_select"
ON public.governance_actions
FOR SELECT
TO authenticated
USING (
  thread_id IN (
    SELECT gt.id 
    FROM public.governance_threads gt
    JOIN public.enterprise_members em ON gt.enterprise_id = em.enterprise_id
    WHERE em.user_id = auth.uid()
  )
);

COMMENT ON POLICY "ga_enterprise_member_select" ON public.governance_actions IS
'NIST AC-3: Enterprise members can only view actions on threads within their enterprise.';

-- ============================================================
-- POLICY 2: Enterprise Member INSERT Access
-- Actions can only be added to threads in own enterprise
-- Timestamp validation prevents backdating
-- ============================================================

CREATE POLICY "ga_enterprise_member_insert"
ON public.governance_actions
FOR INSERT
TO authenticated
WITH CHECK (
  thread_id IN (
    SELECT gt.id 
    FROM public.governance_threads gt
    JOIN public.enterprise_members em ON gt.enterprise_id = em.enterprise_id
    WHERE em.user_id = auth.uid()
  )
  -- Prevent backdating
  AND (created_at IS NULL OR created_at >= NOW() - INTERVAL '1 minute')
);

COMMENT ON POLICY "ga_enterprise_member_insert" ON public.governance_actions IS
'NIST AC-3, AU-9: Actions can only be added to threads in own enterprise with current timestamps.';

-- ============================================================
-- NO UPDATE POLICY - Actions are immutable
-- NIST AU-9: Audit trail immutability
-- ============================================================

-- No UPDATE policy - governance actions are append-only

-- ============================================================
-- NO DELETE POLICY - Actions are permanent
-- NIST AU-9: Audit trail cannot be deleted
-- ============================================================

-- No DELETE policy - governance actions cannot be deleted

-- ============================================================
-- Service Role Full Access for backend operations
-- ============================================================

CREATE POLICY "ga_service_role_all"
ON public.governance_actions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON POLICY "ga_service_role_all" ON public.governance_actions IS
'Service role bypass for backend operations. All operations logged via audit events.';

-- ============================================================
-- INDEX OPTIMIZATION
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ga_thread_created
ON public.governance_actions(thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ga_actor
ON public.governance_actions(actor_id, actor_type);

-- ============================================================
-- GOVERNANCE_AUDIT_EVENTS TABLE
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "enterprise_member_access" ON public.governance_audit_events;
DROP POLICY IF EXISTS "service_role_full_access" ON public.governance_audit_events;
DROP POLICY IF EXISTS "governance_audit_events_enterprise_access" ON public.governance_audit_events;
DROP POLICY IF EXISTS "governance_audit_events_service_role" ON public.governance_audit_events;

-- Ensure RLS is enabled and forced
ALTER TABLE public.governance_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_audit_events FORCE ROW LEVEL SECURITY;

-- ============================================================
-- POLICY 1: Enterprise Member SELECT Access (Read-Only)
-- Audit events are read-only for enterprise members
-- ============================================================

CREATE POLICY "gae_enterprise_member_select"
ON public.governance_audit_events
FOR SELECT
TO authenticated
USING (
  enterprise_id IN (
    SELECT em.enterprise_id 
    FROM public.enterprise_members em
    WHERE em.user_id = auth.uid()
  )
);

COMMENT ON POLICY "gae_enterprise_member_select" ON public.governance_audit_events IS
'NIST AC-3: Enterprise members can only view audit events for their enterprise.';

-- ============================================================
-- NO INSERT for authenticated users
-- Only service_role can write audit events
-- NIST AU-9: Audit trail integrity - prevents tampering
-- ============================================================

-- No INSERT policy for authenticated users

-- ============================================================
-- NO UPDATE - Audit events are immutable
-- ============================================================

-- No UPDATE policy

-- ============================================================
-- NO DELETE - Audit events are permanent
-- ============================================================

-- No DELETE policy

-- ============================================================
-- Service Role Full Access for backend operations
-- ============================================================

CREATE POLICY "gae_service_role_all"
ON public.governance_audit_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON POLICY "gae_service_role_all" ON public.governance_audit_events IS
'Service role bypass for backend audit logging.';

-- ============================================================
-- INDEX OPTIMIZATION
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_gae_enterprise_occurred
ON public.governance_audit_events(enterprise_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_gae_action_type
ON public.governance_audit_events(action_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_gae_actor
ON public.governance_audit_events(actor_id, actor_type);

COMMIT;

