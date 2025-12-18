-- Add enterprise/workspace ownership to platform_configurations
ALTER TABLE public.platform_configurations 
ADD COLUMN IF NOT EXISTS enterprise_id uuid REFERENCES public.enterprises(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS agency_workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_enterprise_id uuid REFERENCES public.enterprises(id) ON DELETE SET NULL;

COMMENT ON COLUMN platform_configurations.enterprise_id IS 'Enterprise that owns this configuration';
COMMENT ON COLUMN platform_configurations.workspace_id IS 'Workspace context for this configuration';
COMMENT ON COLUMN platform_configurations.agency_workspace_id IS 'Agency workspace managing this config (if applicable)';
COMMENT ON COLUMN platform_configurations.client_enterprise_id IS 'Client enterprise for agency-managed configs';

-- Create platform document syncs tracking table
CREATE TABLE IF NOT EXISTS public.platform_document_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_config_id uuid NOT NULL REFERENCES public.platform_configurations(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('submission', 'policy', 'policy_version', 'evidence')),
  document_id uuid NOT NULL,
  sync_status text NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
  platform_document_id text,
  platform_url text,
  synced_at timestamp with time zone,
  sync_error text,
  retry_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_platform_document_syncs_config ON platform_document_syncs(platform_config_id);
CREATE INDEX idx_platform_document_syncs_document ON platform_document_syncs(document_type, document_id);
CREATE INDEX idx_platform_document_syncs_status ON platform_document_syncs(sync_status);

COMMENT ON TABLE platform_document_syncs IS 'Tracks individual document syncs to external platforms';

-- Add auto-sync trigger configuration to approval workflows
ALTER TABLE public.approval_workflows
ADD COLUMN IF NOT EXISTS auto_sync_platforms jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN approval_workflows.auto_sync_platforms IS 'Array of platform_config_ids to auto-sync when workflow completes';

-- Add sync metadata to submissions and policies
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS platform_sync_status jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.policies
ADD COLUMN IF NOT EXISTS platform_sync_status jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN submissions.platform_sync_status IS 'Status of syncs to various platforms {platform_config_id: {status, synced_at}}';
COMMENT ON COLUMN policies.platform_sync_status IS 'Status of syncs to various platforms {platform_config_id: {status, synced_at}}';