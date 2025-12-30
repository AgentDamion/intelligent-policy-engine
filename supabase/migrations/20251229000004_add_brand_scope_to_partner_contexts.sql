-- Migration: 20251229000004_add_brand_scope_to_partner_contexts.sql
-- Purpose: Add brand_scope column to partner_client_contexts
-- Context Graph Phase 1: Boundary Governance Foundation
--
-- This enables enterprise-specific brand access control:
-- - NULL = all brands for this relationship
-- - Array of brand IDs = limited to specific brands
-- Prevents cross-brand data leakage in multi-brand enterprises

BEGIN;

-- ============================================================
-- PART 0: Create partner_client_contexts if it doesn't exist
-- ============================================================

CREATE TABLE IF NOT EXISTS public.partner_client_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  client_enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, partner_enterprise_id, client_enterprise_id)
);

-- Create indexes if table was just created
CREATE INDEX IF NOT EXISTS idx_partner_client_contexts_user 
ON public.partner_client_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_client_contexts_partner 
ON public.partner_client_contexts(partner_enterprise_id);
CREATE INDEX IF NOT EXISTS idx_partner_client_contexts_client 
ON public.partner_client_contexts(client_enterprise_id);
CREATE INDEX IF NOT EXISTS idx_partner_client_contexts_active 
ON public.partner_client_contexts(is_active) WHERE is_active = true;

-- ============================================================
-- PART 1: Add brand_scope column to partner_client_contexts
-- ============================================================

ALTER TABLE public.partner_client_contexts
ADD COLUMN IF NOT EXISTS brand_scope TEXT[];

COMMENT ON COLUMN public.partner_client_contexts.brand_scope IS 
'Array of brand IDs this user can access. NULL means all brands for this relationship.';

-- ============================================================
-- PART 2: Add index for brand_scope queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_partner_client_contexts_brand_scope 
ON public.partner_client_contexts USING gin(brand_scope);

-- ============================================================
-- PART 3: Helper function to check brand access
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_brand_access(
  p_user_id UUID,
  p_partner_enterprise_id UUID,
  p_client_enterprise_id UUID,
  p_brand_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.partner_client_contexts pcc
    WHERE pcc.user_id = p_user_id
      AND pcc.partner_enterprise_id = p_partner_enterprise_id
      AND pcc.client_enterprise_id = p_client_enterprise_id
      AND pcc.is_active = true
      AND (
        pcc.brand_scope IS NULL OR  -- NULL means all brands
        p_brand_id = ANY(pcc.brand_scope)
      )
  );
$$;

COMMENT ON FUNCTION public.user_has_brand_access IS 
'Checks if a user has access to a specific brand within a partner-client relationship.
Returns true if brand_scope is NULL (all brands) or if the brand is in the scope array.';

-- ============================================================
-- PART 4: Function to get accessible brands for a user
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_accessible_brands(
  p_user_id UUID,
  p_partner_enterprise_id UUID,
  p_client_enterprise_id UUID
)
RETURNS TABLE (
  brand_id TEXT,
  is_full_access BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH context AS (
    SELECT brand_scope
    FROM public.partner_client_contexts
    WHERE user_id = p_user_id
      AND partner_enterprise_id = p_partner_enterprise_id
      AND client_enterprise_id = p_client_enterprise_id
      AND is_active = true
    LIMIT 1
  )
  SELECT 
    UNNEST(
      COALESCE(
        (SELECT brand_scope FROM context),
        -- If NULL, return placeholder indicating full access
        ARRAY['*']::TEXT[]
      )
    ) as brand_id,
    (SELECT brand_scope FROM context) IS NULL as is_full_access;
$$;

COMMENT ON FUNCTION public.get_user_accessible_brands IS 
'Returns the list of brands a user can access within a partner-client relationship.
Returns ["*"] with is_full_access=true if user has access to all brands.';

-- ============================================================
-- PART 5: Enable RLS on partner_client_contexts
-- ============================================================

ALTER TABLE public.partner_client_contexts ENABLE ROW LEVEL SECURITY;

-- Users can view their own contexts
DROP POLICY IF EXISTS "partner_client_contexts_user_read" ON public.partner_client_contexts;
CREATE POLICY "partner_client_contexts_user_read"
ON public.partner_client_contexts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role has full access
DROP POLICY IF EXISTS "partner_client_contexts_service_role" ON public.partner_client_contexts;
CREATE POLICY "partner_client_contexts_service_role"
ON public.partner_client_contexts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

