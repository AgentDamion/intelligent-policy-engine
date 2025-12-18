-- Phase 2: Asset Declarations Table for Universal AI Asset Governance
-- This table stores deliverable declarations from partners, including file hashes,
-- AI tools used, compliance validation, and cryptographic proof bundles.

-- Create asset_declarations table
CREATE TABLE IF NOT EXISTS public.asset_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File information
  file_hash TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes BIGINT,
  file_type TEXT,
  
  -- Ownership and project context
  enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  project_id UUID REFERENCES public.policy_instances(id) ON DELETE SET NULL,
  
  -- Tool usage declaration
  tools_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  usage_description TEXT,
  
  -- Validation results
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('approved', 'rejected', 'pending')),
  validation_result JSONB,
  aggregated_risk_tier TEXT CHECK (aggregated_risk_tier IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  
  -- Proof bundle linkage
  proof_bundle_id UUID,
  proof_bundle_metadata JSONB,
  
  -- Role-based provenance
  declared_by_user_id UUID,
  role_credential TEXT,
  role_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_declarations_enterprise_id 
  ON public.asset_declarations(enterprise_id);

CREATE INDEX IF NOT EXISTS idx_asset_declarations_partner_id 
  ON public.asset_declarations(partner_id);

CREATE INDEX IF NOT EXISTS idx_asset_declarations_project_id 
  ON public.asset_declarations(project_id) 
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_declarations_file_hash 
  ON public.asset_declarations(file_hash);

CREATE INDEX IF NOT EXISTS idx_asset_declarations_validation_status 
  ON public.asset_declarations(validation_status);

CREATE INDEX IF NOT EXISTS idx_asset_declarations_declared_at 
  ON public.asset_declarations(declared_at DESC);

CREATE INDEX IF NOT EXISTS idx_asset_declarations_enterprise_status 
  ON public.asset_declarations(enterprise_id, validation_status);

-- Enable Row Level Security
ALTER TABLE public.asset_declarations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Partners can view their own declarations
CREATE POLICY "Partners can view their own asset declarations"
  ON public.asset_declarations
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id 
      FROM public.partner_api_keys 
      WHERE enterprise_id IN (
        SELECT enterprise_id 
        FROM public.enterprise_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Partners can create declarations for their enterprises
CREATE POLICY "Partners can create asset declarations"
  ON public.asset_declarations
  FOR INSERT
  WITH CHECK (
    enterprise_id IN (
      SELECT enterprise_id 
      FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Enterprises can view all declarations for their projects
CREATE POLICY "Enterprises can view asset declarations for their projects"
  ON public.asset_declarations
  FOR SELECT
  USING (
    enterprise_id IN (
      SELECT enterprise_id 
      FROM public.enterprise_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Enterprise admins can update validation status
CREATE POLICY "Enterprise admins can update asset declarations"
  ON public.asset_declarations
  FOR UPDATE
  USING (
    enterprise_id IN (
      SELECT em.enterprise_id 
      FROM public.enterprise_members em
      WHERE em.user_id = auth.uid() 
        AND em.role IN ('admin', 'owner')
    )
  );

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_asset_declarations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_asset_declarations_updated_at
  BEFORE UPDATE ON public.asset_declarations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_asset_declarations_updated_at();

-- Analytics View: Asset Declaration Summary for dashboards
CREATE OR REPLACE VIEW public.asset_declaration_summary AS
SELECT 
  ad.enterprise_id,
  ad.partner_id,
  ad.project_id,
  ad.validation_status,
  ad.aggregated_risk_tier,
  COUNT(*) as declaration_count,
  COUNT(DISTINCT ad.file_hash) as unique_files,
  COUNT(*) FILTER (WHERE ad.validation_status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE ad.validation_status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE ad.validation_status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE ad.aggregated_risk_tier = 'CRITICAL') as critical_risk_count,
  COUNT(*) FILTER (WHERE ad.aggregated_risk_tier = 'HIGH') as high_risk_count,
  MAX(ad.declared_at) as last_declaration_at,
  MIN(ad.declared_at) as first_declaration_at
FROM public.asset_declarations ad
GROUP BY 
  ad.enterprise_id, 
  ad.partner_id, 
  ad.project_id, 
  ad.validation_status, 
  ad.aggregated_risk_tier;

-- Grant appropriate permissions
GRANT SELECT ON public.asset_declaration_summary TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.asset_declarations IS 'Universal AI Asset Governance: Stores deliverable declarations from partners with tool usage, compliance validation, and cryptographic proof bundles';
COMMENT ON COLUMN public.asset_declarations.file_hash IS 'SHA-256 hash of the deliverable file for integrity verification';
COMMENT ON COLUMN public.asset_declarations.tools_used IS 'JSONB array of AI tools used: [{tool_id, tool_name, how_used}]';
COMMENT ON COLUMN public.asset_declarations.validation_status IS 'Compliance validation result: approved, rejected, or pending';
COMMENT ON COLUMN public.asset_declarations.proof_bundle_metadata IS 'Cryptographic proof bundle metadata including tool_declaration_hash, tools_declared, asset_file_hash';
COMMENT ON COLUMN public.asset_declarations.role_credential IS 'OpenID4VC role credential used for declaration (for provenance tracking)';