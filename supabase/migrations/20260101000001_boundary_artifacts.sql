-- ============================================================================
-- BOUNDARY ARTIFACTS MIGRATION
-- ============================================================================
-- Purpose: Create tables for Decision Tokens, Partner Confirmations, and
--          Execution Receipts - the core artifacts of the "Boundary Governed"
--          value proposition.
--
-- These tables enable cryptographic proof of compliant AI tool usage across
-- organizational boundaries.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------

-- Signing method for cryptographic signatures (HMAC now, KMS later)
CREATE TYPE boundary_signing_method AS ENUM ('HMAC', 'KMS');

-- Executor type for execution receipts
CREATE TYPE boundary_executor_type AS ENUM ('enterprise', 'partner');

-- Decision Token status
CREATE TYPE boundary_dt_status AS ENUM ('active', 'expired', 'revoked', 'consumed');

-- ----------------------------------------------------------------------------
-- TABLE: boundary_decision_tokens
-- ----------------------------------------------------------------------------
-- Decision Tokens (DTs) are the portable authorization artifacts that cross
-- the boundary between enterprises and partners. They cryptographically bind
-- a policy decision to a specific tool, version, and usage grant.

CREATE TABLE IF NOT EXISTS boundary_decision_tokens (
    -- Primary key
    dt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Enterprise context (who issued the DT)
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    
    -- Partner context (nullable - null means enterprise-run mode)
    partner_id UUID REFERENCES enterprises(id) ON DELETE SET NULL,
    
    -- Policy snapshot binding (immutable reference to policy at decision time)
    eps_id TEXT NOT NULL,
    eps_digest TEXT NOT NULL,
    
    -- Tool identity binding
    tool_registry_id UUID,
    tool_version_id UUID,
    tool_name TEXT NOT NULL,
    tool_version TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    
    -- Usage grant (what is authorized)
    usage_grant JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Expected structure:
    -- {
    --   "purpose": "HCP campaign image generation",
    --   "action_type": "FinalAssetGeneration",
    --   "data_handling": "no_customer_data",
    --   "jurisdictions": ["US", "EU"],
    --   "required_controls": ["watermark", "audit_log"],
    --   "max_executions": 100,
    --   "valid_until": "2026-01-04T00:00:00Z"
    -- }
    
    -- Decision context (the approval decision)
    decision JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Expected structure:
    -- {
    --   "status": "Approved",
    --   "reason": "Tool approved for HCP campaigns",
    --   "risk_score": 35,
    --   "requires_hil": false,
    --   "approver_id": "user-123",
    --   "approved_at": "2026-01-01T12:00:00Z"
    -- }
    
    -- Cryptographic signature
    signature TEXT NOT NULL,
    signing_method boundary_signing_method NOT NULL DEFAULT 'HMAC',
    signing_key_id TEXT, -- For KMS: the key ARN/ID used
    
    -- Lifecycle
    status boundary_dt_status NOT NULL DEFAULT 'active',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    consumed_at TIMESTAMPTZ,
    
    -- Tracing
    trace_id TEXT,
    request_id TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_bdt_enterprise_id ON boundary_decision_tokens(enterprise_id);
CREATE INDEX idx_bdt_partner_id ON boundary_decision_tokens(partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX idx_bdt_eps_id ON boundary_decision_tokens(eps_id);
CREATE INDEX idx_bdt_status ON boundary_decision_tokens(status);
CREATE INDEX idx_bdt_issued_at ON boundary_decision_tokens(issued_at DESC);
CREATE INDEX idx_bdt_expires_at ON boundary_decision_tokens(expires_at) WHERE status = 'active';
CREATE INDEX idx_bdt_trace_id ON boundary_decision_tokens(trace_id) WHERE trace_id IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_boundary_dt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_boundary_dt_updated_at
    BEFORE UPDATE ON boundary_decision_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_boundary_dt_updated_at();

-- ----------------------------------------------------------------------------
-- TABLE: boundary_partner_confirmations
-- ----------------------------------------------------------------------------
-- Partner Confirmations (PCs) record explicit partner consent to use an
-- authorized tool under the bound policy snapshot. This is the "Shared
-- Compliance Shield" - both parties agree to governed usage.

CREATE TABLE IF NOT EXISTS boundary_partner_confirmations (
    -- Primary key
    pc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to Decision Token
    dt_id UUID NOT NULL REFERENCES boundary_decision_tokens(dt_id) ON DELETE CASCADE,
    
    -- Partner context
    partner_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    confirmer_user_id TEXT NOT NULL,
    confirmer_role TEXT,
    
    -- Confirmation details
    confirmation_statement TEXT NOT NULL,
    -- Standard statement: "I acknowledge that I will use the authorized tool/version
    -- under the bound policy snapshot for the stated purpose, and I understand this
    -- usage is governed and recorded."
    
    accepted_controls JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Array of control IDs the partner agrees to follow
    
    ip_address TEXT,
    user_agent TEXT,
    
    -- Cryptographic signature (partner signs their confirmation)
    signature TEXT NOT NULL,
    signing_method boundary_signing_method NOT NULL DEFAULT 'HMAC',
    
    -- Lifecycle
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Tracing
    trace_id TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bpc_dt_id ON boundary_partner_confirmations(dt_id);
CREATE INDEX idx_bpc_partner_id ON boundary_partner_confirmations(partner_id);
CREATE INDEX idx_bpc_confirmed_at ON boundary_partner_confirmations(confirmed_at DESC);
CREATE INDEX idx_bpc_trace_id ON boundary_partner_confirmations(trace_id) WHERE trace_id IS NOT NULL;

-- Unique constraint: one confirmation per DT per partner
CREATE UNIQUE INDEX idx_bpc_dt_partner_unique ON boundary_partner_confirmations(dt_id, partner_id);

-- ----------------------------------------------------------------------------
-- TABLE: boundary_execution_receipts
-- ----------------------------------------------------------------------------
-- Execution Receipts (ERs) are attestations that the authorized tool was
-- actually executed. They complete the proof chain and enable regulatory
-- verification of compliant usage.

CREATE TABLE IF NOT EXISTS boundary_execution_receipts (
    -- Primary key
    er_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to Decision Token
    dt_id UUID NOT NULL REFERENCES boundary_decision_tokens(dt_id) ON DELETE CASCADE,
    
    -- Link to Partner Confirmation (nullable - not required for enterprise-run)
    pc_id UUID REFERENCES boundary_partner_confirmations(pc_id) ON DELETE SET NULL,
    
    -- Executor context
    executor_type boundary_executor_type NOT NULL,
    executor_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    executor_user_id TEXT,
    
    -- Execution details
    execution_started_at TIMESTAMPTZ NOT NULL,
    execution_completed_at TIMESTAMPTZ,
    execution_duration_ms INTEGER,
    
    -- Outcome
    outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Expected structure:
    -- {
    --   "success": true,
    --   "output_hash": "sha256:abc123...",
    --   "output_type": "image/png",
    --   "output_size_bytes": 1048576,
    --   "error": null,
    --   "controls_applied": ["watermark", "audit_log"],
    --   "model_version": "midjourney-v6.1"
    -- }
    
    -- Cryptographic attestation
    attestation TEXT NOT NULL,
    signing_method boundary_signing_method NOT NULL DEFAULT 'HMAC',
    
    -- Tracing
    trace_id TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ber_dt_id ON boundary_execution_receipts(dt_id);
CREATE INDEX idx_ber_pc_id ON boundary_execution_receipts(pc_id) WHERE pc_id IS NOT NULL;
CREATE INDEX idx_ber_executor_id ON boundary_execution_receipts(executor_id);
CREATE INDEX idx_ber_executor_type ON boundary_execution_receipts(executor_type);
CREATE INDEX idx_ber_execution_started ON boundary_execution_receipts(execution_started_at DESC);
CREATE INDEX idx_ber_trace_id ON boundary_execution_receipts(trace_id) WHERE trace_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- VIEW: boundary_proof_chain
-- ----------------------------------------------------------------------------
-- Convenience view that joins DT -> PC -> ER for complete proof chains

CREATE OR REPLACE VIEW boundary_proof_chain AS
SELECT 
    dt.dt_id,
    dt.enterprise_id,
    dt.partner_id,
    dt.eps_id,
    dt.eps_digest,
    dt.tool_name,
    dt.tool_version,
    dt.vendor_name,
    dt.usage_grant,
    dt.decision,
    dt.status as dt_status,
    dt.issued_at as dt_issued_at,
    dt.expires_at as dt_expires_at,
    dt.signature as dt_signature,
    
    pc.pc_id,
    pc.confirmer_user_id,
    pc.confirmed_at as pc_confirmed_at,
    pc.signature as pc_signature,
    
    er.er_id,
    er.executor_type,
    er.executor_id,
    er.execution_started_at,
    er.execution_completed_at,
    er.outcome,
    er.attestation as er_attestation,
    
    -- Proof chain completeness
    CASE 
        WHEN er.er_id IS NOT NULL THEN 'complete'
        WHEN pc.pc_id IS NOT NULL THEN 'awaiting_execution'
        WHEN dt.partner_id IS NOT NULL THEN 'awaiting_confirmation'
        ELSE 'enterprise_run'
    END as chain_status
FROM boundary_decision_tokens dt
LEFT JOIN boundary_partner_confirmations pc ON dt.dt_id = pc.dt_id
LEFT JOIN boundary_execution_receipts er ON dt.dt_id = er.dt_id;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE boundary_decision_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_partner_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_execution_receipts ENABLE ROW LEVEL SECURITY;

-- Decision Tokens: Enterprise can see their own, partners can see theirs
CREATE POLICY bdt_enterprise_access ON boundary_decision_tokens
    FOR ALL
    USING (
        enterprise_id IN (
            SELECT id FROM enterprises 
            WHERE id = auth.jwt() ->> 'enterprise_id'::text
        )
        OR
        partner_id IN (
            SELECT id FROM enterprises 
            WHERE id = auth.jwt() ->> 'enterprise_id'::text
        )
    );

-- Service role bypass for internal operations
CREATE POLICY bdt_service_role ON boundary_decision_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Partner Confirmations: Partner can see/create their own, enterprise can view
CREATE POLICY bpc_partner_access ON boundary_partner_confirmations
    FOR ALL
    USING (
        partner_id IN (
            SELECT id FROM enterprises 
            WHERE id = auth.jwt() ->> 'enterprise_id'::text
        )
        OR
        dt_id IN (
            SELECT dt_id FROM boundary_decision_tokens
            WHERE enterprise_id = (auth.jwt() ->> 'enterprise_id')::uuid
        )
    );

-- Service role bypass
CREATE POLICY bpc_service_role ON boundary_partner_confirmations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Execution Receipts: Executor can create, enterprise/partner can view
CREATE POLICY ber_executor_access ON boundary_execution_receipts
    FOR ALL
    USING (
        executor_id IN (
            SELECT id FROM enterprises 
            WHERE id = auth.jwt() ->> 'enterprise_id'::text
        )
        OR
        dt_id IN (
            SELECT dt_id FROM boundary_decision_tokens
            WHERE enterprise_id = (auth.jwt() ->> 'enterprise_id')::uuid
               OR partner_id = (auth.jwt() ->> 'enterprise_id')::uuid
        )
    );

-- Service role bypass
CREATE POLICY ber_service_role ON boundary_execution_receipts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to check if a Decision Token is valid for use
CREATE OR REPLACE FUNCTION is_dt_valid(p_dt_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_dt boundary_decision_tokens%ROWTYPE;
BEGIN
    SELECT * INTO v_dt FROM boundary_decision_tokens WHERE dt_id = p_dt_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check status
    IF v_dt.status != 'active' THEN
        RETURN FALSE;
    END IF;
    
    -- Check expiry
    IF v_dt.expires_at < NOW() THEN
        -- Auto-expire the token
        UPDATE boundary_decision_tokens 
        SET status = 'expired', updated_at = NOW()
        WHERE dt_id = p_dt_id;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark DT as consumed after execution
CREATE OR REPLACE FUNCTION consume_dt(p_dt_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE boundary_decision_tokens
    SET status = 'consumed', consumed_at = NOW(), updated_at = NOW()
    WHERE dt_id = p_dt_id AND status = 'active';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke a Decision Token
CREATE OR REPLACE FUNCTION revoke_dt(p_dt_id UUID, p_reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE boundary_decision_tokens
    SET status = 'revoked', 
        revoked_at = NOW(), 
        revocation_reason = p_reason,
        updated_at = NOW()
    WHERE dt_id = p_dt_id AND status = 'active';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- COMMENTS
-- ----------------------------------------------------------------------------

COMMENT ON TABLE boundary_decision_tokens IS 
'Decision Tokens (DTs) are cryptographically signed authorizations for AI tool usage. They bind a policy decision to a specific tool, version, and usage grant, enabling cross-organizational governance.';

COMMENT ON TABLE boundary_partner_confirmations IS 
'Partner Confirmations (PCs) record explicit partner consent to use an authorized tool under the bound policy snapshot. This implements the "Shared Compliance Shield" principle.';

COMMENT ON TABLE boundary_execution_receipts IS 
'Execution Receipts (ERs) are attestations that the authorized tool was executed. They complete the proof chain for regulatory verification.';

COMMENT ON VIEW boundary_proof_chain IS 
'Convenience view joining DT -> PC -> ER for complete proof chain queries.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

