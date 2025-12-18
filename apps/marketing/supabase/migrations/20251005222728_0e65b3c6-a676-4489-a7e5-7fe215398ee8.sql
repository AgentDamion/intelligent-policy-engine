-- Fix enum casting error in rpc_get_rfp_distributions by casting status to text before COALESCE
CREATE OR REPLACE FUNCTION public.rpc_get_rfp_distributions(p_workspace_id uuid)
RETURNS TABLE(
  id uuid,
  policy_version_id uuid,
  target_workspace_id uuid,
  response_deadline timestamp with time zone,
  distribution_type text,
  metadata jsonb,
  created_at timestamp with time zone,
  policy_name text,
  policy_version integer,
  questions_count bigint,
  response_status text,
  submission_id uuid,
  submitted_at timestamp with time zone,
  overall_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    COALESCE(s.status::text, 'pending') as response_status,
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
$function$;
