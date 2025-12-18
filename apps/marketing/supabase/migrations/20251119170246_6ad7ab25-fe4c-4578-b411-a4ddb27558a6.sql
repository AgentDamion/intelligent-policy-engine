-- ============================================================================
-- Role-Based Provenance: Trusted Issuers Registry (Phase 1)
-- ============================================================================
-- Stores public keys of authorized credential issuers (e.g., agency IdPs)
-- Enables verification of role-based Verifiable Credentials without calling external services
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trusted_issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to partner (agency) enterprise
  partner_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  
  -- Decentralized Identifier (DID) of the issuer
  -- Example: "did:web:auth.acme-agency.com" or "did:key:z6Mkf..."
  issuer_did TEXT NOT NULL UNIQUE,
  
  -- Public key in JWK (JSON Web Key) format for signature verification
  -- Stores the cryptographic public key used to verify JWT signatures
  public_key_jwk JSONB NOT NULL,
  
  -- Lifecycle status
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'revoked', 'expired')),
  
  -- Optional metadata
  issuer_name TEXT, -- Human-readable name (e.g., "Acme Agency Auth")
  issuer_metadata JSONB DEFAULT '{}'::jsonb, -- Additional issuer info
  
  -- Audit trail
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  revoked_at TIMESTAMPTZ, -- Timestamp when status changed to 'revoked'
  revoked_by UUID REFERENCES auth.users(id),
  revocation_reason TEXT
);

-- Indexes for fast lookups during credential verification
CREATE INDEX idx_trusted_issuers_partner ON public.trusted_issuers(partner_id);
CREATE INDEX idx_trusted_issuers_did ON public.trusted_issuers(issuer_did) WHERE status = 'active';
CREATE INDEX idx_trusted_issuers_status ON public.trusted_issuers(status);

-- Add table and column comments for documentation
COMMENT ON TABLE public.trusted_issuers IS 'Registry of authorized credential issuers for role-based provenance verification';
COMMENT ON COLUMN public.trusted_issuers.issuer_did IS 'Decentralized Identifier (DID) uniquely identifying the credential issuer';
COMMENT ON COLUMN public.trusted_issuers.public_key_jwk IS 'JWK format public key for verifying JWT signatures from this issuer';
COMMENT ON COLUMN public.trusted_issuers.status IS 'Lifecycle status: active (can verify), revoked (blocked), expired (needs renewal)';
COMMENT ON COLUMN public.trusted_issuers.issuer_name IS 'Human-readable name for UI display (e.g., "Acme Agency Auth Service")';

-- Enable Row Level Security
ALTER TABLE public.trusted_issuers ENABLE ROW LEVEL SECURITY;

-- Enterprises can view trusted issuers for their partners
CREATE POLICY "Enterprises can view issuers for their partners"
  ON public.trusted_issuers FOR SELECT
  USING (
    -- User is member of enterprise that issued keys to this partner
    EXISTS (
      SELECT 1 FROM public.partner_api_keys pak
      WHERE pak.partner_id = trusted_issuers.partner_id
        AND pak.enterprise_id IN (
          SELECT enterprise_id FROM public.enterprise_members 
          WHERE user_id = auth.uid()
        )
    )
    OR
    -- User is member of the partner enterprise itself
    partner_id IN (
      SELECT enterprise_id FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

-- Enterprises can add trusted issuers for their partners
CREATE POLICY "Enterprises can add issuers for their partners"
  ON public.trusted_issuers FOR INSERT
  WITH CHECK (
    -- User is admin/owner of enterprise that has relationship with this partner
    EXISTS (
      SELECT 1 FROM public.enterprise_members em
      JOIN public.partner_api_keys pak ON pak.enterprise_id = em.enterprise_id
      WHERE em.user_id = auth.uid()
        AND pak.partner_id = trusted_issuers.partner_id
        AND em.role IN ('admin', 'owner')
    )
  );

-- Enterprises can revoke (update status) issuers
CREATE POLICY "Enterprises can revoke issuers"
  ON public.trusted_issuers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.enterprise_members em
      JOIN public.partner_api_keys pak ON pak.enterprise_id = em.enterprise_id
      WHERE em.user_id = auth.uid()
        AND pak.partner_id = trusted_issuers.partner_id
        AND em.role IN ('admin', 'owner')
    )
  );

-- Service role can manage all issuers (for middleware verification)
CREATE POLICY "Service role can manage trusted issuers"
  ON public.trusted_issuers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at timestamp
CREATE TRIGGER update_trusted_issuers_updated_at
  BEFORE UPDATE ON public.trusted_issuers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();