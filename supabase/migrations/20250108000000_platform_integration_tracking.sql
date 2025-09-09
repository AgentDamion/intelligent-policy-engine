-- Add platform integration tracking to agent activities
ALTER TABLE public.agent_activities 
ADD COLUMN IF NOT EXISTS platform_integration_status varchar(20) 
  DEFAULT 'pending' 
  CHECK (platform_integration_status IN ('pending', 'processing', 'completed', 'partial', 'failed', 'skipped'));

ALTER TABLE public.agent_activities
ADD COLUMN IF NOT EXISTS platform_integration_timestamp timestamptz;

ALTER TABLE public.agent_activities
ADD COLUMN IF NOT EXISTS platform_integration_results jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_activities_platform_status 
  ON public.agent_activities(platform_integration_status);

CREATE INDEX IF NOT EXISTS idx_agent_activities_platform_timestamp 
  ON public.agent_activities(platform_integration_timestamp);

-- Add trigger to set platform_integration_status to 'pending' on insert if compliance passed
CREATE OR REPLACE FUNCTION set_platform_integration_pending()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set to pending if there's compliance data indicating it passed
  IF (NEW.details->>'compliance_status' = 'compliant' OR 
      NEW.details->>'compliance_status' = 'warning') AND
     NEW.platform_integration_status IS NULL THEN
    NEW.platform_integration_status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_activities_platform_integration_trigger
  BEFORE INSERT ON public.agent_activities
  FOR EACH ROW
  EXECUTE FUNCTION set_platform_integration_pending();

-- Add function to get pending platform integrations
CREATE OR REPLACE FUNCTION get_pending_platform_integrations(
  org_id uuid,
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
  activity_id uuid,
  agent text,
  action text,
  project_id uuid,
  compliance_data jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.id as activity_id,
    aa.agent,
    aa.action,
    aa.project_id,
    aa.details as compliance_data,
    aa.created_at
  FROM public.agent_activities aa
  WHERE aa.enterprise_id = org_id
    AND aa.platform_integration_status = 'pending'
    AND aa.status IN ('success', 'warning')
  ORDER BY aa.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for new columns
-- (Assuming existing RLS policies will automatically apply to new columns)

-- Add comment
COMMENT ON COLUMN public.agent_activities.platform_integration_status IS 'Status of platform integration for this activity';
COMMENT ON COLUMN public.agent_activities.platform_integration_timestamp IS 'When platform integration was last processed';
COMMENT ON COLUMN public.agent_activities.platform_integration_results IS 'Results from platform integration attempts';