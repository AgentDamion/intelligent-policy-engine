-- ============================================
-- GEPA Optimization Schema (JavaScript-Native)
-- Created: 2025-10-19
-- Adapted for existing agent_activities schema
-- ============================================

-- ============================================
-- 1. Agent Prompts Storage
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_prompts (
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
  parent_prompt_id UUID REFERENCES public.agent_prompts(id),
  optimization_run_id UUID,
  improvement_percentage NUMERIC(5,2),
  
  UNIQUE(agent_type, prompt_version)
);

CREATE INDEX idx_agent_prompts_active ON public.agent_prompts(agent_type, is_active);
CREATE INDEX idx_agent_prompts_version ON public.agent_prompts(agent_type, prompt_version DESC);

ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY;

-- Admin-only access for prompts
CREATE POLICY "admin_prompts_access" ON public.agent_prompts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.enterprise_members 
      WHERE user_id = auth.uid() 
      AND business_role IN ('founder', 'admin')
    )
  );

-- Service role can manage all prompts
CREATE POLICY "service_role_prompts_access" ON public.agent_prompts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- 2. Optimization Runs
-- ============================================
CREATE TABLE IF NOT EXISTS public.optimization_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Configuration
  training_examples_count INTEGER,
  test_examples_count INTEGER,
  
  -- Results
  baseline_score NUMERIC(5,4),
  improved_score NUMERIC(5,4),
  improvement_percentage NUMERIC(5,2),
  best_prompt_id UUID REFERENCES public.agent_prompts(id),
  
  -- Metadata
  failure_analysis JSONB DEFAULT '{}',
  cost_estimate_usd NUMERIC(6,2),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_optimization_runs_agent ON public.optimization_runs(agent_type, started_at DESC);
CREATE INDEX idx_optimization_runs_status ON public.optimization_runs(status);

ALTER TABLE public.optimization_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_optimization_access" ON public.optimization_runs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.enterprise_members 
      WHERE user_id = auth.uid() 
      AND business_role IN ('founder', 'admin')
    )
  );

CREATE POLICY "service_role_optimization_access" ON public.optimization_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- 3. Prompt Reflections (GPT-4 Analysis)
-- ============================================
CREATE TABLE IF NOT EXISTS public.prompt_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_run_id UUID NOT NULL REFERENCES public.optimization_runs(id),
  parent_prompt_id UUID REFERENCES public.agent_prompts(id),
  
  -- GPT-4 reflection content
  diagnosis TEXT NOT NULL,
  key_issues JSONB DEFAULT '[]',
  proposed_changes TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  
  -- Results
  resulting_prompt_id UUID REFERENCES public.agent_prompts(id),
  
  -- Example context
  failure_examples JSONB DEFAULT '[]',
  success_examples JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_run ON public.prompt_reflections(optimization_run_id);

ALTER TABLE public.prompt_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_reflections_access" ON public.prompt_reflections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.enterprise_members 
      WHERE user_id = auth.uid() 
      AND business_role IN ('founder', 'admin')
    )
  );

CREATE POLICY "service_role_reflections_access" ON public.prompt_reflections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- 4. Helper Functions
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
  FROM public.agent_prompts ap
  WHERE ap.agent_type = p_agent_type
    AND ap.is_active = TRUE
  LIMIT 1;
END;
$$;

-- Activate a prompt (deactivate others)
CREATE OR REPLACE FUNCTION activate_prompt(
  p_prompt_id UUID,
  p_user_id UUID DEFAULT NULL
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
  FROM public.agent_prompts
  WHERE id = p_prompt_id;
  
  IF v_agent_type IS NULL THEN
    RAISE EXCEPTION 'Prompt not found: %', p_prompt_id;
  END IF;
  
  -- Deactivate current
  UPDATE public.agent_prompts
  SET is_active = FALSE,
      deprecated_at = NOW()
  WHERE agent_type = v_agent_type
    AND is_active = TRUE;
  
  -- Activate new
  UPDATE public.agent_prompts
  SET is_active = TRUE,
      activated_at = NOW()
  WHERE id = p_prompt_id;
  
  -- Log audit event if audit_entries table exists and user provided
  IF p_user_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.audit_entries (
        action_type,
        details,
        user_id
      ) VALUES (
        'prompt_activated',
        jsonb_build_object(
          'prompt_id', p_prompt_id,
          'agent_type', v_agent_type
        ),
        p_user_id
      );
    EXCEPTION WHEN OTHERS THEN
      -- Ignore audit logging errors
      NULL;
    END;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_prompt TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION activate_prompt TO authenticated, service_role;

-- ============================================
-- 5. Comments
-- ============================================

COMMENT ON TABLE public.agent_prompts IS 'Stores versioned agent prompts with performance tracking';
COMMENT ON TABLE public.optimization_runs IS 'Tracks prompt optimization runs and results';
COMMENT ON TABLE public.prompt_reflections IS 'Stores GPT-4 analysis and recommendations for prompt improvements';
COMMENT ON FUNCTION get_active_prompt IS 'Returns the currently active prompt for a given agent type';
COMMENT ON FUNCTION activate_prompt IS 'Activates a prompt version and deactivates others for the same agent';

