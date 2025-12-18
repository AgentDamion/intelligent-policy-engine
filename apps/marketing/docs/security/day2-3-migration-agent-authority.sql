-- =============================================================================
-- DAY 2-3: AGENT AUTHORITY FRAMEWORK
-- Pre-Launch Security Implementation
-- =============================================================================

-- =============================================================================
-- PART 1: Agent Manifest Table (Authority Registry)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_manifest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL UNIQUE,
  agent_type TEXT NOT NULL, -- 'system', 'governance', 'configuration', 'simulation'
  capabilities JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of capability strings
  auto_execution_threshold TEXT NOT NULL DEFAULT 'manual', -- 'auto_low', 'auto_medium', 'manual'
  max_resource_impact TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  allowed_operations JSONB NOT NULL DEFAULT '[]'::JSONB, -- ['read', 'write', 'delete', 'execute']
  conflict_resolution_strategy TEXT NOT NULL DEFAULT 'queue', -- 'queue', 'override', 'merge', 'reject'
  rate_limit_per_hour INTEGER DEFAULT 100,
  requires_approval_for JSONB DEFAULT '[]'::JSONB, -- Array of operation types requiring approval
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Index for quick agent lookup
CREATE INDEX idx_agent_manifest_name ON public.agent_manifest(agent_name) WHERE is_active = true;
CREATE INDEX idx_agent_manifest_type ON public.agent_manifest(agent_type);

-- RLS: Only admins can manage agent manifest
ALTER TABLE public.agent_manifest ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_manifest_admin_all ON public.agent_manifest
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enterprise_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enterprise_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Service role can read all
CREATE POLICY agent_manifest_service_read ON public.agent_manifest
  FOR SELECT
  TO service_role
  USING (true);

-- Authenticated users can view active agents
CREATE POLICY agent_manifest_users_view ON public.agent_manifest
  FOR SELECT
  TO authenticated
  USING (is_active = true);

COMMENT ON TABLE public.agent_manifest IS 
  'Agent Authority Registry - defines what each agent can do and under what conditions. Deployed Day 2-3.';

-- =============================================================================
-- PART 2: Agent Action Log (Conflict Detection)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_action_log (
  id BIGSERIAL PRIMARY KEY,
  agent_name TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'read', 'write', 'delete', 'execute'
  resource_type TEXT NOT NULL, -- 'asset_declaration', 'policy', 'partner_key', etc.
  resource_id UUID NOT NULL,
  enterprise_id UUID,
  workspace_id UUID,
  action_payload JSONB DEFAULT '{}'::JSONB,
  execution_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'executing', 'completed', 'failed', 'rejected'
  conflict_detected BOOLEAN DEFAULT false,
  conflicting_action_id BIGINT,
  resolution_strategy TEXT, -- 'queued', 'overridden', 'merged', 'rejected'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Foreign key to agent manifest
  CONSTRAINT fk_agent_manifest FOREIGN KEY (agent_name) 
    REFERENCES public.agent_manifest(agent_name) ON DELETE RESTRICT
);

-- Indexes for conflict detection
CREATE INDEX idx_agent_action_log_resource ON public.agent_action_log(resource_type, resource_id, execution_status);
CREATE INDEX idx_agent_action_log_enterprise ON public.agent_action_log(enterprise_id, created_at DESC);
CREATE INDEX idx_agent_action_log_conflicts ON public.agent_action_log(conflict_detected, execution_status) WHERE conflict_detected = true;
CREATE INDEX idx_agent_action_log_pending ON public.agent_action_log(execution_status, created_at) WHERE execution_status = 'pending';

-- RLS: Users can view actions in their enterprise context
ALTER TABLE public.agent_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_action_log_enterprise_view ON public.agent_action_log
  FOR SELECT
  TO authenticated
  USING (
    enterprise_id IN (
      SELECT enterprise_id FROM public.enterprise_members
      WHERE user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY agent_action_log_service_all ON public.agent_action_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.agent_action_log IS 
  'Agent Action Audit Trail - tracks all agent actions for conflict detection and resolution. Deployed Day 2-3.';

-- =============================================================================
-- PART 3: Conflict Detection Functions
-- =============================================================================

-- Function to detect conflicts before executing action
CREATE OR REPLACE FUNCTION public.detect_agent_conflict(
  p_agent_name TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_action_type TEXT
) RETURNS TABLE (
  has_conflict BOOLEAN,
  conflicting_action_id BIGINT,
  conflicting_agent TEXT,
  suggested_resolution TEXT
) AS $$
DECLARE
  v_pending_actions INTEGER;
  v_conflicting_record RECORD;
  v_agent_strategy TEXT;
BEGIN
  -- Check for pending or executing actions on the same resource
  SELECT COUNT(*), MAX(id) 
  INTO v_pending_actions, conflicting_action_id
  FROM public.agent_action_log
  WHERE resource_type = p_resource_type
    AND resource_id = p_resource_id
    AND execution_status IN ('pending', 'executing')
    AND agent_name != p_agent_name;

  -- If conflicts found, get conflict resolution strategy
  IF v_pending_actions > 0 THEN
    SELECT aal.*, am.conflict_resolution_strategy
    INTO v_conflicting_record
    FROM public.agent_action_log aal
    JOIN public.agent_manifest am ON aal.agent_name = am.agent_name
    WHERE aal.id = conflicting_action_id;

    RETURN QUERY SELECT 
      true as has_conflict,
      conflicting_action_id,
      v_conflicting_record.agent_name as conflicting_agent,
      v_conflicting_record.conflict_resolution_strategy as suggested_resolution;
  ELSE
    -- No conflict
    RETURN QUERY SELECT 
      false as has_conflict,
      NULL::BIGINT as conflicting_action_id,
      NULL::TEXT as conflicting_agent,
      NULL::TEXT as suggested_resolution;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.detect_agent_conflict(TEXT, TEXT, UUID, TEXT) TO service_role;

COMMENT ON FUNCTION public.detect_agent_conflict IS 
  'Detects conflicts when multiple agents try to modify the same resource. Returns conflict status and resolution strategy.';

-- =============================================================================
-- PART 4: Auto-Execution Threshold Checker
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_auto_execution_allowed(
  p_agent_name TEXT,
  p_action_type TEXT,
  p_resource_impact TEXT -- 'low', 'medium', 'high', 'critical'
) RETURNS TABLE (
  can_auto_execute BOOLEAN,
  requires_approval BOOLEAN,
  threshold_level TEXT,
  reason TEXT
) AS $$
DECLARE
  v_agent RECORD;
BEGIN
  -- Get agent configuration
  SELECT * INTO v_agent
  FROM public.agent_manifest
  WHERE agent_name = p_agent_name
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false as can_auto_execute,
      true as requires_approval,
      'manual' as threshold_level,
      'Agent not found in manifest or inactive' as reason;
    RETURN;
  END IF;

  -- Check if action type requires approval
  IF v_agent.requires_approval_for ? p_action_type THEN
    RETURN QUERY SELECT 
      false as can_auto_execute,
      true as requires_approval,
      v_agent.auto_execution_threshold as threshold_level,
      format('Action type "%s" always requires approval', p_action_type) as reason;
    RETURN;
  END IF;

  -- Check auto-execution threshold vs resource impact
  CASE v_agent.auto_execution_threshold
    WHEN 'auto_low' THEN
      -- Can only auto-execute low impact actions
      IF p_resource_impact = 'low' THEN
        RETURN QUERY SELECT true, false, 'auto_low'::TEXT, 'Low impact action - auto-approved'::TEXT;
      ELSE
        RETURN QUERY SELECT false, true, 'auto_low'::TEXT, 
          format('Resource impact "%s" exceeds auto_low threshold', p_resource_impact)::TEXT;
      END IF;

    WHEN 'auto_medium' THEN
      -- Can auto-execute low and medium impact actions
      IF p_resource_impact IN ('low', 'medium') THEN
        RETURN QUERY SELECT true, false, 'auto_medium'::TEXT, 
          format('%s impact action - auto-approved', p_resource_impact)::TEXT;
      ELSE
        RETURN QUERY SELECT false, true, 'auto_medium'::TEXT,
          format('Resource impact "%s" exceeds auto_medium threshold', p_resource_impact)::TEXT;
      END IF;

    ELSE -- 'manual' or unknown
      RETURN QUERY SELECT false, true, 'manual'::TEXT, 'Agent requires manual approval for all actions'::TEXT;
  END CASE;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_auto_execution_allowed(TEXT, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.check_auto_execution_allowed IS 
  'Checks if agent can auto-execute action based on threshold and resource impact. Returns approval status and reason.';

-- =============================================================================
-- PART 5: Seed Agent Manifest with Default Agents
-- =============================================================================

INSERT INTO public.agent_manifest (agent_name, agent_type, capabilities, auto_execution_threshold, max_resource_impact, allowed_operations, conflict_resolution_strategy, requires_approval_for, metadata)
VALUES 
  -- Asset Declaration Agent
  (
    'AssetDeclarationAgent',
    'governance',
    '["validate_tools", "generate_proof_bundle", "detect_violations", "create_declarations"]'::JSONB,
    'auto_medium', -- Can auto-execute low/medium impact
    'medium',
    '["read", "write", "execute"]'::JSONB,
    'queue', -- Queue conflicting actions
    '["delete", "policy_override"]'::JSONB, -- Delete and overrides require approval
    '{"description": "Manages asset declarations and tool validation", "version": "1.0"}'::JSONB
  ),
  
  -- Configuration Agent
  (
    'ConfigurationAgent',
    'configuration',
    '["manage_model_registry", "manage_data_sources", "generate_api_keys", "validate_metadata"]'::JSONB,
    'auto_low', -- Only auto-execute low impact
    'high', -- Can affect high-impact resources but needs approval
    '["read", "write", "execute"]'::JSONB,
    'reject', -- Reject conflicting configuration changes
    '["write", "delete", "execute"]'::JSONB, -- Most config changes require approval
    '{"description": "Manages asset registry and credentials", "version": "1.0"}'::JSONB
  ),
  
  -- Policy Maintenance Agent
  (
    'PolicyMaintenanceAgent',
    'governance',
    '["analyze_middleware_requests", "detect_anomalies", "suggest_optimizations", "validate_compliance"]'::JSONB,
    'manual', -- All actions require approval
    'critical', -- Can detect critical issues
    '["read", "execute"]'::JSONB,
    'merge', -- Merge insights from multiple analyses
    '["execute"]'::JSONB, -- All recommendations require approval
    '{"description": "Monitors and optimizes policies", "version": "1.0"}'::JSONB
  ),
  
  -- Simulation Agent
  (
    'SimulationAgent',
    'simulation',
    '["replay_traffic", "detect_conflicts", "optimize_costs", "analyze_deprecation"]'::JSONB,
    'auto_medium',
    'medium',
    '["read", "execute"]'::JSONB,
    'queue',
    '["write", "delete"]'::JSONB,
    '{"description": "Simulates policy changes against historical data", "version": "1.0"}'::JSONB
  ),
  
  -- Inbox Agent
  (
    'InboxAgent',
    'system',
    '["create_tasks", "route_approvals", "execute_actions", "normalize_payloads"]'::JSONB,
    'auto_low', -- Can auto-create low-priority tasks
    'low',
    '["read", "write", "execute"]'::JSONB,
    'queue',
    '["execute"]'::JSONB, -- Action execution requires approval
    '{"description": "Routes tasks and approvals across platform", "version": "1.0"}'::JSONB
  );

-- =============================================================================
-- PART 6: Analytics Views
-- =============================================================================

-- Agent activity summary
CREATE OR REPLACE VIEW public.agent_authority_summary AS
SELECT 
  am.agent_name,
  am.agent_type,
  am.auto_execution_threshold,
  am.max_resource_impact,
  COUNT(aal.id) as total_actions,
  COUNT(CASE WHEN aal.execution_status = 'completed' THEN 1 END) as completed_actions,
  COUNT(CASE WHEN aal.execution_status = 'failed' THEN 1 END) as failed_actions,
  COUNT(CASE WHEN aal.conflict_detected = true THEN 1 END) as conflicts_detected,
  MAX(aal.created_at) as last_action_at
FROM public.agent_manifest am
LEFT JOIN public.agent_action_log aal ON am.agent_name = aal.agent_name
WHERE am.is_active = true
GROUP BY am.agent_name, am.agent_type, am.auto_execution_threshold, am.max_resource_impact;

COMMENT ON VIEW public.agent_authority_summary IS 
  'Analytics view showing agent activity and authority usage patterns.';

-- Conflict resolution analytics
CREATE OR REPLACE VIEW public.agent_conflict_analytics AS
SELECT 
  aal.resource_type,
  aal.agent_name,
  aal.resolution_strategy,
  COUNT(*) as conflict_count,
  AVG(EXTRACT(EPOCH FROM (aal.completed_at - aal.started_at))) as avg_resolution_time_seconds,
  MAX(aal.created_at) as last_conflict_at
FROM public.agent_action_log aal
WHERE aal.conflict_detected = true
  AND aal.created_at > NOW() - INTERVAL '30 days'
GROUP BY aal.resource_type, aal.agent_name, aal.resolution_strategy;

COMMENT ON VIEW public.agent_conflict_analytics IS 
  'Analytics showing conflict patterns and resolution effectiveness.';

-- =============================================================================
-- PART 7: Trigger for Updated Timestamps
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_agent_manifest_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_manifest_update_timestamp
  BEFORE UPDATE ON public.agent_manifest
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_manifest_timestamp();

-- =============================================================================
-- DEPLOYMENT LOG
-- Deployed by: Security Team
-- Date: 2025-11-20
-- Environment: [staging|production]
-- Dependencies: Day 1 RLS security hardening must be deployed first
-- Verification: Run SELECT * FROM agent_authority_summary;
-- =============================================================================
