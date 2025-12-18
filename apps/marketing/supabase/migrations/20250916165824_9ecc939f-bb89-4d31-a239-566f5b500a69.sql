-- Fix security warnings by setting search_path for functions

-- Update the generate_assessment_token function with proper search path
CREATE OR REPLACE FUNCTION public.generate_assessment_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Update the cleanup function with proper search path
CREATE OR REPLACE FUNCTION public.cleanup_expired_assessment_progress()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.assessment_progress 
  WHERE expires_at < now() 
    AND completed_at IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;