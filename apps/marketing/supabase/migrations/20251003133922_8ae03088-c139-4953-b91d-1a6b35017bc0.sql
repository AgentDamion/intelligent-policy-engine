-- Fix security linter warnings

-- Fix 1: Remove SECURITY DEFINER from view by creating it as a regular view
DROP VIEW IF EXISTS v_policy_lane_counts;

CREATE VIEW v_policy_lane_counts AS
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

-- Fix 2: Add search_path to update_policy_updated_at function
CREATE OR REPLACE FUNCTION update_policy_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;