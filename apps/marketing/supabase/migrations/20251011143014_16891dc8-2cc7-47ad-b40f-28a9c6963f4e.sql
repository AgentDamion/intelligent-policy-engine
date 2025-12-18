-- Fix sandbox_runs_masked view: Remove SECURITY DEFINER
-- This prevents potential RLS bypass and privilege escalation

-- Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.sandbox_runs_masked;

-- Recreate with SECURITY INVOKER (default, runs with caller's permissions)
CREATE VIEW public.sandbox_runs_masked
WITH (security_invoker = true)
AS
SELECT 
  id,
  workspace_id,
  created_by,
  created_at,
  updated_at,
  scenario_name,
  
  -- Mask sensitive internal data
  CASE 
    WHEN inputs_json ? 'internal_notes' THEN 
      inputs_json - 'internal_notes'
    ELSE inputs_json
  END AS inputs_json,
  
  CASE 
    WHEN outputs_json ? 'internal_analysis' THEN 
      outputs_json - 'internal_analysis'
    ELSE outputs_json
  END AS outputs_json,
  
  grade,
  risk_score,
  control_coverage,
  
  -- Redact proof hash for agency users
  NULL::text AS proof_hash,
  
  run_status,
  error_message
FROM public.sandbox_runs;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.sandbox_runs_masked IS 'Agency-safe view with redacted internal data - runs with caller permissions (SECURITY INVOKER)';