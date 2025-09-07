-- Fix RLS Configuration Issues
-- Run this script in your Supabase SQL editor to fix the security issues

-- =====================================================
-- 1. Enable RLS on tables that have policies but RLS disabled
-- =====================================================

-- Enable RLS on agent_activities table
ALTER TABLE public.agent_activities ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ai_agent_decisions table  
ALTER TABLE public.ai_agent_decisions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. Add missing policies for invitation_keys table
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.invitation_keys;
DROP POLICY IF EXISTS "Users can create invitations" ON public.invitation_keys;
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.invitation_keys;

-- Create comprehensive policies for invitation_keys
CREATE POLICY "Users can view their own invitations" ON public.invitation_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create invitations" ON public.invitation_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invitations" ON public.invitation_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 3. Add missing policies for agent_activities table
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own agent activities" ON public.agent_activities;
DROP POLICY IF EXISTS "Users can create agent activities" ON public.agent_activities;
DROP POLICY IF EXISTS "Users can update their own agent activities" ON public.agent_activities;

-- Create policies for agent_activities
CREATE POLICY "Users can view their own agent activities" ON public.agent_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create agent activities" ON public.agent_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent activities" ON public.agent_activities
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. Add missing policies for ai_agent_decisions table
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own agent decisions" ON public.ai_agent_decisions;
DROP POLICY IF EXISTS "Users can create agent decisions" ON public.ai_agent_decisions;
DROP POLICY IF EXISTS "Users can update their own agent decisions" ON public.ai_agent_decisions;

-- Create policies for ai_agent_decisions
CREATE POLICY "Users can view their own agent decisions" ON public.ai_agent_decisions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create agent decisions" ON public.ai_agent_decisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent decisions" ON public.ai_agent_decisions
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 5. Fix function security issue
-- =====================================================

-- Update the function to have a secure search path
CREATE OR REPLACE FUNCTION public.prevent_audit_modifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent modifications to audit tables
  IF TG_TABLE_NAME IN ('audit_entries', 'audit_sessions', 'audit_chains') THEN
    RAISE EXCEPTION 'Direct modifications to audit tables are not allowed';
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- 6. Add indexes for performance
-- =====================================================

-- Add indexes for agent_activities if they don't exist
CREATE INDEX IF NOT EXISTS idx_agent_activities_user_id ON public.agent_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_created_at ON public.agent_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_activities_agent ON public.agent_activities(agent);
CREATE INDEX IF NOT EXISTS idx_agent_activities_workspace_id ON public.agent_activities(workspace_id);

-- Add indexes for ai_agent_decisions if they don't exist
CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_user_id ON public.ai_agent_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_created_at ON public.ai_agent_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_agent_decisions_agent ON public.ai_agent_decisions(agent);

-- Add indexes for invitation_keys if they don't exist
CREATE INDEX IF NOT EXISTS idx_invitation_keys_user_id ON public.invitation_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_keys_token ON public.invitation_keys(token);
CREATE INDEX IF NOT EXISTS idx_invitation_keys_expires_at ON public.invitation_keys(expires_at);

-- =====================================================
-- 7. Verify RLS is properly configured
-- =====================================================

-- Check RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename IN ('agent_activities', 'ai_agent_decisions', 'invitation_keys')
ORDER BY tablename;

-- =====================================================
-- 8. Test policies (optional - run these to verify)
-- =====================================================

-- Test that users can only see their own data
-- (This should be run with different user contexts to verify)

-- Example test queries (run these with different authenticated users):
-- SELECT * FROM public.agent_activities; -- Should only return user's own activities
-- SELECT * FROM public.ai_agent_decisions; -- Should only return user's own decisions
-- SELECT * FROM public.invitation_keys; -- Should only return user's own invitations

COMMIT;
