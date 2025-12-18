-- Create demo data for beta testing
-- Insert demo enterprise
INSERT INTO public.enterprises (id, name, domain, created_at, updated_at) 
VALUES (
  'b3a15512-fb3c-43e2-9d70-b6fdd8dedea6',
  'PharmaCorp Global',
  'pharmacorp.com',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert demo workspaces (assuming some exist from the existing schema)
INSERT INTO public.workspaces (id, name, enterprise_name, policy_scope, created_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'PharmaCorp Compliance',
  'PharmaCorp Global',
  'AI Tool Governance',
  NOW()
), (
  '550e8400-e29b-41d4-a716-446655440002',
  'PartnerAgency Alpha',
  'Alpha Research Partners',
  'Partner Compliance',
  NOW()
), (
  '550e8400-e29b-41d4-a716-446655440003',
  'PartnerAgency Beta',
  'Beta Clinical Solutions',
  'Partner Compliance',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a demo policy
INSERT INTO public.policies (id, title, description, enterprise_id, created_by, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'AI Tool Compliance Standard v2.1',
  'Comprehensive AI governance policy for pharmaceutical research and development',
  'b3a15512-fb3c-43e2-9d70-b6fdd8dedea6',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a published policy version
INSERT INTO public.policy_versions (id, policy_id, version_number, title, description, rules, status, published_at, created_by, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  1,
  'AI Tool Compliance Standard v2.1',
  'Published version with comprehensive rules for AI tool evaluation and approval',
  '{
    "data_handling": {
      "phi_allowed": false,
      "pii_restrictions": "strict",
      "data_residency": "US_only"
    },
    "model_requirements": {
      "bias_testing": "required",
      "explainability": "high",
      "performance_threshold": 0.85
    },
    "compliance_checks": {
      "fda_alignment": true,
      "gcp_compliance": true,
      "audit_trail": "complete"
    }
  }',
  'published',
  NOW(),
  NULL,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Distribute policy to partner workspaces
INSERT INTO public.policy_distributions (id, policy_version_id, target_workspace_id, distributed_by, note, created_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '550e8400-e29b-41d4-a716-446655440002',
  NULL,
  'Initial policy distribution to Alpha Research Partners',
  NOW()
), (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  '550e8400-e29b-41d4-a716-446655440003',
  NULL,
  'Initial policy distribution to Beta Clinical Solutions',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create demo submissions
INSERT INTO public.submissions (id, workspace_id, policy_version_id, title, description, status, risk_score, submitted_at, submitted_by, created_at, updated_at)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '550e8400-e29b-41d4-a716-446655440002',
  '22222222-2222-2222-2222-222222222222',
  'Clinical Data Analysis AI Platform',
  'Advanced ML platform for analyzing patient data in Phase II trials',
  'under_review',
  75,
  NOW() - INTERVAL '2 days',
  NULL,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
), (
  '66666666-6666-6666-6666-666666666666',
  '550e8400-e29b-41d4-a716-446655440003',
  '22222222-2222-2222-2222-222222222222',
  'Drug Discovery Neural Network',
  'AI model for identifying potential drug compounds',
  'submitted',
  85,
  NOW() - INTERVAL '1 day',
  NULL,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Create submission items
INSERT INTO public.submission_items (id, submission_id, ai_tool_name, vendor, description, risk_score, created_at)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  '55555555-5555-5555-5555-555555555555',
  'ClinicalML Pro',
  'DataMed Solutions',
  'Statistical analysis and pattern recognition for clinical trials',
  75,
  NOW() - INTERVAL '2 days'
), (
  '88888888-8888-8888-8888-888888888888',
  '66666666-6666-6666-6666-666666666666',
  'CompoundAI Discovery',
  'Pharmatech Innovations',
  'Neural network for molecular compound analysis',
  85,
  NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Create demo decisions
INSERT INTO public.decisions (id, submission_id, outcome, conditions, feedback, decided_by, created_at)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  '55555555-5555-5555-5555-555555555555',
  'approved_with_conditions',
  'Requires additional bias testing for demographic subgroups. Must implement enhanced audit logging.',
  'The clinical analysis platform meets most requirements but needs additional safeguards for demographic bias. Please implement the suggested bias testing framework and resubmit evidence.',
  NULL,
  NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Update submission with decision
UPDATE public.submissions 
SET decision_id = '99999999-9999-9999-9999-999999999999',
    decided_at = NOW() - INTERVAL '1 day',
    status = 'approved'
WHERE id = '55555555-5555-5555-5555-555555555555';

-- Create sample audit events
INSERT INTO public.audit_events (id, event_type, entity_type, entity_id, workspace_id, enterprise_id, details, created_at)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'policy_distributed',
  'policy_distribution',
  '33333333-3333-3333-3333-333333333333',
  '550e8400-e29b-41d4-a716-446655440002',
  'b3a15512-fb3c-43e2-9d70-b6fdd8dedea6',
  '{"policy_version": "v2.1", "target_workspace": "Alpha Research Partners", "distribution_method": "automatic"}',
  NOW() - INTERVAL '3 days'
), (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'submission_created',
  'submission',
  '55555555-5555-5555-5555-555555555555',
  '550e8400-e29b-41d4-a716-446655440002',
  'b3a15512-fb3c-43e2-9d70-b6fdd8dedea6',
  '{"submission_title": "Clinical Data Analysis AI Platform", "ai_tools_count": 1, "initial_risk_score": 75}',
  NOW() - INTERVAL '2 days'
), (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'decision_issued',
  'decision',
  '99999999-9999-9999-9999-999999999999',
  '550e8400-e29b-41d4-a716-446655440002',
  'b3a15512-fb3c-43e2-9d70-b6fdd8dedea6',
  '{"outcome": "approved_with_conditions", "conditions_count": 2, "reviewer_feedback": true}',
  NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;