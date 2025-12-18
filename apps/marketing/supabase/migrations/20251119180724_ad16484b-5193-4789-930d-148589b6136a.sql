-- Phase 4: Create helper functions for role-based provenance

-- Function 1: get_issuer_public_key
-- Retrieves the public key (JWK format) for an active issuer
CREATE OR REPLACE FUNCTION public.get_issuer_public_key(p_issuer_did TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_public_key JSONB;
BEGIN
  SELECT public_key_jwk INTO v_public_key
  FROM public.trusted_issuers
  WHERE issuer_did = p_issuer_did
    AND status = 'active'
  LIMIT 1;
  
  RETURN v_public_key;
END;
$$;

COMMENT ON FUNCTION public.get_issuer_public_key(TEXT) IS 
'Retrieves the public key (JWK format) for an active issuer by DID. Returns NULL if issuer not found or inactive. Used by middleware-openai-proxy for offline JWT verification.';


-- Function 2: is_role_authorized
-- Validates if provided role claims and scopes are authorized for a specific API key
CREATE OR REPLACE FUNCTION public.is_role_authorized(
  p_api_key_id UUID,
  p_role_claims JSONB,
  p_scopes JSONB
)
RETURNS TABLE(
  authorized BOOLEAN,
  invalid_claims JSONB,
  missing_scopes JSONB,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_require_role_proof BOOLEAN;
  v_allowed_role_claims JSONB;
  v_allowed_scopes JSONB;
  v_invalid_claims JSONB;
  v_missing_scopes JSONB;
  v_authorized BOOLEAN := FALSE;
  v_message TEXT;
BEGIN
  -- Get API key configuration
  SELECT 
    require_role_proof,
    allowed_role_claims,
    allowed_scopes
  INTO 
    v_require_role_proof,
    v_allowed_role_claims,
    v_allowed_scopes
  FROM public.partner_api_keys
  WHERE id = p_api_key_id;
  
  -- If API key not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::JSONB,
      NULL::JSONB,
      'API key not found'::TEXT;
    RETURN;
  END IF;
  
  -- If role proof not required, authorize immediately
  IF v_require_role_proof = FALSE THEN
    RETURN QUERY SELECT 
      TRUE,
      NULL::JSONB,
      NULL::JSONB,
      'Role proof not required for this API key'::TEXT;
    RETURN;
  END IF;
  
  -- Validate role claims (must be subset of allowed_role_claims)
  IF v_allowed_role_claims IS NOT NULL AND jsonb_array_length(v_allowed_role_claims) > 0 THEN
    -- Find invalid claims (present in p_role_claims but not in allowed_role_claims)
    SELECT jsonb_agg(claim)
    INTO v_invalid_claims
    FROM jsonb_array_elements_text(p_role_claims) AS claim
    WHERE NOT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements_text(v_allowed_role_claims) AS allowed_claim
      WHERE allowed_claim = claim
    );
  END IF;
  
  -- Validate scopes (must be subset of allowed_scopes)
  IF v_allowed_scopes IS NOT NULL AND jsonb_array_length(v_allowed_scopes) > 0 THEN
    -- Find missing required scopes (present in allowed_scopes but not in p_scopes)
    SELECT jsonb_agg(scope)
    INTO v_missing_scopes
    FROM jsonb_array_elements_text(v_allowed_scopes) AS scope
    WHERE NOT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements_text(p_scopes) AS provided_scope
      WHERE provided_scope = scope
    );
  END IF;
  
  -- Determine authorization status
  IF v_invalid_claims IS NULL AND v_missing_scopes IS NULL THEN
    v_authorized := TRUE;
    v_message := 'Role claims and scopes authorized';
  ELSE
    v_authorized := FALSE;
    v_message := CASE
      WHEN v_invalid_claims IS NOT NULL AND v_missing_scopes IS NOT NULL THEN
        'Invalid role claims and missing required scopes'
      WHEN v_invalid_claims IS NOT NULL THEN
        'Invalid role claims provided'
      WHEN v_missing_scopes IS NOT NULL THEN
        'Missing required scopes'
      ELSE
        'Authorization check failed'
    END;
  END IF;
  
  RETURN QUERY SELECT 
    v_authorized,
    v_invalid_claims,
    v_missing_scopes,
    v_message;
END;
$$;

COMMENT ON FUNCTION public.is_role_authorized(UUID, JSONB, JSONB) IS 
'Validates if provided role claims and scopes are authorized for a specific API key. Returns detailed authorization result including any invalid claims or missing scopes. Used by middleware-openai-proxy for whitelist-based access control.';


-- Test cases for validation
DO $$
DECLARE
  v_test_key_id UUID;
  v_test_issuer_did TEXT := 'did:web:test.example.com';
  v_result RECORD;
BEGIN
  -- Test 1: get_issuer_public_key with non-existent issuer (should return NULL)
  IF public.get_issuer_public_key('did:web:nonexistent.com') IS NOT NULL THEN
    RAISE EXCEPTION 'Test 1 failed: Expected NULL for non-existent issuer';
  END IF;
  RAISE NOTICE 'Test 1 passed: get_issuer_public_key returns NULL for non-existent issuer';
  
  -- Test 2: is_role_authorized with non-existent API key (should return unauthorized)
  SELECT * INTO v_result FROM public.is_role_authorized(
    gen_random_uuid(),
    '["Medical_Reviewer"]'::JSONB,
    '["content:approve"]'::JSONB
  );
  IF v_result.authorized = TRUE THEN
    RAISE EXCEPTION 'Test 2 failed: Expected unauthorized for non-existent API key';
  END IF;
  RAISE NOTICE 'Test 2 passed: is_role_authorized returns unauthorized for non-existent API key';
  
  RAISE NOTICE 'All Phase 4 helper function tests passed successfully';
END;
$$;