-- Drop and recreate RPC to include submission info and latest overall_score
DROP FUNCTION IF EXISTS public.rpc_get_rfp_distributions(UUID);

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
  response_status TEXT,
  submission_id UUID,
  submitted_at TIMESTAMP WITH TIME ZONE,
  overall_score INTEGER
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
    p.title as policy_name,
    pv.version_number as policy_version,
    COUNT(rql.id) as questions_count,
    COALESCE(s.status, 'pending') as response_status,
    s.id as submission_id,
    s.submitted_at,
    (
      SELECT sc.overall_score
      FROM public.scores sc
      WHERE sc.submission_id = s.id
      ORDER BY sc.created_at DESC
      LIMIT 1
    ) as overall_score
  FROM public.policy_distributions pd
  JOIN public.policy_versions pv ON pv.id = pd.policy_version_id
  JOIN public.policies p ON p.id = pv.policy_id
  LEFT JOIN public.rfp_question_library rql ON rql.distribution_id = pd.id
  LEFT JOIN public.submissions s ON s.policy_version_id = pd.policy_version_id 
    AND s.workspace_id = pd.target_workspace_id
    AND s.submission_type = 'rfp_response'
  WHERE pd.target_workspace_id = p_workspace_id
  GROUP BY pd.id, pv.id, p.id, s.id, s.status
  ORDER BY pd.response_deadline ASC;
END;
$$;