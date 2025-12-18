-- Priority 4: Add workspace_id column for direct workspace scoping
ALTER TABLE public.asset_declarations 
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_declarations_partner_enterprise 
  ON public.asset_declarations(partner_id, enterprise_id);

CREATE INDEX IF NOT EXISTS idx_asset_declarations_workspace_id 
  ON public.asset_declarations(workspace_id) 
  WHERE workspace_id IS NOT NULL;

-- Priority 3: Add workspace context RLS policy
DROP POLICY IF EXISTS "Workspace members can view workspace declarations" ON public.asset_declarations;
CREATE POLICY "Workspace members can view workspace declarations"
  ON public.asset_declarations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Helper function for setting session context (Priority 3)
CREATE OR REPLACE FUNCTION public.set_current_context(
  p_partner_id UUID,
  p_enterprise_id UUID
) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_partner_id', p_partner_id::text, false);
  PERFORM set_config('app.current_enterprise_id', p_enterprise_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_current_context TO authenticated;

-- Add context-aware RLS policy for partners (Priority 3)
DROP POLICY IF EXISTS "Partners can view declarations for current client context" ON public.asset_declarations;
CREATE POLICY "Partners can view declarations for current client context"
  ON public.asset_declarations
  FOR SELECT
  USING (
    partner_id IN (
      SELECT pak.partner_id 
      FROM public.partner_api_keys pak
      WHERE pak.partner_id = COALESCE(
        (current_setting('app.current_partner_id', true))::uuid,
        asset_declarations.partner_id
      )
      AND pak.enterprise_id = COALESCE(
        (current_setting('app.current_enterprise_id', true))::uuid,
        asset_declarations.enterprise_id
      )
    )
  );

COMMENT ON COLUMN public.asset_declarations.workspace_id IS 
  'Optional workspace context for multi-workspace enterprises. Enables direct workspace-level scoping without complex joins.';