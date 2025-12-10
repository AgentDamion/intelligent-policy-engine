-- AIComplyr.io RLS & Roles Baseline (Sprint 0)
-- Enables tenant isolation, append-only proof ledger, and service layer access controls.

-- Helper function: returns the set of enterprise_ids the current user belongs to.
CREATE OR REPLACE FUNCTION public.current_enterprise_ids()
RETURNS TABLE(enterprise_id UUID)
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT em.enterprise_id
    FROM public.enterprise_members em
    WHERE em.user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Helper to check reviewer membership for PCPs during in_review state.
CREATE OR REPLACE FUNCTION public.is_reviewer_for_pcp(p_reviewers JSONB)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_reviewers) elem
        WHERE elem ? 'user_id'
          AND (elem->>'user_id')::uuid = auth.uid()
    );
$$;

-- Reusable trigger to maintain updated_at columns.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Enable RLS on core domain tables.
ALTER TABLE public.policy_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capability_implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaker_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dead_letter ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.proof_events FORCE ROW LEVEL SECURITY;

-- POLICY SNAPSHOTS
CREATE POLICY policy_snapshots_select ON public.policy_snapshots
    FOR SELECT TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY policy_snapshots_insert ON public.policy_snapshots
    FOR INSERT TO authenticated
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY policy_snapshots_service_all ON public.policy_snapshots
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- POLICY CHANGE PROPOSALS
CREATE POLICY pcp_select ON public.policy_change_proposals
    FOR SELECT TO authenticated
    USING (
        enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids())
        AND (
            status <> 'in_review'
            OR public.is_reviewer_for_pcp(reviewers)
        )
    );

CREATE POLICY pcp_insert ON public.policy_change_proposals
    FOR INSERT TO authenticated
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY pcp_update ON public.policy_change_proposals
    FOR UPDATE TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()))
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY pcp_service_all ON public.policy_change_proposals
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE TRIGGER pcp_touch_updated_at
    BEFORE UPDATE ON public.policy_change_proposals
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PROOF EVENTS (append-only for authenticated users, full for service role)
CREATE POLICY proof_events_select ON public.proof_events
    FOR SELECT TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY proof_events_insert_service ON public.proof_events
    FOR INSERT TO service_role
    WITH CHECK (true);

-- No UPDATE/DELETE policy for proof_events to keep it append-only.

-- TOOLS & TOOL VERSIONS
CREATE POLICY tools_select ON public.tools
    FOR SELECT TO authenticated
    USING (
        enterprise_id IS NULL
        OR enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids())
    );

CREATE POLICY tools_insert_enterprise ON public.tools
    FOR INSERT TO authenticated
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY tools_service_all ON public.tools
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY tool_versions_select ON public.tool_versions
    FOR SELECT TO authenticated
    USING (
        tool_id IN (
            SELECT id FROM public.tools
            WHERE enterprise_id IS NULL
               OR enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids())
        )
    );

CREATE POLICY tool_versions_insert ON public.tool_versions
    FOR INSERT TO authenticated
    WITH CHECK (
        tool_id IN (
            SELECT id FROM public.tools
            WHERE enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids())
        )
    );

CREATE POLICY tool_versions_service_all ON public.tool_versions
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- TOOL APPROVALS
CREATE POLICY tool_approvals_select ON public.tool_approvals
    FOR SELECT TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY tool_approvals_insert ON public.tool_approvals
    FOR INSERT TO authenticated
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY tool_approvals_update ON public.tool_approvals
    FOR UPDATE TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()))
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY tool_approvals_service_all ON public.tool_approvals
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE TRIGGER tool_approvals_touch_updated_at
    BEFORE UPDATE ON public.tool_approvals
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- FEATURES
CREATE POLICY features_select ON public.features
    FOR SELECT TO authenticated
    USING (
        enterprise_id IS NULL
        OR enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids())
    );

CREATE POLICY features_mutate_enterprise ON public.features
    FOR INSERT TO authenticated
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY features_update_enterprise ON public.features
    FOR UPDATE TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()))
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY features_service_all ON public.features
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE TRIGGER features_touch_updated_at
    BEFORE UPDATE ON public.features
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- VARIANCES
CREATE POLICY variances_select ON public.variances
    FOR SELECT TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY variances_insert ON public.variances
    FOR INSERT TO authenticated
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY variances_update ON public.variances
    FOR UPDATE TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()))
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY variances_service_all ON public.variances
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE TRIGGER variances_touch_updated_at
    BEFORE UPDATE ON public.variances
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TOOL USAGE EVENTS
CREATE POLICY tool_usage_events_select ON public.tool_usage_events
    FOR SELECT TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY tool_usage_events_insert ON public.tool_usage_events
    FOR INSERT TO authenticated
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY tool_usage_events_service_all ON public.tool_usage_events
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- CAPABILITIES (global catalog readable by all authenticated users)
CREATE POLICY capabilities_select ON public.capabilities
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY capabilities_service_all ON public.capabilities
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- CAPABILITY IMPLEMENTATIONS
CREATE POLICY capability_impls_select ON public.capability_implementations
    FOR SELECT TO authenticated
    USING (
        enterprise_id IS NULL
        OR enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids())
    );

CREATE POLICY capability_impls_insert ON public.capability_implementations
    FOR INSERT TO authenticated
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY capability_impls_service_all ON public.capability_implementations
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- SELECTION POLICIES
CREATE POLICY selection_policies_select ON public.selection_policies
    FOR SELECT TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY selection_policies_mutate ON public.selection_policies
    FOR INSERT TO authenticated
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY selection_policies_update ON public.selection_policies
    FOR UPDATE TO authenticated
    USING (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()))
    WITH CHECK (enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids()));

CREATE POLICY selection_policies_service_all ON public.selection_policies
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE TRIGGER selection_policies_touch_updated_at
    BEFORE UPDATE ON public.selection_policies
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SELECTION LOGS (read-only to enterprise members)
CREATE POLICY selection_logs_select ON public.selection_logs
    FOR SELECT TO authenticated
    USING (
        enterprise_id IS NULL
        OR enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids())
    );

CREATE POLICY selection_logs_service_all ON public.selection_logs
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- AGENT EVENTS & METRICS
CREATE POLICY agent_events_select ON public.agent_events
    FOR SELECT TO authenticated
    USING (
        enterprise_id IS NULL
        OR enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids())
    );

CREATE POLICY agent_events_service_all ON public.agent_events
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY agent_metrics_select ON public.agent_metrics
    FOR SELECT TO authenticated
    USING (
        enterprise_id IS NULL
        OR enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids())
    );

CREATE POLICY agent_metrics_service_all ON public.agent_metrics
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- BREAKER STATES
CREATE POLICY breaker_states_select ON public.breaker_states
    FOR SELECT TO authenticated
    USING (
        enterprise_id IS NULL
        OR enterprise_id IN (SELECT enterprise_id FROM public.current_enterprise_ids())
    );

CREATE POLICY breaker_states_service_all ON public.breaker_states
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- OUTBOX & DEAD LETTER (service role only)
CREATE POLICY outbox_service_all ON public.outbox
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY dead_letter_service_all ON public.dead_letter
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

