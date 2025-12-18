-- =====================================================
-- Demo Mode Configuration - Database Migration
-- Based on PRD Section 6.1: Technical Requirements
-- =====================================================

-- 1. Create demo_mode_preferences table
CREATE TABLE IF NOT EXISTS public.demo_mode_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  auto_enable_for_partner boolean NOT NULL DEFAULT true,
  auto_enable_for_vendor boolean NOT NULL DEFAULT true,
  auto_enable_for_enterprise boolean NOT NULL DEFAULT false,
  preference_source text NOT NULL DEFAULT 'manual' CHECK (preference_source IN ('manual', 'auto_rule', 'default')),
  last_toggled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_demo_mode_preferences_user_id ON public.demo_mode_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_mode_preferences_enabled ON public.demo_mode_preferences(enabled);

-- Enable RLS
ALTER TABLE public.demo_mode_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for demo_mode_preferences
CREATE POLICY "Users can view own demo preferences"
  ON public.demo_mode_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own demo preferences"
  ON public.demo_mode_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own demo preferences"
  ON public.demo_mode_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own demo preferences"
  ON public.demo_mode_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_demo_mode_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER update_demo_mode_preferences_updated_at
  BEFORE UPDATE ON public.demo_mode_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_demo_mode_preferences_updated_at();

-- 2. Create demo_mode_audit_log table
CREATE TABLE IF NOT EXISTS public.demo_mode_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('enabled', 'disabled', 'auto_enabled', 'preference_updated')),
  trigger_source text NOT NULL CHECK (trigger_source IN ('user_toggle', 'login_auto_enable', 'settings_update', 'system')),
  account_type text,
  previous_state boolean,
  new_state boolean NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_demo_mode_audit_log_user_id ON public.demo_mode_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_mode_audit_log_created_at ON public.demo_mode_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_mode_audit_log_action ON public.demo_mode_audit_log(action);

-- Enable RLS
ALTER TABLE public.demo_mode_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for demo_mode_audit_log (read-only for users, write by service role)
CREATE POLICY "Users can view own demo audit logs"
  ON public.demo_mode_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert audit logs"
  ON public.demo_mode_audit_log
  FOR INSERT
  WITH CHECK (true);

-- 3. Create function to get effective demo mode state
CREATE OR REPLACE FUNCTION public.get_effective_demo_mode_state(p_user_id uuid)
RETURNS TABLE(
  effective_enabled boolean,
  preference_source text,
  account_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preference RECORD;
  v_account_type text;
  v_effective_enabled boolean;
  v_preference_source text;
BEGIN
  -- Get user's account type from profiles
  SELECT account_type::text INTO v_account_type
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Get user's demo mode preferences
  SELECT * INTO v_preference
  FROM public.demo_mode_preferences
  WHERE user_id = p_user_id;
  
  -- Determine effective state based on priority:
  -- 1. Explicit user preference (if exists and manually set)
  -- 2. Auto-enable rules based on account type
  -- 3. Default (false)
  
  IF v_preference IS NOT NULL THEN
    -- User has explicit preferences
    IF v_preference.preference_source = 'manual' THEN
      -- Manual override takes highest priority
      v_effective_enabled := v_preference.enabled;
      v_preference_source := 'manual';
    ELSE
      -- Check auto-enable rules
      IF (v_account_type = 'partner' AND v_preference.auto_enable_for_partner) OR
         (v_account_type = 'vendor' AND v_preference.auto_enable_for_vendor) OR
         (v_account_type = 'enterprise' AND v_preference.auto_enable_for_enterprise) THEN
        v_effective_enabled := true;
        v_preference_source := 'auto_rule';
      ELSE
        v_effective_enabled := false;
        v_preference_source := 'default';
      END IF;
    END IF;
  ELSE
    -- No preferences set, apply default auto-enable rules
    IF v_account_type IN ('partner', 'vendor') THEN
      v_effective_enabled := true;
      v_preference_source := 'auto_rule';
    ELSE
      v_effective_enabled := false;
      v_preference_source := 'default';
    END IF;
  END IF;
  
  -- Return the effective state
  RETURN QUERY SELECT v_effective_enabled, v_preference_source, v_account_type;
END;
$$;