-- Fix pricing tier constraint to allow the values we're using
ALTER TABLE public.marketplace_tools 
DROP CONSTRAINT IF EXISTS marketplace_tools_pricing_tier_check;

ALTER TABLE public.marketplace_tools 
ADD CONSTRAINT marketplace_tools_pricing_tier_check 
CHECK (pricing_tier IN ('basic', 'premium', 'enterprise'));

-- Now insert the sample data with correct pricing tiers
INSERT INTO public.marketplace_tools (
    name, 
    vendor_enterprise_id, 
    category, 
    description, 
    website, 
    pricing_tier, 
    status, 
    compliance_certifications
) VALUES 
(
    'DataSafe AI',
    '550e8400-e29b-41d4-a716-446655440001',
    'Data Security',
    'Enterprise-grade data anonymization and privacy protection for ML pipelines',
    'https://datasafe.example.com',
    'enterprise',
    'verified',
    '["GDPR", "HIPAA", "Audit Log Enabled"]'::jsonb
),
(
    'MedAI Assistant',
    '550e8400-e29b-41d4-a716-446655440001',
    'Healthcare',
    'AI-powered medical record analysis with built-in privacy controls',
    'https://medai.example.com',
    'premium',
    'verified',
    '["HIPAA", "FDA 21 CFR Part 11", "Audit Log Enabled"]'::jsonb
),
(
    'ComplianceBot Pro',
    '550e8400-e29b-41d4-a716-446655440002',
    'Compliance Monitoring',
    'Automated compliance monitoring and reporting for financial services',
    'https://compliancebot.example.com',
    'basic',
    'pending_verification',
    '["SOC 2", "PCI DSS"]'::jsonb
),
(
    'PharmaScan AI',
    '550e8400-e29b-41d4-a716-446655440001',
    'Medical Imaging',
    'Drug discovery and clinical trial optimization platform',
    'https://pharmascan.example.com',
    'enterprise',
    'verified',
    '["GxP", "FDA Validated", "Audit Log Enabled"]'::jsonb
),
(
    'FinanceGuard AI',
    '550e8400-e29b-41d4-a716-446655440002',
    'Financial Services',
    'Real-time transaction monitoring and fraud detection',
    'https://financeguard.example.com',
    'premium',
    'verified',
    '["PCI DSS", "SOX", "Anti-Money Laundering"]'::jsonb
)
ON CONFLICT (name, vendor_enterprise_id) DO NOTHING;