-- Insert sample agent activities for testing Weave UI
-- These activities are grouped to form different conversation threads

-- Thread 1: Pfizer Policy Compliance Check (policy_snapshot_id: pfizer_001)
INSERT INTO agent_activities (agent, action, status, details, workspace_id, enterprise_id, created_at) VALUES
('compliance_monitor', 'Initiated compliance scan for Pfizer AI Policy v2.1', 'success', 
 '{"context": {"policy_snapshot_id": "pfizer_001", "policy_name": "Pfizer AI Policy v2.1", "version": "2.1"}, "reasoning": "Starting comprehensive compliance analysis"}',
 NULL, NULL, NOW() - INTERVAL '2 hours'),

('policy_analyzer', 'Analyzed 47 policy requirements across 21 CFR Part 11 compliance', 'success',
 '{"context": {"policy_snapshot_id": "pfizer_001", "requirements_count": 47}, "metadata": {"compliance_score": 0.92, "critical_gaps": 2}}',
 NULL, NULL, NOW() - INTERVAL '1 hour 55 minutes'),

('risk_assessor', 'Identified 2 critical compliance gaps requiring immediate attention', 'warning',
 '{"context": {"policy_snapshot_id": "pfizer_001"}, "evidence_count": 2, "pattern": "Missing audit trail documentation for AI model updates"}',
 NULL, NULL, NOW() - INTERVAL '1 hour 50 minutes'),

('harmonizer', 'Proposed remediation plan for compliance gaps', 'success',
 '{"context": {"policy_snapshot_id": "pfizer_001"}, "action_taken": "Generated audit trail template and documentation requirements", "harmonization_status": "pending_review"}',
 NULL, NULL, NOW() - INTERVAL '1 hour 45 minutes');

-- Thread 2: Novartis-Internal Conflict Detection (decision_id: conflict_nov_001)
INSERT INTO agent_activities (agent, action, status, details, workspace_id, enterprise_id, created_at) VALUES
('conflict_detector', 'Detected timeline conflict between Novartis vendor requirements and internal AI governance', 'warning',
 '{"context": {"decision_id": "conflict_nov_001", "conflict_type": "timeline", "severity": "medium"}, "evidence_count": 3}',
 NULL, NULL, NOW() - INTERVAL '3 hours'),

('context_analyzer', 'Analyzing conflict scope: Novartis requires 30-day review cycle vs internal 45-day standard', 'running',
 '{"context": {"decision_id": "conflict_nov_001", "novartis_timeline": "30 days", "internal_timeline": "45 days"}, "reasoning": "Evaluating feasibility of timeline acceleration"}',
 NULL, NULL, NOW() - INTERVAL '2 hours 55 minutes'),

('decision_maker', 'Recommended hybrid approach: Fast-track critical tools, standard for non-critical', 'success',
 '{"context": {"decision_id": "conflict_nov_001", "recommendation": "hybrid_approach"}, "action_taken": "Created tiered review process", "metadata": {"estimated_compliance": "95%"}}',
 NULL, NULL, NOW() - INTERVAL '2 hours 50 minutes');

-- Thread 3: FDA Bias Testing Workflow (workflow_id: fda_bias_001)
INSERT INTO agent_activities (agent, action, status, details, workspace_id, enterprise_id, created_at) VALUES
('workflow_orchestrator', 'Initiated FDA bias testing protocol for clinical trial ML model', 'success',
 '{"context": {"workflow_id": "fda_bias_001", "model_name": "ClinicalTrialPredictor_v3", "regulatory_framework": "21 CFR Part 11"}, "reasoning": "Mandatory pre-deployment testing"}',
 NULL, NULL, NOW() - INTERVAL '30 minutes'),

('bias_detector', 'Running demographic parity analysis across patient cohorts', 'running',
 '{"context": {"workflow_id": "fda_bias_001", "test_type": "demographic_parity"}, "metadata": {"cohorts_analyzed": 12, "progress": 0.65}}',
 NULL, NULL, NOW() - INTERVAL '25 minutes'),

('evidence_collector', 'Documented 156 test cases with statistical validation', 'success',
 '{"context": {"workflow_id": "fda_bias_001"}, "evidence_count": 156, "metadata": {"statistical_power": 0.98, "confidence_level": 0.95}}',
 NULL, NULL, NOW() - INTERVAL '20 minutes'),

('audit_trail_generator', 'Generated FDA-ready audit trail with cryptographic signatures', 'success',
 '{"context": {"workflow_id": "fda_bias_001", "document_type": "audit_trail"}, "action_taken": "Created tamper-proof audit log with SHA-256 signatures"}',
 NULL, NULL, NOW() - INTERVAL '15 minutes');

-- Thread 4: Multi-Vendor Policy Harmonization (policy_snapshot_id: vendor_harmonize_001)
INSERT INTO agent_activities (agent, action, status, details, workspace_id, enterprise_id, created_at) VALUES
('harmonizer', 'Detected conflicting requirements across 3 vendor AI policies', 'warning',
 '{"context": {"policy_snapshot_id": "vendor_harmonize_001", "vendors": ["Pfizer", "Novartis", "GSK"]}, "pattern": "Inconsistent data retention requirements"}',
 NULL, NULL, NOW() - INTERVAL '4 hours'),

('policy_analyzer', 'Analyzed common ground: 85% alignment on core AI governance principles', 'success',
 '{"context": {"policy_snapshot_id": "vendor_harmonize_001"}, "metadata": {"alignment_score": 0.85, "divergence_points": 7}}',
 NULL, NULL, NOW() - INTERVAL '3 hours 50 minutes'),

('compliance_monitor', 'Identified 7 critical divergence points requiring stakeholder review', 'warning',
 '{"context": {"policy_snapshot_id": "vendor_harmonize_001"}, "evidence_count": 7, "root_cause": "Varying interpretations of FDA guidance"}',
 NULL, NULL, NOW() - INTERVAL '3 hours 40 minutes'),

('harmonizer', 'Proposed unified policy framework with vendor-specific addendums', 'success',
 '{"context": {"policy_snapshot_id": "vendor_harmonize_001"}, "action_taken": "Generated master policy with 3 vendor-specific supplements", "harmonization_status": "ready_for_approval"}',
 NULL, NULL, NOW() - INTERVAL '3 hours 30 minutes');

-- Thread 5: Real-time Activity (recent user interaction)
INSERT INTO agent_activities (agent, action, status, details, workspace_id, enterprise_id, created_at) VALUES
('user', 'What is the status of our Pfizer compliance audit?', 'success',
 '{"context": {"thread_context": "compliance_inquiry"}, "metadata": {"user_query": true}}',
 NULL, NULL, NOW() - INTERVAL '5 minutes'),

('cursor_ai', 'Based on recent compliance scans, Pfizer AI Policy v2.1 shows 92% compliance with 2 critical gaps identified. The harmonizer agent has proposed remediation plans that are pending review. Would you like me to provide details on the specific gaps?', 'success',
 '{"context": {"thread_context": "compliance_inquiry", "referenced_threads": ["pfizer_001"]}, "reasoning": "Synthesized information from compliance_monitor and risk_assessor activities"}',
 NULL, NULL, NOW() - INTERVAL '4 minutes 30 seconds');