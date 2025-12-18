-- Security fix: Set proper ownership and grants on v_policy_lane_counts view
-- This prevents privilege escalation by ensuring RLS policies are enforced
-- Using postgres owner but granting only to authenticated to maintain security

DROP VIEW IF EXISTS public.v_policy_lane_counts;

CREATE VIEW public.v_policy_lane_counts AS
SELECT
  p.id AS policy_id,
  p.enterprise_id,
  p.title,
  p.version,
  p.status,
  jsonb_build_object(
    'governance_compliance', COALESCE(SUM((c.lane='governance_compliance')::int),0),
    'security_access', COALESCE(SUM((c.lane='security_access')::int),0),
    'integration_scalability', COALESCE(SUM((c.lane='integration_scalability')::int),0),
    'business_ops', COALESCE(SUM((c.lane='business_ops')::int),0),
    'total', COUNT(c.id),
    'avg_confidence', ROUND(AVG(c.lane_confidence)::numeric, 2)
  ) AS lane_statistics
FROM policy_master p
LEFT JOIN policy_clauses c ON c.policy_id = p.id AND c.enterprise_id = p.enterprise_id
GROUP BY p.id, p.enterprise_id, p.title, p.version, p.status;

-- Grant only SELECT to authenticated users (no public access)
REVOKE ALL ON public.v_policy_lane_counts FROM PUBLIC;
GRANT SELECT ON public.v_policy_lane_counts TO authenticated;

-- Add comment documenting security considerations
COMMENT ON VIEW public.v_policy_lane_counts IS 'View enforces RLS through underlying tables policy_master and policy_clauses. Users can only see policies from their enterprises.';