-- ============================================================================
-- VERA Flow Engine Foundation
-- Migration: 001_flow_engine_foundation.sql
-- 
-- Creates the core tables for the lightweight flow engine:
-- - flow_definitions: Store workflow graphs as JSONB
-- - flow_runs: Track execution instances
-- - flow_steps: Audit trail of each step execution
-- - vera.events: Tamper-evident event store with hash chains
-- ============================================================================

-- ============================================================================
-- PART 1: Flow Definition Tables
-- ============================================================================

-- Flow definitions (the workflow maps)
CREATE TABLE IF NOT EXISTS flow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- e.g., "New-Tool-Approval"
  version TEXT NOT NULL,                 -- e.g., "v1.0"
  description TEXT,
  graph_definition JSONB NOT NULL,       -- Nodes and Edges
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(name, version)
);

-- Flow runs (execution instances)
CREATE TABLE IF NOT EXISTS flow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID REFERENCES enterprises(id),
  flow_definition_id UUID REFERENCES flow_definitions(id),
  status TEXT CHECK (status IN ('running', 'completed', 'failed', 'waiting_for_human', 'cancelled')) DEFAULT 'running',
  current_node TEXT,
  context JSONB DEFAULT '{}'::jsonb,     -- The "memory" of this run
  proof_bundle_id UUID,                  -- Links to proof_bundles table
  initiated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Flow steps (audit trail / proof bundle source)
CREATE TABLE IF NOT EXISTS flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_run_id UUID REFERENCES flow_runs(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  agent_name TEXT,                       -- Which agent executed this step
  input_data JSONB,
  output_data JSONB,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  step_order INTEGER NOT NULL
);

-- ============================================================================
-- PART 2: Event Sourcing Foundation (Tamper-Evident Audit)
-- ============================================================================

-- Create vera schema for governance-specific tables
CREATE SCHEMA IF NOT EXISTS vera;

-- Event store for tamper-evident audit trails
CREATE TABLE IF NOT EXISTS vera.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id UUID NOT NULL,            -- enterprise_id, submission_id, flow_run_id, etc.
  aggregate_type VARCHAR(100) NOT NULL,  -- 'enterprise', 'submission', 'flow_run'
  event_type VARCHAR(255) NOT NULL,      -- 'policy_evaluated', 'human_approved', etc.
  event_version INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,  -- actor_id, correlation_id, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  sequence_number BIGSERIAL,
  -- Hash chain for tamper evidence
  content_hash TEXT NOT NULL,
  previous_hash TEXT,
  UNIQUE(aggregate_id, sequence_number)
);

-- ============================================================================
-- PART 3: Indexes for Performance
-- ============================================================================

-- Flow definitions
CREATE INDEX IF NOT EXISTS idx_flow_definitions_active 
  ON flow_definitions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_flow_definitions_name 
  ON flow_definitions(name, version);

-- Flow runs
CREATE INDEX IF NOT EXISTS idx_flow_runs_enterprise 
  ON flow_runs(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_flow_runs_status 
  ON flow_runs(status);
CREATE INDEX IF NOT EXISTS idx_flow_runs_definition 
  ON flow_runs(flow_definition_id);
CREATE INDEX IF NOT EXISTS idx_flow_runs_created 
  ON flow_runs(created_at DESC);

-- Flow steps
CREATE INDEX IF NOT EXISTS idx_flow_steps_run 
  ON flow_steps(flow_run_id);
CREATE INDEX IF NOT EXISTS idx_flow_steps_order 
  ON flow_steps(flow_run_id, step_order);

-- Events (BRIN for time-series optimization)
CREATE INDEX IF NOT EXISTS idx_events_time_brin 
  ON vera.events USING BRIN(created_at);
CREATE INDEX IF NOT EXISTS idx_events_aggregate 
  ON vera.events(aggregate_id, aggregate_type);
CREATE INDEX IF NOT EXISTS idx_events_type 
  ON vera.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_metadata 
  ON vera.events USING GIN(metadata);

-- ============================================================================
-- PART 4: Auto-Update Triggers
-- ============================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_flow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to flow_definitions
DROP TRIGGER IF EXISTS update_flow_definitions_updated_at ON flow_definitions;
CREATE TRIGGER update_flow_definitions_updated_at
  BEFORE UPDATE ON flow_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_flow_updated_at();

-- ============================================================================
-- PART 5: Row Level Security
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE flow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE vera.events ENABLE ROW LEVEL SECURITY;

-- Flow definitions: All authenticated users can read active flows
CREATE POLICY "Authenticated can read active flow definitions"
  ON flow_definitions FOR SELECT TO authenticated
  USING (is_active = true);

-- Flow definitions: Only service role can modify
CREATE POLICY "Service role can manage flow definitions"
  ON flow_definitions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Flow runs: Enterprise members can read their flows
CREATE POLICY "Enterprise members can read flow runs"
  ON flow_runs FOR SELECT TO authenticated
  USING (
    enterprise_id IN (
      SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()
    )
  );

-- Flow runs: Service role can manage
CREATE POLICY "Service role can manage flow runs"
  ON flow_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Flow steps: Read access through flow_runs relationship
CREATE POLICY "Enterprise members can read flow steps"
  ON flow_steps FOR SELECT TO authenticated
  USING (
    flow_run_id IN (
      SELECT id FROM flow_runs WHERE enterprise_id IN (
        SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()
      )
    )
  );

-- Flow steps: Service role can manage
CREATE POLICY "Service role can manage flow steps"
  ON flow_steps FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Events: APPEND-ONLY enforcement
CREATE POLICY "No updates to events" 
  ON vera.events FOR UPDATE USING (false);
CREATE POLICY "No deletes from events" 
  ON vera.events FOR DELETE USING (false);
CREATE POLICY "Service role can insert events" 
  ON vera.events FOR INSERT TO service_role 
  WITH CHECK (true);
CREATE POLICY "Authenticated can read own enterprise events" 
  ON vera.events FOR SELECT TO authenticated
  USING (
    aggregate_id IN (
      SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()
    )
    OR
    aggregate_id IN (
      SELECT id FROM flow_runs WHERE enterprise_id IN (
        SELECT enterprise_id FROM enterprise_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- PART 6: Grant Permissions
-- ============================================================================

GRANT USAGE ON SCHEMA vera TO authenticated, service_role;
GRANT SELECT ON flow_definitions TO authenticated;
GRANT SELECT ON flow_runs TO authenticated;
GRANT SELECT ON flow_steps TO authenticated;
GRANT SELECT ON vera.events TO authenticated;

GRANT ALL ON flow_definitions TO service_role;
GRANT ALL ON flow_runs TO service_role;
GRANT ALL ON flow_steps TO service_role;
GRANT ALL ON vera.events TO service_role;

-- ============================================================================
-- PART 7: Seed First Canonical Flow
-- ============================================================================

INSERT INTO flow_definitions (name, version, description, graph_definition) VALUES (
  'New-Tool-Approval',
  'v1.0',
  'Complete workflow for approving new AI tool usage by partners. Includes context analysis, policy evaluation, conflict detection, risk assessment, optional human review, and proof bundle generation.',
  '{
    "entryNode": "intake",
    "nodes": [
      {
        "id": "intake",
        "type": "agent",
        "agent": "context",
        "label": "Analyze Request Context",
        "config": {"action": "analyze"}
      },
      {
        "id": "policy_check",
        "type": "agent",
        "agent": "policy",
        "label": "Evaluate Policy Compliance",
        "config": {"action": "evaluate"}
      },
      {
        "id": "autonomy_check",
        "type": "agent",
        "agent": "vera-autonomy",
        "label": "Check Autonomy Level",
        "config": {"action": "resolve"}
      },
      {
        "id": "risk_gate",
        "type": "condition",
        "label": "Risk Level Decision",
        "config": {
          "field": "requires_human_review",
          "trueEdge": "human_review",
          "falseEdge": "create_seal"
        }
      },
      {
        "id": "human_review",
        "type": "human_gate",
        "label": "Human Approval Required",
        "config": {
          "assignTo": "compliance_manager",
          "timeout_hours": 48
        }
      },
      {
        "id": "create_seal",
        "type": "agent",
        "agent": "audit",
        "label": "Create Proof Bundle",
        "config": {"action": "generate_proof"}
      },
      {
        "id": "notify",
        "type": "agent",
        "agent": "inbox",
        "label": "Send Notifications",
        "config": {"action": "create_task", "taskType": "notification"}
      },
      {
        "id": "end",
        "type": "end",
        "label": "Flow Complete"
      }
    ],
    "edges": [
      {"from": "intake", "to": "policy_check"},
      {"from": "policy_check", "to": "autonomy_check"},
      {"from": "autonomy_check", "to": "risk_gate"},
      {"from": "risk_gate", "to": "human_review", "condition": "requires_human_review"},
      {"from": "risk_gate", "to": "create_seal", "condition": "!requires_human_review"},
      {"from": "human_review", "to": "create_seal"},
      {"from": "create_seal", "to": "notify"},
      {"from": "notify", "to": "end"}
    ]
  }'::jsonb
) ON CONFLICT (name, version) DO NOTHING;

-- Second canonical flow: Policy Change Simulation
INSERT INTO flow_definitions (name, version, description, graph_definition) VALUES (
  'Policy-Change-Simulation',
  'v1.0',
  'Simulate the impact of policy changes against historical traffic before deployment.',
  '{
    "entryNode": "load_draft",
    "nodes": [
      {
        "id": "load_draft",
        "type": "agent",
        "agent": "policy-definition",
        "label": "Load Draft Policy",
        "config": {"action": "load_draft"}
      },
      {
        "id": "fetch_history",
        "type": "agent",
        "agent": "simulation",
        "label": "Fetch Historical Requests",
        "config": {"action": "fetch_historical_data"}
      },
      {
        "id": "replay",
        "type": "agent",
        "agent": "simulation",
        "label": "Replay Against Draft",
        "config": {"action": "historical_replay"}
      },
      {
        "id": "analyze_impact",
        "type": "agent",
        "agent": "simulation",
        "label": "Analyze Decision Flips",
        "config": {"action": "analyze_impact"}
      },
      {
        "id": "end",
        "type": "end",
        "label": "Simulation Complete"
      }
    ],
    "edges": [
      {"from": "load_draft", "to": "fetch_history"},
      {"from": "fetch_history", "to": "replay"},
      {"from": "replay", "to": "analyze_impact"},
      {"from": "analyze_impact", "to": "end"}
    ]
  }'::jsonb
) ON CONFLICT (name, version) DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================

