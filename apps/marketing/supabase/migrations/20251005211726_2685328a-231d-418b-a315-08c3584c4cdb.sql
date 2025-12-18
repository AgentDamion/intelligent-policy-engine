-- Create platform_configurations table
CREATE TABLE public.platform_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL,
  platform_type TEXT NOT NULL CHECK (platform_type IN ('veeva', 'sharepoint', 'box', 'documentum', 'other')),
  platform_name TEXT NOT NULL,
  auth_method TEXT NOT NULL CHECK (auth_method IN ('oauth', 'api_key', 'basic_auth', 'saml')),
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  endpoint_url TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'testing')),
  last_connection_test TIMESTAMP WITH TIME ZONE,
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_schedule JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create platform_integration_logs table
CREATE TABLE public.platform_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL,
  platform_config_id UUID REFERENCES public.platform_configurations(id) ON DELETE CASCADE,
  platform_type TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('sync', 'test', 'upload', 'download', 'delete')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'success', 'failed', 'partial')),
  submission_id UUID,
  file_name TEXT,
  file_size BIGINT,
  files_processed INTEGER DEFAULT 0,
  files_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  duration_ms INTEGER,
  triggered_by UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.platform_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_integration_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_platform_configs_enterprise ON public.platform_configurations(enterprise_id);
CREATE INDEX idx_platform_configs_status ON public.platform_configurations(status);
CREATE INDEX idx_integration_logs_enterprise ON public.platform_integration_logs(enterprise_id);
CREATE INDEX idx_integration_logs_platform_config ON public.platform_integration_logs(platform_config_id);
CREATE INDEX idx_integration_logs_status ON public.platform_integration_logs(status);
CREATE INDEX idx_integration_logs_created_at ON public.platform_integration_logs(created_at DESC);

-- RLS Policies for platform_configurations
-- Enterprise members can view configurations
CREATE POLICY "Enterprise members can view platform configurations"
ON public.platform_configurations
FOR SELECT
USING (
  enterprise_id IN (
    SELECT enterprise_id 
    FROM enterprise_members 
    WHERE user_id = auth.uid()
  )
);

-- Enterprise admins can insert configurations
CREATE POLICY "Enterprise admins can create platform configurations"
ON public.platform_configurations
FOR INSERT
WITH CHECK (
  enterprise_id IN (
    SELECT em.enterprise_id 
    FROM enterprise_members em
    WHERE em.user_id = auth.uid()
    AND em.role IN ('admin', 'owner')
  )
);

-- Enterprise admins can update configurations
CREATE POLICY "Enterprise admins can update platform configurations"
ON public.platform_configurations
FOR UPDATE
USING (
  enterprise_id IN (
    SELECT em.enterprise_id 
    FROM enterprise_members em
    WHERE em.user_id = auth.uid()
    AND em.role IN ('admin', 'owner')
  )
);

-- Enterprise admins can delete configurations
CREATE POLICY "Enterprise admins can delete platform configurations"
ON public.platform_configurations
FOR DELETE
USING (
  enterprise_id IN (
    SELECT em.enterprise_id 
    FROM enterprise_members em
    WHERE em.user_id = auth.uid()
    AND em.role IN ('admin', 'owner')
  )
);

-- RLS Policies for platform_integration_logs
-- Enterprise members can view integration logs
CREATE POLICY "Enterprise members can view integration logs"
ON public.platform_integration_logs
FOR SELECT
USING (
  enterprise_id IN (
    SELECT enterprise_id 
    FROM enterprise_members 
    WHERE user_id = auth.uid()
  )
);

-- System can insert integration logs (for edge functions)
CREATE POLICY "Authenticated users can create integration logs"
ON public.platform_integration_logs
FOR INSERT
WITH CHECK (
  enterprise_id IN (
    SELECT enterprise_id 
    FROM enterprise_members 
    WHERE user_id = auth.uid()
  )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_platform_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_platform_configurations_updated_at
BEFORE UPDATE ON public.platform_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_platform_config_updated_at();