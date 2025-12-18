-- Populate comprehensive sample data for user onboarding and dashboard functionality

-- First, clear existing sample data to start fresh
TRUNCATE TABLE 
  ai_agent_decisions, agent_activities, ai_tool_usage_logs, project_ai_tool_usage,
  compliance_reports, workspace_members, projects, workspaces, 
  enterprise_members, enterprises CASCADE;

-- Create sample enterprises with correct enum values
INSERT INTO enterprises (id, name, domain, enterprise_type, subscription_tier) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Acme Pharmaceuticals', 'acmepharma.com', 'client', 'enterprise'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Digital Health Agency', 'dhagency.com', 'agency', 'enterprise'),
  ('550e8400-e29b-41d4-a716-446655440003', 'MedTech Solutions', 'medtechsol.com', 'client', 'foundation'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Compliance Partners', 'compliancepartners.com', 'agency', 'network_command');

-- Create sample workspaces
INSERT INTO workspaces (id, name, enterprise_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Acme Main Workspace', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Digital Health Main', '550e8400-e29b-41d4-a716-446655440002'),
  ('660e8400-e29b-41d4-a716-446655440003', 'MedTech Workspace', '550e8400-e29b-41d4-a716-446655440003'),
  ('660e8400-e29b-41d4-a716-446655440004', 'Compliance Hub', '550e8400-e29b-41d4-a716-446655440004');

-- Create sample projects
INSERT INTO projects (id, project_name, client_name, brand, workspace_id, project_description, expected_delivery_date) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'AI Drug Discovery Platform', 'Acme Pharmaceuticals', 'AcmeDrug', '660e8400-e29b-41d4-a716-446655440001', 'AI-powered drug discovery platform using machine learning', '2025-03-15'),
  ('770e8400-e29b-41d4-a716-446655440002', 'Clinical Trial Management', 'MedResearch Corp', 'MedResearch', '660e8400-e29b-41d4-a716-446655440002', 'Digital platform for managing clinical trials', '2025-04-20'),
  ('770e8400-e29b-41d4-a716-446655440003', 'Patient Monitoring System', 'HealthTech Inc', 'HealthTech', '660e8400-e29b-41d4-a716-446655440003', 'Real-time patient monitoring with AI alerts', '2025-02-28'),
  ('770e8400-e29b-41d4-a716-446655440004', 'Regulatory Compliance Suite', 'PharmaGiant', 'PharmaGiant', '660e8400-e29b-41d4-a716-446655440004', 'Comprehensive regulatory compliance management', '2025-05-10');

-- Populate AI agent decisions with recent activity
INSERT INTO ai_agent_decisions (agent, action, outcome, risk, details, enterprise_id, created_at) VALUES
  ('Policy Analyzer', 'analyze_submission', 'approved', 'low', '{"tool": "GPT-4", "policy": "Data Privacy", "score": 92}', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 hours'),
  ('Risk Assessor', 'evaluate_tool', 'flagged', 'medium', '{"tool": "Claude", "concerns": ["data_retention"], "score": 76}', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '4 hours'),
  ('Compliance Checker', 'validate_usage', 'approved', 'low', '{"tool": "Midjourney", "compliance_framework": "FDA", "score": 88}', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '1 hour'),
  ('Policy Analyzer', 'analyze_submission', 'approved', 'low', '{"tool": "GitHub Copilot", "policy": "Code Security", "score": 94}', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '6 hours'),
  ('Risk Assessor', 'evaluate_tool', 'escalated', 'high', '{"tool": "Custom AI Model", "concerns": ["bias_testing", "data_governance"], "score": 45}', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '3 hours');

-- Populate agent activities
INSERT INTO agent_activities (agent, action, details, workspace_id, enterprise_id, status, created_at) VALUES
  ('Tool Intelligence', 'analyze_adoption_patterns', '{"tools_analyzed": 15, "insights_generated": 8}', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'completed', NOW() - INTERVAL '1 hour'),
  ('Audit Export', 'generate_fda_package', '{"submission_id": "SUB_001", "pages_generated": 47}', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'completed', NOW() - INTERVAL '3 hours'),
  ('Risk Monitor', 'scan_new_tools', '{"tools_scanned": 23, "violations_found": 2}', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'completed', NOW() - INTERVAL '5 hours'),
  ('Policy Distributor', 'update_workspace_policies', '{"policies_updated": 4, "workspaces_notified": 12}', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'completed', NOW() - INTERVAL '2 hours');

-- Populate AI tool usage logs
INSERT INTO ai_tool_usage_logs (tool_name, vendor_name, client_id, compliance_status, risk_level, usage_type, data_processed, metadata, timestamp) VALUES
  ('GPT-4', 'OpenAI', '770e8400-e29b-41d4-a716-446655440001', 'compliant', 'low', 'text_generation', 'research_notes', '{"workspace_id": "660e8400-e29b-41d4-a716-446655440001", "project": "AI Drug Discovery"}', NOW() - INTERVAL '30 minutes'),
  ('Claude', 'Anthropic', '770e8400-e29b-41d4-a716-446655440002', 'under_review', 'medium', 'analysis', 'clinical_data', '{"workspace_id": "660e8400-e29b-41d4-a716-446655440002", "project": "Clinical Trial Management"}', NOW() - INTERVAL '1 hour'),
  ('Midjourney', 'Midjourney Inc', '770e8400-e29b-41d4-a716-446655440003', 'compliant', 'low', 'image_generation', 'marketing_materials', '{"workspace_id": "660e8400-e29b-41d4-a716-446655440003", "project": "Patient Monitoring"}', NOW() - INTERVAL '45 minutes'),
  ('GitHub Copilot', 'GitHub', '770e8400-e29b-41d4-a716-446655440004', 'compliant', 'low', 'code_assistance', 'application_code', '{"workspace_id": "660e8400-e29b-41d4-a716-446655440004", "project": "Regulatory Compliance"}', NOW() - INTERVAL '2 hours');

-- Populate project AI tool usage summaries
INSERT INTO project_ai_tool_usage (project_id, enterprise_id, workspace_id, tool_name, vendor_name, usage_count, first_used, last_used, compliance_status, risk_level) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'GPT-4', 'OpenAI', 45, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 minutes', 'compliant', 'low'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Claude', 'Anthropic', 23, NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 hour', 'under_review', 'medium'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Midjourney', 'Midjourney Inc', 12, NOW() - INTERVAL '15 days', NOW() - INTERVAL '45 minutes', 'compliant', 'low'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'GitHub Copilot', 'GitHub', 67, NOW() - INTERVAL '45 days', NOW() - INTERVAL '2 hours', 'compliant', 'low');

-- Function to automatically assign new users to sample data
CREATE OR REPLACE FUNCTION assign_user_to_sample_enterprise_and_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_enterprise_id uuid;
    target_workspace_id uuid;
    target_role enterprise_role_enum;
BEGIN
    -- Determine target enterprise and role based on account type
    IF NEW.account_type = 'enterprise' THEN
        target_enterprise_id := '550e8400-e29b-41d4-a716-446655440001'; -- Acme Pharmaceuticals
        target_workspace_id := '660e8400-e29b-41d4-a716-446655440001';  -- Acme Main Workspace
        target_role := 'admin';
    ELSIF NEW.account_type = 'partner' THEN
        target_enterprise_id := '550e8400-e29b-41d4-a716-446655440002'; -- Digital Health Agency
        target_workspace_id := '660e8400-e29b-41d4-a716-446655440002';  -- Digital Health Main
        target_role := 'member';
    ELSE
        RETURN NEW; -- No assignment if no account type selected
    END IF;

    -- Add user to enterprise
    INSERT INTO enterprise_members (user_id, enterprise_id, role)
    VALUES (NEW.id, target_enterprise_id, 'member'::app_role)
    ON CONFLICT (user_id, enterprise_id) DO NOTHING;

    -- Add user to workspace
    INSERT INTO workspace_members (user_id, workspace_id, role)
    VALUES (NEW.id, target_workspace_id, target_role)
    ON CONFLICT (user_id, workspace_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Create trigger to automatically assign users when account_type is updated
DROP TRIGGER IF EXISTS trigger_assign_user_to_sample_data ON profiles;
CREATE TRIGGER trigger_assign_user_to_sample_data
    AFTER UPDATE OF account_type ON profiles
    FOR EACH ROW
    WHEN (OLD.account_type IS DISTINCT FROM NEW.account_type AND NEW.account_type IS NOT NULL)
    EXECUTE FUNCTION assign_user_to_sample_enterprise_and_workspace();