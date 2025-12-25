-- ============================================
-- MEMBERSHIP TABLE DIAGNOSTIC
-- Run in Supabase SQL Editor
-- ============================================

-- 1) What membership-related tables exist?
SELECT '=== MEMBERSHIP TABLES ===' as section;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
  table_name LIKE '%member%'
  OR table_name LIKE '%user_context%'
  OR table_name LIKE '%partner_client%'
  OR table_name LIKE '%partner_enterprise%'
)
ORDER BY table_name;

-- 2) enterprise_members structure (if exists)
SELECT '=== ENTERPRISE_MEMBERS STRUCTURE ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'enterprise_members'
ORDER BY ordinal_position;

-- 3) user_contexts structure (if exists - Node schema)
SELECT '=== USER_CONTEXTS STRUCTURE ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_contexts'
ORDER BY ordinal_position;

-- 4) partner_client_contexts structure (if exists - Node schema)
SELECT '=== PARTNER_CLIENT_CONTEXTS STRUCTURE ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'partner_client_contexts'
ORDER BY ordinal_position;

-- 5) Check for existing RLS policies on these tables
SELECT '=== EXISTING RLS POLICIES ===' as section;
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN (
  'enterprise_members',
  'workspace_members',
  'user_contexts',
  'partner_client_contexts'
)
ORDER BY tablename, policyname;

-- 6) Quick data check - are there any rows?
-- Safe version: does not error if tables don't exist.
SELECT '=== ROW COUNTS (SAFE) ===' as section;
DO $$
DECLARE
  v_count bigint;
BEGIN
  IF to_regclass('public.enterprise_members') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.enterprise_members' INTO v_count;
    RAISE NOTICE 'enterprise_members: %', v_count;
  ELSE
    RAISE NOTICE 'enterprise_members: <missing>';
  END IF;

  IF to_regclass('public.user_contexts') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.user_contexts' INTO v_count;
    RAISE NOTICE 'user_contexts: %', v_count;
  ELSE
    RAISE NOTICE 'user_contexts: <missing>';
  END IF;

  IF to_regclass('public.partner_client_contexts') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.partner_client_contexts' INTO v_count;
    RAISE NOTICE 'partner_client_contexts: %', v_count;
  ELSE
    RAISE NOTICE 'partner_client_contexts: <missing>';
  END IF;
END $$;

