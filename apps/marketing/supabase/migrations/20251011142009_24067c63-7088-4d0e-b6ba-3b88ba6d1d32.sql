-- Remove SECURITY DEFINER from v_user_context view
-- Security issue: Views with SECURITY DEFINER bypass RLS and use creator's permissions

-- Drop the view if it exists
DROP VIEW IF EXISTS public.v_user_context;

-- Note: If this view is needed, it should be recreated without SECURITY DEFINER
-- or the functionality should be moved to a proper SECURITY DEFINER function instead