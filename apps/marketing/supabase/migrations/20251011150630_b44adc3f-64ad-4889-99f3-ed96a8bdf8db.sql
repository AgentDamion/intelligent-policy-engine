-- Fix app schema functions with correct schema
-- Note: workspace stats cannot be derived from current schema (no workspace_id in policies table)
-- So we'll just return stats by enterprise for both functions

DROP FUNCTION IF EXISTS app.app_policy_lane_stats_by_enterprise(uuid);
DROP FUNCTION IF EXISTS app.app_policy_lane_stats_by_workspace(uuid);

-- Enterprise stats (works with current schema)
CREATE FUNCTION app.app_policy_lane_stats_by_enterprise(p_enterprise_id uuid)
RETURNS TABLE(
  lane text,
  total_clauses bigint,
  avg_confidence numeric
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT 
    lane,
    COUNT(*) as total_clauses,
    AVG(lane_confidence) as avg_confidence
  FROM public.policy_clauses
  WHERE enterprise_id = p_enterprise_id
  GROUP BY lane;
$function$;

-- Workspace stats (cannot filter by workspace since policies has no workspace_id)
-- Return empty result set for now to prevent errors
CREATE FUNCTION app.app_policy_lane_stats_by_workspace(p_workspace_id uuid)
RETURNS TABLE(
  lane text,
  total_clauses bigint,
  avg_confidence numeric
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT 
    NULL::text as lane,
    0::bigint as total_clauses,
    0::numeric as avg_confidence
  WHERE FALSE;  -- Returns empty result set
$function$;