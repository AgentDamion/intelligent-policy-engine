-- Add 'vendor' to the account_type enum
ALTER TYPE public.account_type ADD VALUE 'vendor';

-- Create vendor profiles table for vendor-specific information
CREATE TABLE public.vendor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_description TEXT,
  website_url TEXT,
  contact_email TEXT,
  logo_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on vendor_profiles
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_profiles
CREATE POLICY "Vendors can view their own profile" 
ON public.vendor_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Vendors can create their own profile" 
ON public.vendor_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can update their own profile" 
ON public.vendor_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create vendor_marketplace_settings table for vendor-specific marketplace settings
CREATE TABLE public.vendor_marketplace_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  auto_approve_submissions BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{}',
  analytics_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id)
);

-- Enable RLS on vendor_marketplace_settings
ALTER TABLE public.vendor_marketplace_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_marketplace_settings
CREATE POLICY "Vendors can manage their marketplace settings" 
ON public.vendor_marketplace_settings 
FOR ALL 
USING (vendor_id IN (
  SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_vendor_profiles_updated_at
BEFORE UPDATE ON public.vendor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_marketplace_settings_updated_at
BEFORE UPDATE ON public.vendor_marketplace_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();