-- Create rfp_question_library table for parsed external RFIs
CREATE TABLE IF NOT EXISTS public.rfp_question_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES public.policy_distributions(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text',
  required_evidence TEXT[] DEFAULT '{}',
  is_mandatory BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rfp_question_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rfp_question_library
CREATE POLICY "Users can view RFP questions for their workspace distributions"
  ON public.rfp_question_library
  FOR SELECT
  USING (
    distribution_id IN (
      SELECT id FROM public.policy_distributions pd
      WHERE pd.target_workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage RFP questions"
  ON public.rfp_question_library
  FOR ALL
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rfp_questions_distribution ON public.rfp_question_library(distribution_id);
CREATE INDEX IF NOT EXISTS idx_rfp_questions_section ON public.rfp_question_library(distribution_id, section);

-- RPC function: Get RFP badges with timezone-safe urgency
CREATE OR REPLACE FUNCTION public.rpc_get_rfp_badges(p_workspace_id UUID)
RETURNS TABLE(
  distribution_id UUID,
  badge_text TEXT,
  badge_variant TEXT,
  urgency_score INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.id as distribution_id,
    CASE 
      WHEN pd.response_deadline < NOW() THEN 'OVERDUE'
      WHEN pd.response_deadline < NOW() + INTERVAL '24 hours' THEN 'DUE SOON'
      WHEN pd.response_deadline < NOW() + INTERVAL '3 days' THEN 'DUE THIS WEEK'
      ELSE 'NEW'
    END as badge_text,
    CASE 
      WHEN pd.response_deadline < NOW() THEN 'destructive'
      WHEN pd.response_deadline < NOW() + INTERVAL '24 hours' THEN 'warning'
      WHEN pd.response_deadline < NOW() + INTERVAL '3 days' THEN 'default'
      ELSE 'secondary'
    END as badge_variant,
    CASE 
      WHEN pd.response_deadline < NOW() THEN 4
      WHEN pd.response_deadline < NOW() + INTERVAL '24 hours' THEN 3
      WHEN pd.response_deadline < NOW() + INTERVAL '3 days' THEN 2
      ELSE 1
    END as urgency_score
  FROM public.policy_distributions pd
  WHERE pd.target_workspace_id = p_workspace_id
  ORDER BY urgency_score DESC, pd.response_deadline ASC;
END;
$$;

-- RPC function: Bump draft version for autosave with conflict detection
CREATE OR REPLACE FUNCTION public.bump_draft_version(
  p_submission_id UUID,
  p_expected_version INTEGER,
  p_new_data JSONB
)
RETURNS TABLE(
  success BOOLEAN,
  new_version INTEGER,
  conflict_detected BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_version INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Get current version
  SELECT COALESCE((rfp_response_data->>'draft_version')::INTEGER, 0)
  INTO v_current_version
  FROM public.submissions
  WHERE id = p_submission_id;

  -- Check for version conflict
  IF v_current_version != p_expected_version THEN
    RETURN QUERY SELECT 
      false as success,
      v_current_version as new_version,
      true as conflict_detected,
      'Version conflict detected. Please refresh and try again.' as message;
    RETURN;
  END IF;

  -- Increment version
  v_new_version := v_current_version + 1;

  -- Update submission with new version and data
  UPDATE public.submissions
  SET 
    rfp_response_data = p_new_data || jsonb_build_object('draft_version', v_new_version),
    updated_at = NOW()
  WHERE id = p_submission_id
    AND workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    );

  -- Return success
  RETURN QUERY SELECT 
    true as success,
    v_new_version as new_version,
    false as conflict_detected,
    'Draft saved successfully' as message;
END;
$$;

-- RPC function: Get RFP distributions with metadata
CREATE OR REPLACE FUNCTION public.rpc_get_rfp_distributions(p_workspace_id UUID)
RETURNS TABLE(
  id UUID,
  policy_version_id UUID,
  target_workspace_id UUID,
  response_deadline TIMESTAMP WITH TIME ZONE,
  distribution_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  policy_name TEXT,
  policy_version INTEGER,
  questions_count BIGINT,
  response_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.id,
    pd.policy_version_id,
    pd.target_workspace_id,
    pd.response_deadline,
    pd.distribution_type,
    pd.metadata,
    pd.created_at,
    p.name as policy_name,
    pv.version_number as policy_version,
    COUNT(rql.id) as questions_count,
    COALESCE(s.status, 'pending') as response_status
  FROM public.policy_distributions pd
  JOIN public.policy_versions pv ON pv.id = pd.policy_version_id
  JOIN public.policies p ON p.id = pv.policy_id
  LEFT JOIN public.rfp_question_library rql ON rql.distribution_id = pd.id
  LEFT JOIN public.submissions s ON s.policy_version_id = pd.policy_version_id 
    AND s.workspace_id = pd.target_workspace_id
    AND s.submission_type = 'rfp_response'
  WHERE pd.target_workspace_id = p_workspace_id
  GROUP BY pd.id, pv.id, p.id, s.status
  ORDER BY pd.response_deadline ASC;
END;
$$;

-- RPC function: Get submission progress for RFP responses
CREATE OR REPLACE FUNCTION public.rpc_get_submission_progress(p_submission_id UUID)
RETURNS TABLE(
  total_questions INTEGER,
  answered_questions INTEGER,
  progress_percentage INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE,
  estimated_completion_time INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_answered INTEGER;
  v_progress INTEGER;
BEGIN
  -- Get question counts from rfp_response_data
  SELECT 
    COALESCE((rfp_response_data->>'total_questions')::INTEGER, 0),
    COALESCE(jsonb_array_length(COALESCE(rfp_response_data->'answers', '[]'::jsonb)), 0)
  INTO v_total, v_answered
  FROM public.submissions
  WHERE id = p_submission_id;

  -- Calculate progress percentage
  IF v_total > 0 THEN
    v_progress := (v_answered * 100 / v_total);
  ELSE
    v_progress := 0;
  END IF;

  RETURN QUERY
  SELECT 
    v_total as total_questions,
    v_answered as answered_questions,
    v_progress as progress_percentage,
    s.updated_at as last_updated,
    CASE 
      WHEN v_answered > 0 THEN 
        ((v_total - v_answered) * EXTRACT(EPOCH FROM (s.updated_at - s.created_at)) / v_answered / 60)::INTEGER
      ELSE 60
    END as estimated_completion_time
  FROM public.submissions s
  WHERE s.id = p_submission_id;
END;
$$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_rfp_question_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rfp_question_updated_at
  BEFORE UPDATE ON public.rfp_question_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rfp_question_updated_at();