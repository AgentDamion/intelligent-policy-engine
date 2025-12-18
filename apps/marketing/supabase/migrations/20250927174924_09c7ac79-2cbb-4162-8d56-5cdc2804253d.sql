-- Create test client enterprises (pharmaceutical companies)
INSERT INTO enterprises (id, name, subscription_tier, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Moderna Therapeutics', 'enterprise', now()),
('550e8400-e29b-41d4-a716-446655440011', 'Pfizer Global R&D', 'enterprise', now()),
('550e8400-e29b-41d4-a716-446655440012', 'Johnson & Johnson Innovation', 'enterprise', now()),
('550e8400-e29b-41d4-a716-446655440013', 'Novartis Digital Labs', 'enterprise', now()),
('550e8400-e29b-41d4-a716-446655440014', 'Roche Pharmaceuticals', 'enterprise', now());

-- Create client workspaces for each enterprise
INSERT INTO workspaces (id, name, enterprise_id, enterprise_name, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440010', 'Moderna AI Compliance', '550e8400-e29b-41d4-a716-446655440010', 'Moderna Therapeutics', now()),
('660e8400-e29b-41d4-a716-446655440011', 'Pfizer AI Governance', '550e8400-e29b-41d4-a716-446655440011', 'Pfizer Global R&D', now()),
('660e8400-e29b-41d4-a716-446655440012', 'J&J Innovation Hub', '550e8400-e29b-41d4-a716-446655440012', 'Johnson & Johnson Innovation', now()),
('660e8400-e29b-41d4-a716-446655440013', 'Novartis Digital Compliance', '550e8400-e29b-41d4-a716-446655440013', 'Novartis Digital Labs', now()),
('660e8400-e29b-41d4-a716-446655440014', 'Roche AI Operations', '550e8400-e29b-41d4-a716-446655440014', 'Roche Pharmaceuticals', now());

-- Create client-agency relationships between Digital Health Agency and clients
INSERT INTO client_agency_relationships (client_enterprise_id, agency_enterprise_id, status, permissions, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'active', '{"can_view_policies": true, "can_submit_reviews": true, "can_manage_brands": true, "can_export_reports": true}', now()),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'active', '{"can_view_policies": true, "can_submit_reviews": true, "can_manage_brands": true, "can_export_reports": true}', now()),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'active', '{"can_view_policies": true, "can_submit_reviews": true, "can_manage_brands": false, "can_export_reports": true}', now()),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'active', '{"can_view_policies": true, "can_submit_reviews": true, "can_manage_brands": true, "can_export_reports": true}', now()),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'pending', '{"can_view_policies": true, "can_submit_reviews": false, "can_manage_brands": false, "can_export_reports": false}', now());

-- Add sample AI agent decisions with agency and client context
INSERT INTO ai_agent_decisions (agent, action, outcome, risk, enterprise_id, details, created_at, agency) VALUES
('document-processor', 'policy_validation', 'approved', 'low', '550e8400-e29b-41d4-a716-446655440010', 
 '{"client_name": "Moderna Therapeutics", "agency_name": "Digital Health Agency", "document_type": "AI Ethics Policy", "processing_time_ms": 2340, "confidence_score": 0.95, "policy_violations": 0, "recommendations": ["Consider adding bias testing requirements"], "metadata": {"workspace_id": "660e8400-e29b-41d4-a716-446655440010", "client_id": "550e8400-e29b-41d4-a716-446655440010", "agency_id": "550e8400-e29b-41d4-a716-446655440002"}}', 
 now() - interval '2 hours', 'Digital Health Agency'),

('compliance-checker', 'risk_assessment', 'flagged', 'medium', '550e8400-e29b-41d4-a716-446655440011', 
 '{"client_name": "Pfizer Global R&D", "agency_name": "Digital Health Agency", "document_type": "Data Processing Agreement", "processing_time_ms": 3200, "confidence_score": 0.87, "policy_violations": 2, "recommendations": ["Add GDPR compliance section", "Clarify data retention policies"], "metadata": {"workspace_id": "660e8400-e29b-41d4-a716-446655440011", "client_id": "550e8400-e29b-41d4-a716-446655440011", "agency_id": "550e8400-e29b-41d4-a716-446655440002"}}', 
 now() - interval '4 hours', 'Digital Health Agency'),

('document-processor', 'batch_processing', 'completed', 'low', '550e8400-e29b-41d4-a716-446655440012', 
 '{"client_name": "Johnson & Johnson Innovation", "agency_name": "Digital Health Agency", "document_type": "AI Tool Registry", "processing_time_ms": 1800, "confidence_score": 0.92, "policy_violations": 0, "recommendations": ["Document approval process complete"], "batch_size": 15, "metadata": {"workspace_id": "660e8400-e29b-41d4-a716-446655440012", "client_id": "550e8400-e29b-41d4-a716-446655440012", "agency_id": "550e8400-e29b-41d4-a716-446655440002"}}', 
 now() - interval '1 hour', 'Digital Health Agency'),

('compliance-checker', 'sla_monitoring', 'warning', 'medium', '550e8400-e29b-41d4-a716-446655440013', 
 '{"client_name": "Novartis Digital Labs", "agency_name": "Digital Health Agency", "document_type": "Compliance Review", "processing_time_ms": 4500, "confidence_score": 0.78, "policy_violations": 1, "recommendations": ["SLA deadline approaching - 18 hours remaining"], "sla_status": "at_risk", "metadata": {"workspace_id": "660e8400-e29b-41d4-a716-446655440013", "client_id": "550e8400-e29b-41d4-a716-446655440013", "agency_id": "550e8400-e29b-41d4-a716-446655440002"}}', 
 now() - interval '30 minutes', 'Digital Health Agency'),

('document-processor', 'policy_validation', 'rejected', 'high', '550e8400-e29b-41d4-a716-446655440014', 
 '{"client_name": "Roche Pharmaceuticals", "agency_name": "Digital Health Agency", "document_type": "AI Deployment Policy", "processing_time_ms": 2800, "confidence_score": 0.65, "policy_violations": 5, "recommendations": ["Major compliance issues detected", "Requires legal review", "FDA guidelines not addressed"], "metadata": {"workspace_id": "660e8400-e29b-41d4-a716-446655440014", "client_id": "550e8400-e29b-41d4-a716-446655440014", "agency_id": "550e8400-e29b-41d4-a716-446655440002"}}', 
 now() - interval '6 hours', 'Digital Health Agency');

-- Create governance entities for clients
INSERT INTO governance_entities (name, type, enterprise_id, compliance_score, tool_approval_score, audit_completeness_score, open_risks, owner_name, region, created_at) VALUES
('Moderna Therapeutics', 'client', '550e8400-e29b-41d4-a716-446655440002', 89, 85, 92, 2, 'Sarah Mitchell', 'US', now()),
('Pfizer Global R&D', 'client', '550e8400-e29b-41d4-a716-446655440002', 82, 78, 88, 4, 'David Chen', 'US', now()),
('Johnson & Johnson Innovation', 'client', '550e8400-e29b-41d4-a716-446655440002', 94, 91, 96, 1, 'Maria Rodriguez', 'US', now()),
('Novartis Digital Labs', 'client', '550e8400-e29b-41d4-a716-446655440002', 76, 73, 81, 6, 'Thomas Weber', 'EU', now()),
('Roche Pharmaceuticals', 'client', '550e8400-e29b-41d4-a716-446655440002', 71, 68, 75, 8, 'Elena Petrov', 'EU', now());

-- Add governance alerts for clients
INSERT INTO governance_alerts (severity, title, description, entity_name, entity_type, enterprise_id, days_open, assignee_name, category, created_at) VALUES
('warning', 'Moderna AI Tool Pending Review', '3 new AI tools awaiting compliance approval', 'Moderna Therapeutics', 'client', '550e8400-e29b-41d4-a716-446655440002', 2, 'Sarah Mitchell', 'Compliance', now() - interval '2 days'),
('critical', 'Pfizer Data Processing Violation', 'High-risk data processing detected without proper governance', 'Pfizer Global R&D', 'client', '550e8400-e29b-41d4-a716-446655440002', 1, 'David Chen', 'Security', now() - interval '1 day'),
('info', 'J&J Policy Distribution Complete', 'Q1 2025 AI governance policies successfully distributed', 'Johnson & Johnson Innovation', 'client', '550e8400-e29b-41d4-a716-446655440002', 0, 'Maria Rodriguez', 'Policy', now()),
('warning', 'Novartis SLA Breach Risk', 'Compliance review approaching deadline', 'Novartis Digital Labs', 'client', '550e8400-e29b-41d4-a716-446655440002', 3, 'Thomas Weber', 'Performance', now() - interval '3 days'),
('critical', 'Roche Compliance Failure', 'Multiple policy violations require immediate attention', 'Roche Pharmaceuticals', 'client', '550e8400-e29b-41d4-a716-446655440002', 5, 'Elena Petrov', 'Compliance', now() - interval '5 days');