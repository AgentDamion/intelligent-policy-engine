-- Add terms and conditions tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN terms_version TEXT,
ADD COLUMN privacy_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN marketing_consent BOOLEAN DEFAULT false;