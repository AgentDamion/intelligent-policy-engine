-- Insert sample data with only the essential tables for live proof
-- Clear existing data first
DELETE FROM ai_agent_decisions;
DELETE FROM agent_activities;
DELETE FROM projects;
DELETE FROM workspaces;
DELETE FROM enterprises;

-- Populate sample enterprises
INSERT INTO enterprises (id, name, domain, enterprise_type, subscription_tier) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Pharmaceutical Corp', 'pharma-corp.com', 'client', 'enterprise'),
  ('22222222-2222-2222-2222-222222222222', 'BioTech Innovations', 'biotech-innov.com', 'client', 'enterprise');

-- Populate sample workspaces
INSERT INTO workspaces (id, name, enterprise_name, enterprise_id, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Clinical Research Workspace', 'Pharmaceutical Corp', '11111111-1111-1111-1111-111111111111', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marketing Compliance Hub', 'Pharmaceutical Corp', '11111111-1111-1111-1111-111111111111', now());

-- Populate sample projects
INSERT INTO projects (id, project_name, client_name, brand, workspace_id, project_description, expected_delivery_date, created_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Phase III Trial Documentation', 'Pharma Corp', 'DrugName Alpha', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AI-assisted clinical trial documentation and regulatory submission prep', '2025-06-15', now() - interval '30 days'),
  ('b2222222-2222-2222-2222-222222222222', 'Marketing Content Review', 'Pharma Corp', 'Wellness Plus', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'AI-powered marketing content compliance review system', '2025-04-30', now() - interval '15 days');

-- Populate sample agent activities for live proof
INSERT INTO agent_activities (agent, action, workspace_id, enterprise_id, details, status, created_at) VALUES
  ('governance_agent', 'policy_check', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '{"tool": "GPT-4 Turbo", "outcome": "approved", "policy": "FDA_21CFR_Part11"}', 'completed', now() - interval '10 minutes'),
  ('compliance_agent', 'risk_assessment', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '{"tool": "Midjourney", "outcome": "flagged", "risk_factors": ["medical_claims", "unsubstantiated_benefits"]}', 'completed', now() - interval '5 minutes'),
  ('audit_agent', 'evidence_collection', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '{"action": "automated_documentation", "compliance_score": 98}', 'completed', now() - interval '2 minutes'),
  ('decision_agent', 'human_escalation', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '{"tool": "Copy.ai", "reason": "high_risk_medical_claims", "reviewer_assigned": true}', 'pending_review', now() - interval '1 minute');

-- Populate sample AI agent decisions for metrics
INSERT INTO ai_agent_decisions (agent, action, outcome, risk, enterprise_id, agency, details, created_at) VALUES
  ('governance_agent', 'content_review', 'approved', 'low', '11111111-1111-1111-1111-111111111111', NULL, '{"tool": "GPT-4", "compliance_check": "passed", "citation": "21 CFR Part 11.10(a)"}', now() - interval '15 minutes'),
  ('risk_agent', 'tool_assessment', 'flagged', 'high', '11111111-1111-1111-1111-111111111111', NULL, '{"tool": "Copy.ai", "violations": ["medical_claims"], "action_required": "human_review"}', now() - interval '8 minutes'),
  ('compliance_agent', 'policy_validation', 'approved', 'low', '11111111-1111-1111-1111-111111111111', NULL, '{"tool": "Claude-3.5", "framework": "ICH_E6_R2", "confidence": 0.95}', now() - interval '3 minutes'),
  ('audit_agent', 'evidence_generation', 'completed', 'low', '11111111-1111-1111-1111-111111111111', NULL, '{"audit_trail": "generated", "retention_period": "7_years", "encryption": "AES_256"}', now() - interval '1 minute');