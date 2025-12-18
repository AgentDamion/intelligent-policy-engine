-- Three-Stage Risk Scoring System Migration
-- Creates tables for Pre-Run/In-Run/Post-Run risk assessment

-- Core Enums
CREATE TYPE stage_t AS ENUM ('pre_run', 'in_run', 'post_run');
CREATE TYPE risk_band_t AS ENUM ('low', 'medium', 'high');

-- Workflows table (extends submissions with risk tracking)
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Tool context
  tool_name TEXT,
  vendor_name TEXT,
  tool_metadata JSONB DEFAULT '{}',
  
  -- Pharma-specific context
  brand TEXT,
  market TEXT,
  therapeutic_area TEXT,
  data_classification TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT workflows_unique_submission UNIQUE(submission_id)
);

-- Policy Controls (Pre-Run scoring factors)
CREATE TABLE policy_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  
  control_key TEXT NOT NULL,
  stage stage_t NOT NULL DEFAULT 'pre_run',
  
  points INT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  
  metadata JSONB NOT NULL DEFAULT '{}',
  evidence_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence Events (In-Run live telemetry)
CREATE TABLE evidence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  
  stage stage_t NOT NULL DEFAULT 'in_run',
  event_type TEXT NOT NULL,
  delta_points INT NOT NULL,
  
  payload JSONB NOT NULL DEFAULT '{}',
  triggered_by UUID REFERENCES profiles(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post-Run Outcomes
CREATE TABLE postrun_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  
  outcome_key TEXT NOT NULL,
  points INT NOT NULL,
  
  details JSONB DEFAULT '{}',
  recorded_by UUID REFERENCES profiles(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Scores (Materialized results)
CREATE TABLE risk_scores (
  workflow_id UUID PRIMARY KEY REFERENCES workflows(id) ON DELETE CASCADE,
  
  pre_run INT NOT NULL DEFAULT 0,
  in_run INT NOT NULL DEFAULT 0,
  post_run INT NOT NULL DEFAULT 0,
  
  total INT NOT NULL DEFAULT 0,
  band risk_band_t NOT NULL DEFAULT 'medium',
  
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weights Configuration
CREATE TABLE risk_weights (
  id BOOL PRIMARY KEY DEFAULT TRUE,
  w_pre NUMERIC NOT NULL DEFAULT 0.4,
  w_in NUMERIC NOT NULL DEFAULT 0.4,
  w_post NUMERIC NOT NULL DEFAULT 0.2,
  
  vendor_security_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  regulatory_compliance_multiplier NUMERIC NOT NULL DEFAULT 1.3,
  
  CHECK (id = TRUE)
);
INSERT INTO risk_weights (id) VALUES (TRUE) ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX idx_workflows_submission ON workflows(submission_id);
CREATE INDEX idx_workflows_enterprise ON workflows(enterprise_id);
CREATE INDEX idx_policy_controls_workflow ON policy_controls(workflow_id);
CREATE INDEX idx_evidence_events_workflow ON evidence_events(workflow_id);
CREATE INDEX idx_evidence_events_occurred ON evidence_events(occurred_at DESC);
CREATE INDEX idx_postrun_outcomes_workflow ON postrun_outcomes(workflow_id);

-- Recalculation Function
CREATE OR REPLACE FUNCTION recalc_risk_score(p_workflow UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pre INT; v_in INT; v_post INT; v_total INT; v_band risk_band_t;
  w_pre NUMERIC; w_in NUMERIC; w_post NUMERIC;
  v_vendor_mult NUMERIC; v_reg_mult NUMERIC;
BEGIN
  SELECT 
    w_pre, w_in, w_post, 
    vendor_security_multiplier, 
    regulatory_compliance_multiplier
  INTO w_pre, w_in, w_post, v_vendor_mult, v_reg_mult
  FROM risk_weights;
  
  SELECT COALESCE(SUM(
    CASE 
      WHEN pc.control_key LIKE '%vendor_security%' THEN (pc.points * pc.weight * v_vendor_mult)::INT
      WHEN pc.control_key LIKE '%regulatory%' THEN (pc.points * pc.weight * v_reg_mult)::INT
      ELSE (pc.points * pc.weight)::INT
    END
  ), 0)
  INTO v_pre
  FROM policy_controls pc
  WHERE pc.workflow_id = p_workflow AND pc.stage = 'pre_run';
  
  v_pre := LEAST(v_pre, 100);
  
  SELECT COALESCE(SUM(ee.delta_points), 0)
  INTO v_in
  FROM evidence_events ee
  WHERE ee.workflow_id = p_workflow AND ee.stage = 'in_run';
  
  v_in := GREATEST(LEAST(v_in, 50), -50);
  
  SELECT COALESCE(SUM(po.points), 0)
  INTO v_post
  FROM postrun_outcomes po
  WHERE po.workflow_id = p_workflow;
  
  v_post := LEAST(v_post, 100);
  
  v_total := ROUND(w_pre * v_pre + w_in * v_in + w_post * v_post);
  v_total := GREATEST(LEAST(v_total, 100), 0);
  
  v_band := CASE
    WHEN v_total >= 75 THEN 'low'::risk_band_t
    WHEN v_total >= 50 THEN 'medium'::risk_band_t
    ELSE 'high'::risk_band_t
  END;
  
  INSERT INTO risk_scores (workflow_id, pre_run, in_run, post_run, total, band, last_calculated_at, updated_at)
  VALUES (p_workflow, v_pre, v_in, v_post, v_total, v_band, NOW(), NOW())
  ON CONFLICT (workflow_id) DO UPDATE
    SET pre_run = EXCLUDED.pre_run,
        in_run = EXCLUDED.in_run,
        post_run = EXCLUDED.post_run,
        total = EXCLUDED.total,
        band = EXCLUDED.band,
        last_calculated_at = NOW(),
        updated_at = NOW();
END $$;

-- Trigger function
CREATE OR REPLACE FUNCTION trg_recalc_on_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM recalc_risk_score(NEW.workflow_id);
  RETURN NEW;
END $$;

CREATE TRIGGER t_policy_controls_after_ins
AFTER INSERT ON policy_controls
FOR EACH ROW EXECUTE FUNCTION trg_recalc_on_change();

CREATE TRIGGER t_evidence_events_after_ins
AFTER INSERT ON evidence_events
FOR EACH ROW EXECUTE FUNCTION trg_recalc_on_change();

CREATE TRIGGER t_postrun_outcomes_after_ins
AFTER INSERT ON postrun_outcomes
FOR EACH ROW EXECUTE FUNCTION trg_recalc_on_change();

CREATE OR REPLACE FUNCTION trg_workflow_create_risk_score()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO risk_scores (workflow_id) VALUES (NEW.id);
  RETURN NEW;
END $$;

CREATE TRIGGER t_workflows_after_ins
AFTER INSERT ON workflows
FOR EACH ROW EXECUTE FUNCTION trg_workflow_create_risk_score();

-- RLS Policies
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE postrun_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflows_workspace_access ON workflows
FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

CREATE POLICY policy_controls_via_workflow ON policy_controls
FOR ALL USING (
  workflow_id IN (
    SELECT id FROM workflows 
    WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY evidence_events_via_workflow ON evidence_events
FOR ALL USING (
  workflow_id IN (
    SELECT id FROM workflows 
    WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY postrun_outcomes_via_workflow ON postrun_outcomes
FOR ALL USING (
  workflow_id IN (
    SELECT id FROM workflows 
    WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY risk_scores_via_workflow ON risk_scores
FOR SELECT USING (
  workflow_id IN (
    SELECT id FROM workflows 
    WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  )
);