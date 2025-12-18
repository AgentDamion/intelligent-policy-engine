-- Populate sample enterprises for demo purposes
INSERT INTO enterprises (id, name, domain, enterprise_type, subscription_tier) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Pharmaceutical Corp', 'pharma-corp.com', 'client', 'enterprise'),
  ('22222222-2222-2222-2222-222222222222', 'BioTech Innovations', 'biotech-innov.com', 'client', 'enterprise'),
  ('33333333-3333-3333-3333-333333333333', 'Digital Health Agency', 'dh-agency.com', 'agency', 'foundation'),
  ('44444444-4444-4444-4444-444444444444', 'MedTech Solutions', 'medtech-sol.com', 'vendor', 'foundation');

-- Populate sample workspaces
INSERT INTO workspaces (id, name, enterprise_id, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Clinical Research Workspace', '11111111-1111-1111-1111-111111111111', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marketing Compliance Hub', '11111111-1111-1111-1111-111111111111', now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Client Portfolio A', '33333333-3333-3333-3333-333333333333', now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Product Development', '22222222-2222-2222-2222-222222222222', now());

-- Populate sample projects
INSERT INTO projects (id, project_name, client_name, brand, workspace_id, project_description, expected_delivery_date, created_at) VALUES
  ('project1-1111-1111-1111-111111111111', 'Phase III Trial Documentation', 'Pharma Corp', 'DrugName Alpha', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AI-assisted clinical trial documentation and regulatory submission prep', '2025-06-15', now() - interval '30 days'),
  ('project2-2222-2222-2222-222222222222', 'Marketing Content Review', 'Pharma Corp', 'Wellness Plus', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'AI-powered marketing content compliance review system', '2025-04-30', now() - interval '15 days'),
  ('project3-3333-3333-3333-333333333333', 'Digital Therapeutics Platform', 'BioTech Innovations', 'MindHealth', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'AI compliance platform for digital therapeutics', '2025-07-20', now() - interval '45 days');

-- Populate sample AI tool usage logs  
INSERT INTO ai_tool_usage_logs (id, client_id, tool_name, vendor_name, compliance_status, risk_level, usage_type, data_processed, metadata, timestamp) VALUES
  (gen_random_uuid(), 'project1-1111-1111-1111-111111111111', 'GPT-4 Turbo', 'OpenAI', 'compliant', 'low', 'content_generation', 'clinical_protocols', '{"workspace_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "purpose": "protocol_drafting"}', now() - interval '2 hours'),
  (gen_random_uuid(), 'project1-1111-1111-1111-111111111111', 'Claude-3.5 Sonnet', 'Anthropic', 'compliant', 'low', 'document_review', 'regulatory_submissions', '{"workspace_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "purpose": "document_analysis"}', now() - interval '1 hour'),
  (gen_random_uuid(), 'project2-2222-2222-2222-222222222222', 'Midjourney', 'Midjourney Inc', 'partial', 'medium', 'image_generation', 'marketing_visuals', '{"workspace_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "purpose": "visual_content"}', now() - interval '4 hours'),
  (gen_random_uuid(), 'project3-3333-3333-3333-333333333333', 'Custom Medical AI', 'Internal', 'compliant', 'high', 'data_analysis', 'patient_data', '{"workspace_id": "dddddddd-dddd-dddd-dddd-dddddddddddd", "purpose": "therapeutic_analysis"}', now() - interval '30 minutes'),
  (gen_random_uuid(), 'project2-2222-2222-2222-222222222222', 'Copy.ai', 'Copy.ai', 'non_compliant', 'high', 'content_generation', 'marketing_copy', '{"workspace_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "purpose": "advertising_copy"}', now() - interval '6 hours');

-- Populate sample agent activities for live proof
INSERT INTO agent_activities (agent, action, workspace_id, enterprise_id, details, status, created_at) VALUES
  ('governance_agent', 'policy_check', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '{"tool": "GPT-4 Turbo", "outcome": "approved", "policy": "FDA_21CFR_Part11"}', 'completed', now() - interval '10 minutes'),
  ('compliance_agent', 'risk_assessment', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '{"tool": "Midjourney", "outcome": "flagged", "risk_factors": ["medical_claims", "unsubstantiated_benefits"]}', 'completed', now() - interval '5 minutes'),
  ('audit_agent', 'evidence_collection', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', '{"action": "automated_documentation", "compliance_score": 98}', 'completed', now() - interval '2 minutes'),
  ('decision_agent', 'human_escalation', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '{"tool": "Copy.ai", "reason": "high_risk_medical_claims", "reviewer_assigned": true}', 'pending_review', now() - interval '1 minute');

-- Populate sample AI agent decisions for metrics
INSERT INTO ai_agent_decisions (agent, action, outcome, risk, enterprise_id, agency, details, created_at) VALUES
  ('governance_agent', 'content_review', 'approved', 'low', '11111111-1111-1111-1111-111111111111', NULL, '{"tool": "GPT-4", "compliance_check": "passed", "citation": "21 CFR Part 11.10(a)"}', now() - interval '15 minutes'),
  ('risk_agent', 'tool_assessment', 'flagged', 'high', '11111111-1111-1111-1111-111111111111', NULL, '{"tool": "Copy.ai", "violations": ["medical_claims"], "action_required": "human_review"}', now() - interval '8 minutes'),
  ('compliance_agent', 'policy_validation', 'approved', 'low', '22222222-2222-2222-2222-222222222222', NULL, '{"tool": "Claude-3.5", "framework": "ICH_E6_R2", "confidence": 0.95}', now() - interval '3 minutes'),
  ('audit_agent', 'evidence_generation', 'completed', 'low', '11111111-1111-1111-1111-111111111111', NULL, '{"audit_trail": "generated", "retention_period": "7_years", "encryption": "AES_256"}', now() - interval '1 minute');