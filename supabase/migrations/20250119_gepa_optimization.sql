-- GEPA Optimization Schema (JavaScript-Native Version)
-- Created: 2025-01-19

-- ============================================
-- 1. Agent Prompts Storage
-- ============================================
CREATE TABLE agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  prompt_version INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  few_shot_examples JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  
  -- Optimization metadata
  parent_prompt_id UUID REFERENCES agent_prompts(id),
  optimization_run_id UUID,
  improvement_percentage NUMERIC(5,2),
  
  UNIQUE(agent_type, prompt_version)
);

CREATE INDEX idx_agent_prompts_active ON agent_prompts(agent_type, is_active);
CREATE INDEX idx_agent_prompts_version ON agent_prompts(agent_type, prompt_version DESC);

ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "admin_prompts_access" ON agent_prompts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND business_role IN ('founder', 'admin')
    )
  );

-- ============================================
-- 2. Optimization Runs
-- ============================================
CREATE TABLE optimization_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Configuration
  training_examples_count INTEGER,
  test_examples_count INTEGER,
  
  -- Results
  baseline_score NUMERIC(5,4),
  improved_score NUMERIC(5,4),
  improvement_percentage NUMERIC(5,2),
  best_prompt_id UUID REFERENCES agent_prompts(id),
  
  -- Metadata
  failure_analysis JSONB DEFAULT '{}',
  cost_estimate_usd NUMERIC(6,2),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_optimization_runs_agent ON optimization_runs(agent_type, started_at DESC);
CREATE INDEX idx_optimization_runs_status ON optimization_runs(status);

ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_optimization_access" ON optimization_runs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND business_role IN ('founder', 'admin')
    )
  );

-- ============================================
-- 3. Prompt Reflections (GPT-4 Analysis)
-- ============================================
CREATE TABLE prompt_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_run_id UUID NOT NULL REFERENCES optimization_runs(id),
  parent_prompt_id UUID REFERENCES agent_prompts(id),
  
  -- GPT-4 reflection content
  diagnosis TEXT NOT NULL,
  key_issues JSONB DEFAULT '[]',
  proposed_changes TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  
  -- Results
  resulting_prompt_id UUID REFERENCES agent_prompts(id),
  
  -- Example context
  failure_examples JSONB DEFAULT '[]',
  success_examples JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_run ON prompt_reflections(optimization_run_id);

ALTER TABLE prompt_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_reflections_access" ON prompt_reflections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND business_role IN ('founder', 'admin')
    )
  );

-- ============================================
-- 4. Extend Existing Tables
-- ============================================

-- Track which prompt version each activity used
ALTER TABLE agent_activities 
  ADD COLUMN IF NOT EXISTS prompt_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS used_for_training BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_agent_activities_training 
  ON agent_activities(agent_name, used_for_training, created_at DESC);

-- Link audit events to optimizations
ALTER TABLE audit_entries
  ADD COLUMN IF NOT EXISTS optimization_related BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS optimization_run_id UUID REFERENCES optimization_runs(id);

-- ============================================
-- 5. Helper Functions
-- ============================================

-- Get active prompt for an agent
CREATE OR REPLACE FUNCTION get_active_prompt(p_agent_type TEXT)
RETURNS TABLE (
  id UUID,
  system_prompt TEXT,
  user_prompt_template TEXT,
  prompt_version INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.system_prompt,
    ap.user_prompt_template,
    ap.prompt_version
  FROM agent_prompts ap
  WHERE ap.agent_type = p_agent_type
    AND ap.is_active = TRUE
  LIMIT 1;
END;
$$;

-- Activate a prompt (deactivate others)
CREATE OR REPLACE FUNCTION activate_prompt(
  p_prompt_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agent_type TEXT;
BEGIN
  -- Get agent type
  SELECT agent_type INTO v_agent_type
  FROM agent_prompts
  WHERE id = p_prompt_id;
  
  -- Deactivate current
  UPDATE agent_prompts
  SET is_active = FALSE,
      deprecated_at = NOW()
  WHERE agent_type = v_agent_type
    AND is_active = TRUE;
  
  -- Activate new
  UPDATE agent_prompts
  SET is_active = TRUE,
      activated_at = NOW()
  WHERE id = p_prompt_id;
  
  -- Log audit event
  INSERT INTO audit_entries (
    event_type,
    metadata,
    user_id,
    optimization_related
  ) VALUES (
    'prompt_activated',
    jsonb_build_object(
      'prompt_id', p_prompt_id,
      'agent_type', v_agent_type
    ),
    p_user_id,
    TRUE
  );
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_prompt TO authenticated;
GRANT EXECUTE ON FUNCTION activate_prompt TO authenticated;
