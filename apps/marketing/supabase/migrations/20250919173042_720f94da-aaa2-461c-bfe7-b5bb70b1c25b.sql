-- Create demo_requests table for tracking demo requests
CREATE TABLE public.demo_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    company_size TEXT,
    industry TEXT,
    use_case TEXT,
    message TEXT,
    demo_type TEXT DEFAULT 'executive_overview', -- executive_overview, technical_deep_dive, custom_implementation
    preferred_time TEXT,
    phone TEXT,
    source TEXT DEFAULT 'contact_form', -- contact_form, landing_page, etc.
    status TEXT DEFAULT 'new', -- new, contacted, demo_scheduled, demo_completed, closed
    lead_score INTEGER DEFAULT 0,
    assigned_to UUID, -- sales rep
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    follow_up_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for demo requests
CREATE POLICY "Service role can manage demo requests" 
ON public.demo_requests 
FOR ALL 
USING (true);

-- Create policy for inserting demo requests (public form submissions)
CREATE POLICY "Anyone can create demo requests" 
ON public.demo_requests 
FOR INSERT 
WITH CHECK (true);

-- Create policy for viewing demo requests (admin users only)
CREATE POLICY "Admin users can view demo requests" 
ON public.demo_requests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND account_type = 'enterprise'
    )
);

-- Create updated_at trigger
CREATE TRIGGER update_demo_requests_updated_at
    BEFORE UPDATE ON public.demo_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create customer_onboarding table for magic link system
CREATE TABLE public.customer_onboarding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    company_name TEXT NOT NULL,
    magic_token TEXT NOT NULL UNIQUE,
    account_type TEXT DEFAULT 'enterprise', -- enterprise, partner
    role TEXT DEFAULT 'admin', -- admin, member, viewer
    workspace_name TEXT,
    enterprise_id UUID,
    workspace_id UUID,
    invited_by UUID,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    used_at TIMESTAMP WITH TIME ZONE,
    user_id UUID, -- set when user completes onboarding
    onboarding_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_onboarding ENABLE ROW LEVEL SECURITY;

-- Create policies for customer onboarding
CREATE POLICY "Service role can manage customer onboarding" 
ON public.customer_onboarding 
FOR ALL 
USING (true);

-- Create policy for token holders to view their onboarding record
CREATE POLICY "Token holders can view onboarding record" 
ON public.customer_onboarding 
FOR SELECT 
USING (true); -- Token validation will be done in application logic

-- Create updated_at trigger
CREATE TRIGGER update_customer_onboarding_updated_at
    BEFORE UPDATE ON public.customer_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate magic token
CREATE OR REPLACE FUNCTION public.generate_magic_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;