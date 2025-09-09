-- Add platform integration status tracking to agent_activities
ALTER TABLE agent_activities 
ADD COLUMN IF NOT EXISTS platform_integration_status TEXT DEFAULT 'pending' CHECK (platform_integration_status IN ('pending', 'triggered', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS platform_integration_job_id UUID,
ADD COLUMN IF NOT EXISTS platform_integration_error TEXT;

-- Create platform_integration_jobs table
CREATE TABLE IF NOT EXISTS platform_integration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES agent_activities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  request_data JSONB NOT NULL,
  result_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create platform_integration_logs table
CREATE TABLE IF NOT EXISTS platform_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform_config_id UUID NOT NULL REFERENCES platform_configurations(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('upload', 'metadata', 'download', 'delete')),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create platform_metrics table for monitoring
CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_activities_platform_integration_status 
  ON agent_activities(platform_integration_status);

CREATE INDEX IF NOT EXISTS idx_agent_activities_platform_integration_job_id 
  ON agent_activities(platform_integration_job_id);

CREATE INDEX IF NOT EXISTS idx_platform_integration_jobs_organization_id 
  ON platform_integration_jobs(organization_id);

CREATE INDEX IF NOT EXISTS idx_platform_integration_jobs_status 
  ON platform_integration_jobs(status);

CREATE INDEX IF NOT EXISTS idx_platform_integration_jobs_priority 
  ON platform_integration_jobs(priority);

CREATE INDEX IF NOT EXISTS idx_platform_integration_jobs_created_at 
  ON platform_integration_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_platform_integration_logs_organization_id 
  ON platform_integration_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_platform_integration_logs_platform_config_id 
  ON platform_integration_logs(platform_config_id);

CREATE INDEX IF NOT EXISTS idx_platform_integration_logs_status 
  ON platform_integration_logs(status);

CREATE INDEX IF NOT EXISTS idx_platform_integration_logs_created_at 
  ON platform_integration_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_organization_id 
  ON platform_metrics(organization_id);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_platform_type 
  ON platform_metrics(platform_type);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_recorded_at 
  ON platform_metrics(recorded_at);

-- RLS policies
ALTER TABLE platform_integration_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

-- Platform integration jobs RLS
CREATE POLICY "Users can view their organization's platform integration jobs" 
  ON platform_integration_jobs FOR SELECT 
  USING (organization_id IN (
    SELECT id FROM organizations WHERE id = auth.jwt() ->> 'organization_id'
  ));

CREATE POLICY "Service role can manage platform integration jobs" 
  ON platform_integration_jobs FOR ALL 
  USING (auth.role() = 'service_role');

-- Platform integration logs RLS
CREATE POLICY "Users can view their organization's platform integration logs" 
  ON platform_integration_logs FOR SELECT 
  USING (organization_id IN (
    SELECT id FROM organizations WHERE id = auth.jwt() ->> 'organization_id'
  ));

CREATE POLICY "Service role can manage platform integration logs" 
  ON platform_integration_logs FOR ALL 
  USING (auth.role() = 'service_role');

-- Platform metrics RLS
CREATE POLICY "Users can view their organization's platform metrics" 
  ON platform_metrics FOR SELECT 
  USING (organization_id IN (
    SELECT id FROM organizations WHERE id = auth.jwt() ->> 'organization_id'
  ));

CREATE POLICY "Service role can manage platform metrics" 
  ON platform_metrics FOR ALL 
  USING (auth.role() = 'service_role');

-- Update trigger for platform_integration_jobs
CREATE OR REPLACE FUNCTION update_platform_integration_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platform_integration_jobs_updated_at
  BEFORE UPDATE ON platform_integration_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_integration_jobs_updated_at();

-- Function to clean up old integration logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_platform_integration_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM platform_integration_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old platform metrics (older than 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_platform_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM platform_metrics 
  WHERE recorded_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;