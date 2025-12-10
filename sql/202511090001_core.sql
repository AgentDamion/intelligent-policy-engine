-- AIComplyr.io Core Schema (Sprint 0)
-- Establishes foundational tables for policy governance, proof ledger, agent mesh, and operational telemetry.
-- NOTE: We use `enterprise_id` consistently for tenant scoping per project standards.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- POLICY SNAPSHOTS & PROPOSALS
-- ========================================

CREATE TABLE IF NOT EXISTS public.policy_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL,
    parent_snapshot_id UUID REFERENCES public.policy_snapshots(id) ON DELETE SET NULL,
    version INTEGER NOT NULL,
    payload JSONB NOT NULL,
    sha256_hash TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS policy_snapshots_enterprise_version_idx
    ON public.policy_snapshots (enterprise_id, version);

CREATE INDEX IF NOT EXISTS policy_snapshots_enterprise_created_idx
    ON public.policy_snapshots (enterprise_id, created_at DESC);

CREATE INDEX IF NOT EXISTS policy_snapshots_payload_gin_idx
    ON public.policy_snapshots USING GIN (payload);

CREATE TABLE IF NOT EXISTS public.policy_change_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL,
    from_snapshot_id UUID REFERENCES public.policy_snapshots(id) ON DELETE SET NULL,
    json_patch JSONB NOT NULL DEFAULT '[]'::JSONB,
    to_snapshot_preview JSONB NOT NULL DEFAULT '{}'::JSONB,
    canary_plan JSONB NOT NULL DEFAULT '{}'::JSONB,
    monitors JSONB NOT NULL DEFAULT '{}'::JSONB,
    rollback_plan JSONB NOT NULL DEFAULT '{}'::JSONB,
    reviewers JSONB NOT NULL DEFAULT '[]'::JSONB,
    impact_estimate JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL CHECK (status IN (
        'draft', 'proposed', 'in_review', 'approved', 'running',
        'succeeded', 'rolled_out', 'failed', 'rolled_back', 'archived'
    )),
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS policy_change_proposals_enterprise_status_idx
    ON public.policy_change_proposals (enterprise_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS policy_change_proposals_json_patch_gin_idx
    ON public.policy_change_proposals USING GIN (json_patch);

CREATE INDEX IF NOT EXISTS policy_change_proposals_preview_gin_idx
    ON public.policy_change_proposals USING GIN (to_snapshot_preview);

CREATE INDEX IF NOT EXISTS policy_change_proposals_impact_gin_idx
    ON public.policy_change_proposals USING GIN (impact_estimate);

CREATE TABLE IF NOT EXISTS public.proof_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    snapshot_id UUID REFERENCES public.policy_snapshots(id) ON DELETE SET NULL,
    actor_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proof_events_enterprise_created_idx
    ON public.proof_events (enterprise_id, created_at DESC);

CREATE INDEX IF NOT EXISTS proof_events_metadata_gin_idx
    ON public.proof_events USING GIN (metadata);

-- ========================================
-- TOOL CATALOG & APPROVALS
-- ========================================

CREATE TABLE IF NOT EXISTS public.tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID,
    vendor TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS tools_enterprise_name_idx
    ON public.tools (enterprise_id, name);

CREATE INDEX IF NOT EXISTS tools_vendor_idx
    ON public.tools (vendor);

CREATE TABLE IF NOT EXISTS public.tool_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    released_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS tool_versions_unique_idx
    ON public.tool_versions (tool_id, version);

CREATE INDEX IF NOT EXISTS tool_versions_metadata_gin_idx
    ON public.tool_versions USING GIN (metadata);

CREATE TABLE IF NOT EXISTS public.tool_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL,
    tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    version_rule TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'draft', 'in_review', 'approved', 'denied', 'expired', 'revoked'
    )),
    constraints JSONB NOT NULL DEFAULT '{}'::JSONB,
    expires_at TIMESTAMPTZ,
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tool_approvals_enterprise_status_idx
    ON public.tool_approvals (enterprise_id, status);

CREATE INDEX IF NOT EXISTS tool_approvals_constraints_gin_idx
    ON public.tool_approvals USING GIN (constraints);

CREATE INDEX IF NOT EXISTS tool_approvals_expires_idx
    ON public.tool_approvals (expires_at);

-- ========================================
-- FEATURE FLAGS
-- ========================================

CREATE TABLE IF NOT EXISTS public.features (
    id BIGSERIAL PRIMARY KEY,
    enterprise_id UUID,
    feature_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_strategy TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS features_unique_enterprise_idx
    ON public.features (enterprise_id, feature_key)
    WHERE enterprise_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS features_unique_global_idx
    ON public.features (feature_key)
    WHERE enterprise_id IS NULL;

CREATE INDEX IF NOT EXISTS features_metadata_gin_idx
    ON public.features USING GIN (metadata);

-- ========================================
-- VARIANCES & USAGE ENVELOPES
-- ========================================

CREATE TABLE IF NOT EXISTS public.variances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL,
    eps_snapshot_id UUID REFERENCES public.policy_snapshots(id) ON DELETE SET NULL,
    requester_id UUID NOT NULL,
    reason TEXT,
    justification JSONB NOT NULL DEFAULT '{}'::JSONB,
    ttl_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'requested', 'approved', 'denied', 'expired', 'revoked'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS variances_enterprise_status_idx
    ON public.variances (enterprise_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS variances_justification_gin_idx
    ON public.variances USING GIN (justification);

CREATE INDEX IF NOT EXISTS variances_ttl_idx
    ON public.variances (ttl_at);

CREATE TABLE IF NOT EXISTS public.tool_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL,
    actor_id UUID,
    partner_id UUID,
    client_id UUID,
    tool_id UUID REFERENCES public.tools(id) ON DELETE SET NULL,
    tool_key TEXT NOT NULL,
    version TEXT NOT NULL,
    action TEXT NOT NULL,
    purpose TEXT,
    eps_snapshot_id UUID REFERENCES public.policy_snapshots(id) ON DELETE SET NULL,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success_code TEXT NOT NULL CHECK (success_code IN ('OK', 'ERR')),
    token_count INTEGER,
    cost_estimate NUMERIC(12,4),
    file_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
    region TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS tool_usage_events_enterprise_ts_idx
    ON public.tool_usage_events (enterprise_id, ts DESC);

CREATE INDEX IF NOT EXISTS tool_usage_events_eps_idx
    ON public.tool_usage_events (enterprise_id, eps_snapshot_id, ts DESC);

CREATE INDEX IF NOT EXISTS tool_usage_events_metadata_gin_idx
    ON public.tool_usage_events USING GIN (metadata);

-- ========================================
-- CAPABILITY REGISTRY & SELECTION LOGS
-- ========================================

CREATE TABLE IF NOT EXISTS public.capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capability_key TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.capability_implementations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capability_id UUID NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
    enterprise_id UUID,
    name TEXT NOT NULL,
    provider TEXT,
    tier TEXT,
    region TEXT,
    cost_model JSONB NOT NULL DEFAULT '{}'::JSONB,
    config JSONB NOT NULL DEFAULT '{}'::JSONB,
    sla JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS capability_implementations_capability_idx
    ON public.capability_implementations (capability_id, provider, region);

CREATE INDEX IF NOT EXISTS capability_implementations_config_gin_idx
    ON public.capability_implementations USING GIN (config);

CREATE INDEX IF NOT EXISTS capability_implementations_cost_model_gin_idx
    ON public.capability_implementations USING GIN (cost_model);

CREATE TABLE IF NOT EXISTS public.selection_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID,
    capability_id UUID NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
    strategy TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS selection_policies_enterprise_idx
    ON public.selection_policies (enterprise_id, capability_id);

CREATE INDEX IF NOT EXISTS selection_policies_config_gin_idx
    ON public.selection_policies USING GIN (config);

CREATE TABLE IF NOT EXISTS public.selection_logs (
    id BIGSERIAL PRIMARY KEY,
    enterprise_id UUID,
    capability_id UUID NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
    requested_impl_id UUID,
    selected_impl_id UUID REFERENCES public.capability_implementations(id) ON DELETE SET NULL,
    fallback_chain JSONB NOT NULL DEFAULT '[]'::JSONB,
    reason_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    context JSONB NOT NULL DEFAULT '{}'::JSONB,
    cost_estimate NUMERIC(12,4),
    latency_ms INTEGER,
    status TEXT NOT NULL DEFAULT 'selected',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS selection_logs_enterprise_created_idx
    ON public.selection_logs (enterprise_id, capability_id, created_at DESC);

CREATE INDEX IF NOT EXISTS selection_logs_context_gin_idx
    ON public.selection_logs USING GIN (context);

-- ========================================
-- AGENT EVENTS, METRICS & CIRCUIT BREAKERS
-- ========================================

CREATE TABLE IF NOT EXISTS public.agent_events (
    id BIGSERIAL PRIMARY KEY,
    enterprise_id UUID,
    agent_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    capability_key TEXT,
    implementation_id UUID REFERENCES public.capability_implementations(id) ON DELETE SET NULL,
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_events_enterprise_created_idx
    ON public.agent_events (enterprise_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_events_details_gin_idx
    ON public.agent_events USING GIN (details);

CREATE TABLE IF NOT EXISTS public.agent_metrics (
    id BIGSERIAL PRIMARY KEY,
    enterprise_id UUID,
    agent_name TEXT NOT NULL,
    capability_key TEXT,
    implementation_id UUID REFERENCES public.capability_implementations(id) ON DELETE SET NULL,
    latency_ms INTEGER,
    token_count INTEGER,
    cost_estimate NUMERIC(12,4),
    success BOOLEAN,
    vendor_code TEXT,
    error_code TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_metrics_enterprise_recorded_idx
    ON public.agent_metrics (enterprise_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS agent_metrics_metadata_gin_idx
    ON public.agent_metrics USING GIN (metadata);

CREATE TABLE IF NOT EXISTS public.breaker_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID,
    capability_id UUID NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
    implementation_id UUID REFERENCES public.capability_implementations(id) ON DELETE CASCADE,
    state TEXT NOT NULL CHECK (state IN ('closed', 'open', 'half_open')),
    failure_count INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    error_ratio NUMERIC(6,3) NOT NULL DEFAULT 0,
    last_error_at TIMESTAMPTZ,
    last_opened_at TIMESTAMPTZ,
    last_closed_at TIMESTAMPTZ,
    reset_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS breaker_states_unique_idx
    ON public.breaker_states (enterprise_id, capability_id, implementation_id);

CREATE INDEX IF NOT EXISTS breaker_states_state_idx
    ON public.breaker_states (state);

-- ========================================
-- EVENT OUTBOX & DEAD LETTER QUEUE
-- ========================================

CREATE TABLE IF NOT EXISTS public.outbox (
    id BIGSERIAL PRIMARY KEY,
    enterprise_id UUID,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    payload JSONB NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_by TEXT,
    locked_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    last_error TEXT,
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS outbox_dispatch_idx
    ON public.outbox (published_at, scheduled_at)
    WHERE published_at IS NULL;

CREATE INDEX IF NOT EXISTS outbox_enterprise_idx
    ON public.outbox (enterprise_id, scheduled_at);

CREATE INDEX IF NOT EXISTS outbox_payload_gin_idx
    ON public.outbox USING GIN (payload);

CREATE TABLE IF NOT EXISTS public.dead_letter (
    id BIGSERIAL PRIMARY KEY,
    outbox_id BIGINT,
    enterprise_id UUID,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS dead_letter_enterprise_idx
    ON public.dead_letter (enterprise_id, failed_at DESC);

CREATE INDEX IF NOT EXISTS dead_letter_payload_gin_idx
    ON public.dead_letter USING GIN (payload);

-- ========================================
-- FEATURE FLAG EFFECTIVE VIEW
-- ========================================

CREATE OR REPLACE VIEW public.features_effective AS
WITH enterprise_overrides AS (
    SELECT
        enterprise_id,
        feature_key,
        enabled,
        metadata,
        updated_at,
        'enterprise'::TEXT AS source_scope
    FROM public.features
    WHERE enterprise_id IS NOT NULL
),
global_defaults AS (
    SELECT
        feature_key,
        enabled,
        metadata,
        updated_at
    FROM public.features
    WHERE enterprise_id IS NULL
),
enterprise_catalog AS (
    SELECT id AS enterprise_id FROM public.enterprises
    UNION
    SELECT enterprise_id FROM public.enterprise_members WHERE enterprise_id IS NOT NULL
    UNION
    SELECT enterprise_id FROM public.features WHERE enterprise_id IS NOT NULL
),
combined AS (
    SELECT eo.enterprise_id,
           eo.feature_key,
           eo.enabled,
           eo.metadata,
           eo.updated_at,
           eo.source_scope
    FROM enterprise_overrides eo
    UNION ALL
    SELECT ec.enterprise_id,
           gd.feature_key,
           gd.enabled,
           gd.metadata,
           gd.updated_at,
           'global'::TEXT AS source_scope
    FROM enterprise_catalog ec
    CROSS JOIN global_defaults gd
    UNION ALL
    SELECT NULL::UUID AS enterprise_id,
           gd.feature_key,
           gd.enabled,
           gd.metadata,
           gd.updated_at,
           'global'::TEXT AS source_scope
    FROM global_defaults gd
)
SELECT enterprise_id,
       feature_key,
       enabled,
       metadata,
       updated_at,
       source_scope
FROM (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY COALESCE(enterprise_id, '00000000-0000-0000-0000-000000000000'::UUID), feature_key
               ORDER BY CASE source_scope WHEN 'enterprise' THEN 1 ELSE 2 END,
                        updated_at DESC
           ) AS precedence
    FROM combined
) ranked
WHERE precedence = 1;

