-- Fix security linter warnings: set search_path for function

-- Drop and recreate function with proper search_path
DROP TRIGGER IF EXISTS enforce_policy_anchoring ON public.rfp_question_library;
DROP FUNCTION IF EXISTS public.validate_policy_anchoring();

CREATE OR REPLACE FUNCTION public.validate_policy_anchoring()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enforce policy anchoring for governance_compliance and security_access lanes
  IF NEW.question_lane IN ('governance_compliance', 'security_access') THEN
    IF NEW.linked_policy_id IS NULL OR NEW.linked_policy_clause IS NULL THEN
      RAISE EXCEPTION 'Policy anchoring required: governance and security questions must have linked_policy_id and linked_policy_clause';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_policy_anchoring
  BEFORE INSERT OR UPDATE ON public.rfp_question_library
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_policy_anchoring();