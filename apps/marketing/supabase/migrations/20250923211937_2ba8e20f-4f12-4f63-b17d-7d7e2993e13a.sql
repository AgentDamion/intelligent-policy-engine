-- Create marketplace vendors table
CREATE TABLE IF NOT EXISTS public.marketplace_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_vendors ENABLE ROW LEVEL SECURITY;

-- Create tool requests table
CREATE TABLE IF NOT EXISTS public.tool_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id BIGINT NOT NULL,
  requester_id UUID NOT NULL,
  enterprise_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.tool_requests ENABLE ROW LEVEL SECURITY;

-- Create tool reviews table
CREATE TABLE IF NOT EXISTS public.tool_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id BIGINT NOT NULL,
  reviewer_id UUID NOT NULL,
  enterprise_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tool_id, reviewer_id, enterprise_id)
);

-- Enable RLS
ALTER TABLE public.tool_reviews ENABLE ROW LEVEL SECURITY;

-- Update marketplace_tools to include vendor relationship
ALTER TABLE public.marketplace_tools 
ADD COLUMN IF NOT EXISTS vendor_id UUID,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_active_users INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS setup_complexity TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS integration_options JSONB DEFAULT '[]'::jsonb;