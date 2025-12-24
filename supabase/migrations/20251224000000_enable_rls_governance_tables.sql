-- =============================================================================
-- MIGRATION: 20251224000000_enable_rls_governance_tables
-- PURPOSE: Re-enable RLS and enforce enterprise isolation for governance tables
-- NOTES:
--  - Prior migrations explicitly DISABLED RLS on governance tables for dev.
--  - This migration is intended for beta/production hardening.
--  - Policies assume `public.enterprise_members(user_id, enterprise_id)` exists.
-- =============================================================================

DO $$
BEGIN
  -- ---------------------------------------------------------------------------
  -- governance_threads
  -- ---------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'governance_threads'
  ) THEN
    ALTER TABLE public.governance_threads ENABLE ROW LEVEL SECURITY;

    -- Membership-scoped access
    DROP POLICY IF EXISTS "governance_threads_enterprise_select" ON public.governance_threads;
    CREATE POLICY "governance_threads_enterprise_select"
      ON public.governance_threads
      FOR SELECT TO authenticated
      USING (
        enterprise_id IN (
          SELECT enterprise_id
          FROM public.enterprise_members
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "governance_threads_enterprise_insert" ON public.governance_threads;
    CREATE POLICY "governance_threads_enterprise_insert"
      ON public.governance_threads
      FOR INSERT TO authenticated
      WITH CHECK (
        enterprise_id IN (
          SELECT enterprise_id
          FROM public.enterprise_members
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "governance_threads_enterprise_update" ON public.governance_threads;
    CREATE POLICY "governance_threads_enterprise_update"
      ON public.governance_threads
      FOR UPDATE TO authenticated
      USING (
        enterprise_id IN (
          SELECT enterprise_id
          FROM public.enterprise_members
          WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        enterprise_id IN (
          SELECT enterprise_id
          FROM public.enterprise_members
          WHERE user_id = auth.uid()
        )
      );

    -- Service role full access
    DROP POLICY IF EXISTS "governance_threads_service_role" ON public.governance_threads;
    CREATE POLICY "governance_threads_service_role"
      ON public.governance_threads
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;

  -- ---------------------------------------------------------------------------
  -- governance_actions
  -- ---------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'governance_actions'
  ) THEN
    ALTER TABLE public.governance_actions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "governance_actions_enterprise_select" ON public.governance_actions;
    CREATE POLICY "governance_actions_enterprise_select"
      ON public.governance_actions
      FOR SELECT TO authenticated
      USING (
        thread_id IN (
          SELECT gt.id
          FROM public.governance_threads gt
          WHERE gt.enterprise_id IN (
            SELECT enterprise_id
            FROM public.enterprise_members
            WHERE user_id = auth.uid()
          )
        )
      );

    DROP POLICY IF EXISTS "governance_actions_enterprise_insert" ON public.governance_actions;
    CREATE POLICY "governance_actions_enterprise_insert"
      ON public.governance_actions
      FOR INSERT TO authenticated
      WITH CHECK (
        thread_id IN (
          SELECT gt.id
          FROM public.governance_threads gt
          WHERE gt.enterprise_id IN (
            SELECT enterprise_id
            FROM public.enterprise_members
            WHERE user_id = auth.uid()
          )
        )
      );

    -- Service role full access (covers automation + backfills)
    DROP POLICY IF EXISTS "governance_actions_service_role" ON public.governance_actions;
    CREATE POLICY "governance_actions_service_role"
      ON public.governance_actions
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;

  -- ---------------------------------------------------------------------------
  -- governance_audit_events
  -- ---------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'governance_audit_events'
  ) THEN
    ALTER TABLE public.governance_audit_events ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "governance_audit_events_enterprise_select" ON public.governance_audit_events;
    CREATE POLICY "governance_audit_events_enterprise_select"
      ON public.governance_audit_events
      FOR SELECT TO authenticated
      USING (
        enterprise_id IN (
          SELECT enterprise_id
          FROM public.enterprise_members
          WHERE user_id = auth.uid()
        )
      );

    -- Inserts are typically performed by SECURITY DEFINER functions / triggers.
    -- Allow service_role inserts explicitly.
    DROP POLICY IF EXISTS "governance_audit_events_service_role" ON public.governance_audit_events;
    CREATE POLICY "governance_audit_events_service_role"
      ON public.governance_audit_events
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON SCHEMA public IS 'Governance tables hardened: RLS enabled for beta/production isolation.';

