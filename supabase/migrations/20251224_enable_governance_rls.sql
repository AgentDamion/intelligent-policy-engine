-- =============================================================================
-- File: supabase/migrations/20251224_enable_governance_rls.sql
-- Purpose: Beta hardening - enable RLS on governance tables and enforce
--          enterprise isolation via enterprise membership.
--
-- Notes:
-- - This assumes `public.enterprise_members(user_id, enterprise_id)` exists.
-- - `public.governance_actions` does NOT have an `enterprise_id` column; access
--   must be scoped via `thread_id -> governance_threads.enterprise_id`.
-- - Uses `auth.role() = 'service_role'` for explicit service-role bypass.
-- - Idempotent via IF EXISTS + DROP POLICY IF EXISTS.
-- =============================================================================

DO $$
BEGIN
  -- ---------------------------------------------------------------------------
  -- Enable RLS on all governance tables (if they exist)
  -- ---------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'governance_threads'
  ) THEN
    ALTER TABLE public.governance_threads ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'governance_actions'
  ) THEN
    ALTER TABLE public.governance_actions ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'governance_audit_events'
  ) THEN
    ALTER TABLE public.governance_audit_events ENABLE ROW LEVEL SECURITY;
  END IF;

  -- ---------------------------------------------------------------------------
  -- Enterprise isolation policies (membership-based)
  -- ---------------------------------------------------------------------------

  -- governance_threads: scoped by enterprise_id on the row
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'governance_threads'
  ) THEN
    DROP POLICY IF EXISTS "enterprise_member_access" ON public.governance_threads;
    DROP POLICY IF EXISTS "governance_threads_enterprise_select" ON public.governance_threads;
    DROP POLICY IF EXISTS "governance_threads_enterprise_insert" ON public.governance_threads;
    DROP POLICY IF EXISTS "governance_threads_enterprise_update" ON public.governance_threads;

    CREATE POLICY "enterprise_member_access"
      ON public.governance_threads
      FOR ALL
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

    DROP POLICY IF EXISTS "service_role_full_access" ON public.governance_threads;
    DROP POLICY IF EXISTS "governance_threads_service_role" ON public.governance_threads;
    CREATE POLICY "service_role_full_access"
      ON public.governance_threads
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- governance_actions: scoped by thread_id -> governance_threads.enterprise_id
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'governance_actions'
  ) THEN
    DROP POLICY IF EXISTS "enterprise_member_access" ON public.governance_actions;
    DROP POLICY IF EXISTS "governance_actions_enterprise_select" ON public.governance_actions;
    DROP POLICY IF EXISTS "governance_actions_enterprise_insert" ON public.governance_actions;

    CREATE POLICY "enterprise_member_access"
      ON public.governance_actions
      FOR ALL
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
      )
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

    DROP POLICY IF EXISTS "service_role_full_access" ON public.governance_actions;
    DROP POLICY IF EXISTS "governance_actions_service_role" ON public.governance_actions;
    CREATE POLICY "service_role_full_access"
      ON public.governance_actions
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- governance_audit_events: scoped by enterprise_id on the row
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'governance_audit_events'
  ) THEN
    DROP POLICY IF EXISTS "enterprise_member_access" ON public.governance_audit_events;
    DROP POLICY IF EXISTS "governance_audit_events_enterprise_select" ON public.governance_audit_events;

    CREATE POLICY "enterprise_member_access"
      ON public.governance_audit_events
      FOR ALL
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

    DROP POLICY IF EXISTS "service_role_full_access" ON public.governance_audit_events;
    DROP POLICY IF EXISTS "governance_audit_events_service_role" ON public.governance_audit_events;
    CREATE POLICY "service_role_full_access"
      ON public.governance_audit_events
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

