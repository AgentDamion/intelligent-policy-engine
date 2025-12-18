-- Phase 2: Extend partner_api_keys with role credential fields

-- Add role credential verification columns to partner_api_keys
ALTER TABLE partner_api_keys 
ADD COLUMN IF NOT EXISTS require_role_proof BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allowed_role_claims JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allowed_scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS issuer_did TEXT;

-- Add foreign key constraint to trusted_issuers
ALTER TABLE partner_api_keys
ADD CONSTRAINT fk_partner_api_keys_issuer_did 
FOREIGN KEY (issuer_did) 
REFERENCES trusted_issuers(issuer_did) 
ON DELETE SET NULL;

-- Add constraint: issuer_did is required when require_role_proof is TRUE
ALTER TABLE partner_api_keys
ADD CONSTRAINT chk_require_role_proof_has_issuer 
CHECK (
  (require_role_proof = FALSE) OR 
  (require_role_proof = TRUE AND issuer_did IS NOT NULL)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_api_keys_issuer_did 
ON partner_api_keys(issuer_did) 
WHERE issuer_did IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_api_keys_require_role_proof 
ON partner_api_keys(require_role_proof) 
WHERE require_role_proof = TRUE;

-- Add helpful comments
COMMENT ON COLUMN partner_api_keys.require_role_proof IS 
'Whether this API key requires OpenID4VC role credential verification. When TRUE, x-role-credential header must be provided with valid signed credential.';

COMMENT ON COLUMN partner_api_keys.allowed_role_claims IS 
'Array of allowed role claims (e.g., ["Authorized_Medical_Reviewer", "Clinical_Operations_Lead"]). Only these roles can use this key when require_role_proof is TRUE.';

COMMENT ON COLUMN partner_api_keys.allowed_scopes IS 
'Array of allowed OAuth scopes (e.g., ["openai.completions", "openai.embeddings"]). Limits what API operations this key can perform.';

COMMENT ON COLUMN partner_api_keys.issuer_did IS 
'DID of the trusted issuer (agency IdP) that signs role credentials. Must reference trusted_issuers table. Required when require_role_proof is TRUE.';