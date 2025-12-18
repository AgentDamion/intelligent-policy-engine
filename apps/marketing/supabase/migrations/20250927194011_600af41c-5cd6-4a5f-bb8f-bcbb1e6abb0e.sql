-- Add promotion fields to marketplace_tools table
ALTER TABLE marketplace_tools 
ADD COLUMN promotion_tier text DEFAULT 'standard' CHECK (promotion_tier IN ('standard', 'sponsored', 'featured')),
ADD COLUMN promotion_expires_at timestamp with time zone,
ADD COLUMN promotion_started_at timestamp with time zone,
ADD COLUMN promotion_analytics jsonb DEFAULT '{"impressions": 0, "clicks": 0, "conversions": 0}'::jsonb,
ADD COLUMN promotion_budget_spent numeric(10,2) DEFAULT 0.00,
ADD COLUMN promotion_daily_budget numeric(10,2);

-- Create vendor promotions table for payment tracking
CREATE TABLE vendor_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  tool_id bigint REFERENCES marketplace_tools(id) ON DELETE CASCADE,
  promotion_tier text NOT NULL CHECK (promotion_tier IN ('sponsored', 'featured')),
  amount_paid numeric(10,2) NOT NULL,
  duration_days integer NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  stripe_payment_intent_id text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  analytics_data jsonb DEFAULT '{"impressions": 0, "clicks": 0, "conversions": 0}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on vendor_promotions
ALTER TABLE vendor_promotions ENABLE ROW LEVEL SECURITY;

-- Create policy for vendors to manage their own promotions
CREATE POLICY "Vendors can manage their own promotions"
ON vendor_promotions
FOR ALL
TO authenticated
USING (
  vendor_id IN (
    SELECT p.id 
    FROM profiles p 
    WHERE p.id = auth.uid() AND p.account_type = 'partner'
  )
);

-- Create policy for viewing active promotions (for marketplace display)
CREATE POLICY "Anyone can view active promotions"
ON vendor_promotions
FOR SELECT
TO authenticated
USING (status = 'active' AND expires_at > now());

-- Create index for efficient promotion queries
CREATE INDEX idx_marketplace_tools_promotion ON marketplace_tools(promotion_tier, promotion_expires_at);
CREATE INDEX idx_vendor_promotions_active ON vendor_promotions(status, expires_at) WHERE status = 'active';

-- Create function to update promotion analytics
CREATE OR REPLACE FUNCTION update_promotion_analytics(
  p_tool_id bigint,
  p_event_type text,
  p_count integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update marketplace_tools analytics
  UPDATE marketplace_tools 
  SET promotion_analytics = jsonb_set(
    promotion_analytics,
    ARRAY[p_event_type],
    to_jsonb((promotion_analytics ->> p_event_type)::integer + p_count)
  )
  WHERE id = p_tool_id;
  
  -- Update vendor_promotions analytics
  UPDATE vendor_promotions 
  SET analytics_data = jsonb_set(
    analytics_data,
    ARRAY[p_event_type],
    to_jsonb((analytics_data ->> p_event_type)::integer + p_count)
  )
  WHERE tool_id = p_tool_id AND status = 'active' AND expires_at > now();
END;
$$;