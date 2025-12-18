-- Phase 3: Document proof_bundle schema with actor_provenance
-- Add comprehensive COMMENT to middleware_requests.proof_bundle column

COMMENT ON COLUMN public.middleware_requests.proof_bundle IS 
'Cryptographic proof bundle for audit trail. JSONB structure:
{
  "request_hash": "sha256:abc123...",
  "response_hash": "sha256:def456...",
  "policy_hash": "sha256:ghi789...",
  "signature": "hmac-sha256:jkl012...",
  "signed_at": "2025-01-15T14:23:17.892Z",
  "signed_by": "audit-agent-v1",
  "actor_provenance": {
    "user_id": "uuid-string",
    "partner_id": "uuid-string",
    "role_credential": {
      "credential_type": "VerifiablePresentation",
      "role_claims": ["Medical_Reviewer", "Content_Approver"],
      "scopes": ["content:approve", "ads:review"],
      "issuer_did": "did:web:agency.example.com",
      "issued_at": "2025-01-15T10:00:00Z",
      "expires_at": "2025-04-15T10:00:00Z",
      "signature": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
      "verified": true,
      "verified_at": "2025-01-15T14:23:17Z"
    },
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  },
  "evidence_manifest": {
    "policy_evaluation": {...},
    "context_analysis": {...},
    "request_metadata": {...}
  }
}

The actor_provenance.role_credential field stores OpenID4VC Verifiable Presentation data when require_role_proof is enabled on the partner API key. This enables role-based audit trails that survive personnel turnover.';

-- Add index on proof_bundle->actor_provenance->role_credential->verified for compliance queries
CREATE INDEX IF NOT EXISTS idx_middleware_requests_role_verified 
ON public.middleware_requests ((proof_bundle->'actor_provenance'->'role_credential'->>'verified'))
WHERE proof_bundle->'actor_provenance'->'role_credential' IS NOT NULL;

-- Add index on proof_bundle->actor_provenance->role_credential->issuer_did for issuer audits
CREATE INDEX IF NOT EXISTS idx_middleware_requests_issuer_did 
ON public.middleware_requests ((proof_bundle->'actor_provenance'->'role_credential'->>'issuer_did'))
WHERE proof_bundle->'actor_provenance'->'role_credential' IS NOT NULL;