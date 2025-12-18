-- Fix security linter warnings for policy ingestion functions

-- Fix the update_policy_updated_at function to have immutable search path
CREATE OR REPLACE FUNCTION update_policy_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;