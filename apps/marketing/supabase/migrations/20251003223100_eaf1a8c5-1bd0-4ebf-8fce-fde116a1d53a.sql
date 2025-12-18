-- Add distribution_type column to policy_distributions table
-- This is required by rpc_get_rfp_distributions function

ALTER TABLE public.policy_distributions 
ADD COLUMN IF NOT EXISTS distribution_type TEXT DEFAULT 'policy_request';

-- Backfill any existing NULL values
UPDATE public.policy_distributions 
SET distribution_type = 'policy_request' 
WHERE distribution_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.policy_distributions.distribution_type IS 
'Type of distribution: policy_request, rfp, or other distribution types';