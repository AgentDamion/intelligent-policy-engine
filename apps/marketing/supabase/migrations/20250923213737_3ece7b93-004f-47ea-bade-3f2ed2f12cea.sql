-- Insert sample marketplace vendors
INSERT INTO public.marketplace_vendors (id, enterprise_id, company_name, contact_email, contact_name, website, description, verification_status) VALUES
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'AI Health Solutions', 'contact@aihealthsolutions.com', 'Dr. Sarah Johnson', 'https://aihealthsolutions.com', 'Leading provider of AI-powered healthcare tools for regulatory compliance', 'verified'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'PharmaTech AI', 'support@pharmatechai.com', 'Dr. Michael Chen', 'https://pharmatechai.com', 'Specialized AI tools for pharmaceutical research and development', 'verified'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Compliance Guard', 'info@complianceguard.com', 'Lisa Martinez', 'https://complianceguard.com', 'Advanced compliance monitoring and risk assessment tools', 'verified')
ON CONFLICT (id) DO NOTHING;

-- Update existing marketplace tools with vendor relationships and enhanced data
UPDATE public.marketplace_tools 
SET 
  vendor_id = '550e8400-e29b-41d4-a716-446655440003',
  average_rating = 4.8,
  review_count = 245,
  monthly_active_users = 12500,
  setup_complexity = 'medium',
  integration_options = '["API", "SDK", "Webhook"]'::jsonb
WHERE id = 1;

UPDATE public.marketplace_tools 
SET 
  vendor_id = '550e8400-e29b-41d4-a716-446655440004',
  average_rating = 4.6,
  review_count = 189,
  monthly_active_users = 8900,
  setup_complexity = 'easy',
  integration_options = '["API", "Plugin"]'::jsonb
WHERE id = 2;

UPDATE public.marketplace_tools 
SET 
  vendor_id = '550e8400-e29b-41d4-a716-446655440005',
  average_rating = 4.9,
  review_count = 321,
  monthly_active_users = 15600,
  setup_complexity = 'advanced',
  integration_options = '["API", "SDK", "Webhook", "Custom"]'::jsonb
WHERE id = 3;