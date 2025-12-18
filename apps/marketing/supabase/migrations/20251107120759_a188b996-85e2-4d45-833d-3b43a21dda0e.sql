-- Create necessary extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------------------
-- 1. POLICY RULES TABLE
-- Stores active and historical policy rules evaluated by the policy-engine
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.policy_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    context_id TEXT NOT NULL,
    priority INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    rule JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.policy_rules IS 'Stores policy rules used for tool usage governance, indexed by tenant.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.policy_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated user can select (read) their own rules
CREATE POLICY "Tenants can view their own policy rules" ON public.policy_rules
    FOR SELECT USING (auth.uid() = tenant_id);

-- Policy: Authenticated user can insert (write) their own rules
CREATE POLICY "Tenants can create their own policy rules" ON public.policy_rules
    FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- Policy: Authenticated user can update their own rules
CREATE POLICY "Tenants can update their own policy rules" ON public.policy_rules
    FOR UPDATE USING (auth.uid() = tenant_id);

-- Policy: Authenticated user can delete their own rules
CREATE POLICY "Tenants can delete their own policy rules" ON public.policy_rules
    FOR DELETE USING (auth.uid() = tenant_id);

-- --------------------------------------------------------------------------------
-- 2. TOOL USAGE EVENTS TABLE
-- Stores the raw, incoming ToolUsageEvent payloads for telemetry and re-evaluation
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tool_usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    body JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tool_usage_events IS 'Stores raw tool usage events for auditing and analysis.';

ALTER TABLE public.tool_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can insert their own tool usage events" ON public.tool_usage_events
    FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view their own tool usage events" ON public.tool_usage_events
    FOR SELECT USING (auth.uid() = tenant_id);

-- --------------------------------------------------------------------------------
-- 3. POLICY EVIDENCE BUNDLES TABLE
-- Stores the compiled ProofBundles for the immutable audit trail
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.policy_evidence_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    policy_snapshot_id TEXT NOT NULL,
    body JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.policy_evidence_bundles IS 'Immutable audit trail of agent decisions and evidence metadata.';

ALTER TABLE public.policy_evidence_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can insert their own evidence bundles" ON public.policy_evidence_bundles
    FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view their own evidence bundles" ON public.policy_evidence_bundles
    FOR SELECT USING (auth.uid() = tenant_id);

-- Create helper indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_policy_rules_tenant_context ON public.policy_rules (tenant_id, context_id);
CREATE INDEX IF NOT EXISTS idx_policy_rules_active ON public.policy_rules (is_active, priority);
CREATE INDEX IF NOT EXISTS idx_tool_usage_events_tenant ON public.tool_usage_events (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_evidence_bundles_tenant ON public.policy_evidence_bundles (tenant_id, created_at DESC);