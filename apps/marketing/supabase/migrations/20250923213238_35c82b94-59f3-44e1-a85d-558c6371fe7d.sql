-- Add RLS policies for marketplace_vendors
CREATE POLICY "Vendors can manage their own data" ON public.marketplace_vendors
  FOR ALL USING (enterprise_id = ANY(get_user_enterprises(auth.uid())));

CREATE POLICY "Public can view verified vendors" ON public.marketplace_vendors
  FOR SELECT USING (verification_status = 'verified');

-- Add RLS policies for tool_reviews
CREATE POLICY "Users can create reviews for their enterprise" ON public.tool_reviews
  FOR INSERT WITH CHECK (enterprise_id = ANY(get_user_enterprises(auth.uid())) AND reviewer_id = auth.uid());

CREATE POLICY "Public can view reviews" ON public.tool_reviews
  FOR SELECT USING (true);

CREATE POLICY "Review authors can update their reviews" ON public.tool_reviews
  FOR UPDATE USING (reviewer_id = auth.uid());

-- Drop the conflicting tool_requests table and recreate with proper structure
DROP TABLE IF EXISTS public.tool_requests;

CREATE TABLE public.tool_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id BIGINT NOT NULL,
  workspace_id UUID NOT NULL,
  enterprise_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  business_justification TEXT,
  expected_usage TEXT,
  compliance_requirements TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tool_requests ENABLE ROW LEVEL SECURITY;

-- Add proper policies for tool_requests
CREATE POLICY "Users can create requests for their enterprise" ON public.tool_requests
  FOR INSERT WITH CHECK (enterprise_id = ANY(get_user_enterprises(auth.uid())) AND requested_by = auth.uid());

CREATE POLICY "Users can view requests for their enterprise" ON public.tool_requests
  FOR SELECT USING (enterprise_id = ANY(get_user_enterprises(auth.uid())));

CREATE POLICY "Enterprise admins can update requests" ON public.tool_requests
  FOR UPDATE USING (enterprise_id = ANY(get_user_enterprises(auth.uid())));