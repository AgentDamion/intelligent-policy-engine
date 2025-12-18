-- Fix ambiguous column reference in get_effective_demo_mode_state function
CREATE OR REPLACE FUNCTION public.get_effective_demo_mode_state(p_user_id uuid)
 RETURNS TABLE(effective_enabled boolean, preference_source text, account_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_preference RECORD;
  v_account_type text;
  v_effective_enabled boolean;
  v_preference_source text;
BEGIN
  -- Get user's account type from profiles (FIX: explicitly reference profiles.account_type)
  SELECT profiles.account_type::text INTO v_account_type
  FROM public.profiles
  WHERE profiles.id = p_user_id;
  
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
$function$;