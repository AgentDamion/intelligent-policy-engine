-- Simplified sample data migration that works with existing constraints

-- Create sample enterprises
INSERT INTO enterprises (id, name, domain, enterprise_type, subscription_tier) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Acme Pharmaceuticals', 'acmepharma.com', 'client', 'enterprise'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Digital Health Agency', 'dhagency.com', 'agency', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Create sample workspaces
INSERT INTO workspaces (id, name, enterprise_name, enterprise_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Acme Main Workspace', 'Acme Pharmaceuticals', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Digital Health Main', 'Digital Health Agency', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Create sample projects
INSERT INTO projects (id, project_name, client_name, brand, workspace_id, project_description) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'AI Drug Discovery Platform', 'Acme Pharmaceuticals', 'AcmeDrug', '660e8400-e29b-41d4-a716-446655440001', 'AI-powered drug discovery platform'),
  ('770e8400-e29b-41d4-a716-446655440002', 'Clinical Trial Management', 'MedResearch Corp', 'MedResearch', '660e8400-e29b-41d4-a716-446655440002', 'Digital platform for managing clinical trials')
ON CONFLICT (id) DO NOTHING;

-- Add recent AI decisions
INSERT INTO ai_agent_decisions (agent, action, outcome, risk, details, enterprise_id, created_at) VALUES
  ('Policy Analyzer', 'analyze_submission', 'approved', 'low', '{"tool": "GPT-4", "score": 92}', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 hours'),
  ('Risk Assessor', 'evaluate_tool', 'flagged', 'medium', '{"tool": "Claude", "score": 76}', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '4 hours'),
  ('Compliance Checker', 'validate_usage', 'approved', 'low', '{"tool": "Midjourney", "score": 88}', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Add agent activities
INSERT INTO agent_activities (agent, action, details, workspace_id, enterprise_id, status, created_at) VALUES
  ('Tool Intelligence', 'analyze_adoption_patterns', '{"tools_analyzed": 15}', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'success', NOW() - INTERVAL '1 hour'),
  ('Audit Export', 'generate_fda_package', '{"pages_generated": 47}', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'success', NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;