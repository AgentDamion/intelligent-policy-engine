-- Migration: Create Risk Profile Policy Templates
-- Creates 5 comprehensive policy templates aligned with NIST AI RMF risk tiers

-- Insert Minimal Risk Profile Template
INSERT INTO policy_templates_enhanced (
  name, 
  description, 
  industry,
  regulation_framework,
  risk_profile_tier,
  template_rules,
  risk_categories,
  compliance_requirements,
  audit_checklist_base,
  audit_checklist_specific,
  control_requirements,
  is_public,
  version
) VALUES (
  'Minimal Risk AI Tool Policy',
  'For internal productivity assistants with no sensitive data handling. Examples: grammar checkers, internal summarizers, basic translation tools.',
  'general',
  'NIST_AI_RMF',
  'minimal',
  '{
    "approval": {
      "type": "auto",
      "requires_review": false,
      "approver_role": "team_lead"
    },
    "review_frequency": "annual",
    "data_handling": {
      "sensitive_data_allowed": false,
      "retention_period": "30_days",
      "encryption_required": false
    },
    "usage_restrictions": {
      "internal_only": true,
      "customer_facing": false,
      "high_stakes_decisions": false
    }
  }',
  '{
    "data_sensitivity": "minimal",
    "external_exposure": "none",
    "model_transparency": "interpretable",
    "misuse_vectors": "low",
    "legal_risk": "minimal",
    "operational_criticality": "low"
  }',
  '{
    "data_handling": "none",
    "explainability": "not_required",
    "human_oversight": "optional",
    "audit_trail": "basic",
    "bias_testing": "not_required"
  }',
  '["usage_tracking", "basic_logging", "access_controls"]',
  '[]',
  '{
    "monitoring": ["basic_usage_metrics"],
    "documentation": ["basic_attestation"],
    "training": ["basic_awareness"],
    "incident_response": ["standard_it_procedures"]
  }',
  true,
  '1.0'
);

-- Insert Low Risk Profile Template
INSERT INTO policy_templates_enhanced (
  name, 
  description, 
  industry,
  regulation_framework,
  risk_profile_tier,
  template_rules,
  risk_categories,
  compliance_requirements,
  audit_checklist_base,
  audit_checklist_specific,
  control_requirements,
  is_public,
  version
) VALUES (
  'Low Risk AI Tool Policy',
  'For low-volume content generation and internal use tools. Examples: marketing content generators, presentation tools, internal research assistants.',
  'general',
  'NIST_AI_RMF',
  'low',
  '{
    "approval": {
      "type": "conditional",
      "requires_review": true,
      "approver_role": "business_owner",
      "review_turnaround": "3_business_days"
    },
    "review_frequency": "semi_annual",
    "data_handling": {
      "sensitive_data_allowed": false,
      "retention_period": "90_days",
      "encryption_required": true
    },
    "usage_restrictions": {
      "internal_only": false,
      "customer_facing": false,
      "high_stakes_decisions": false,
      "content_review_required": true
    }
  }',
  '{
    "data_sensitivity": "low",
    "external_exposure": "low",
    "model_transparency": "moderate",
    "misuse_vectors": "moderate",
    "legal_risk": "low",
    "operational_criticality": "low"
  }',
  '{
    "data_handling": "minimal",
    "explainability": "recommended",
    "human_oversight": "recommended",
    "audit_trail": "standard",
    "bias_testing": "recommended"
  }',
  '["usage_tracking", "basic_logging", "access_controls", "error_logging"]',
  '["content_review", "quarterly_spot_checks"]',
  '{
    "monitoring": ["usage_metrics", "error_rates", "user_feedback"],
    "documentation": ["usage_summary", "control_checklist"],
    "training": ["tool_specific_training"],
    "incident_response": ["escalation_procedures"]
  }',
  true,
  '1.0'
);

-- Insert Medium Risk Profile Template
INSERT INTO policy_templates_enhanced (
  name, 
  description, 
  industry,
  regulation_framework,
  risk_profile_tier,
  template_rules,
  risk_categories,
  compliance_requirements,
  audit_checklist_base,
  audit_checklist_specific,
  control_requirements,
  is_public,
  version
) VALUES (
  'Medium Risk AI Tool Policy',
  'For customer-facing content and moderate data sensitivity. Examples: customer-facing chatbots (general), analytics tools with PII, automated email responses.',
  'general',
  'NIST_AI_RMF',
  'medium',
  '{
    "approval": {
      "type": "requires_approval",
      "requires_review": true,
      "approver_role": "compliance_officer",
      "review_turnaround": "5_business_days",
      "security_review_required": true
    },
    "review_frequency": "quarterly",
    "data_handling": {
      "sensitive_data_allowed": true,
      "pii_allowed": true,
      "retention_period": "180_days",
      "encryption_required": true,
      "data_minimization_required": true
    },
    "usage_restrictions": {
      "internal_only": false,
      "customer_facing": true,
      "high_stakes_decisions": false,
      "human_review_required": true,
      "output_validation_required": true
    }
  }',
  '{
    "data_sensitivity": "medium",
    "external_exposure": "medium",
    "model_transparency": "moderate",
    "misuse_vectors": "medium",
    "legal_risk": "medium",
    "operational_criticality": "medium"
  }',
  '{
    "data_handling": "pii_protection_required",
    "explainability": "required",
    "human_oversight": "required",
    "audit_trail": "comprehensive",
    "bias_testing": "required"
  }',
  '["usage_tracking", "enhanced_logging", "access_controls", "error_logging"]',
  '["human_review", "output_validation", "data_protection_review", "periodic_spot_checks", "user_feedback_loops"]',
  '{
    "monitoring": ["enhanced_usage_metrics", "error_rates", "performance_tracking", "user_feedback", "output_quality_metrics"],
    "documentation": ["risk_summary", "control_checklist", "data_flow_diagram", "human_review_procedures"],
    "training": ["comprehensive_training", "privacy_training"],
    "incident_response": ["detailed_escalation_procedures", "breach_notification_procedures"]
  }',
  true,
  '1.0'
);

-- Insert High Risk Profile Template
INSERT INTO policy_templates_enhanced (
  name, 
  description, 
  industry,
  regulation_framework,
  risk_profile_tier,
  template_rules,
  risk_categories,
  compliance_requirements,
  audit_checklist_base,
  audit_checklist_specific,
  control_requirements,
  is_public,
  version
) VALUES (
  'High Risk AI Tool Policy',
  'For decision-support systems and regulated data handling. Examples: healthcare decision support, financial advisors, hiring assistance, credit scoring.',
  'healthcare,financial',
  'NIST_AI_RMF,HIPAA,SOX',
  'high',
  '{
    "approval": {
      "type": "requires_multi_approval",
      "requires_review": true,
      "approver_roles": ["compliance_officer", "legal_counsel", "security_team"],
      "review_turnaround": "10_business_days",
      "security_review_required": true,
      "legal_review_required": true,
      "risk_assessment_required": true
    },
    "review_frequency": "monthly",
    "data_handling": {
      "sensitive_data_allowed": true,
      "pii_allowed": true,
      "phi_allowed": true,
      "regulated_data": true,
      "retention_period": "as_required_by_regulation",
      "encryption_required": true,
      "encryption_at_rest": true,
      "encryption_in_transit": true,
      "data_minimization_required": true,
      "data_anonymization_preferred": true
    },
    "usage_restrictions": {
      "internal_only": false,
      "customer_facing": true,
      "high_stakes_decisions": true,
      "human_review_required": true,
      "human_final_decision": true,
      "output_validation_required": true,
      "explainability_required": true
    }
  }',
  '{
    "data_sensitivity": "high",
    "external_exposure": "high",
    "model_transparency": "high_requirement",
    "misuse_vectors": "high",
    "legal_risk": "high",
    "operational_criticality": "high"
  }',
  '{
    "data_handling": "regulated_data_controls",
    "explainability": "mandatory",
    "human_oversight": "mandatory",
    "audit_trail": "immutable_comprehensive",
    "bias_testing": "mandatory_regular"
  }',
  '["usage_tracking", "comprehensive_logging", "access_controls", "error_logging", "security_monitoring"]',
  '["explainability_review", "bias_testing", "legal_sign_off", "performance_monitoring", "human_oversight_validation", "data_protection_audit", "regular_compliance_audits"]',
  '{
    "monitoring": ["real_time_monitoring", "performance_metrics", "bias_metrics", "explainability_metrics", "user_feedback", "adverse_event_tracking"],
    "documentation": ["full_model_card", "risk_assessment", "mitigation_plans", "data_protection_impact_assessment", "explainability_documentation"],
    "training": ["comprehensive_training", "privacy_training", "ethics_training", "bias_awareness_training"],
    "incident_response": ["detailed_incident_response_plan", "breach_notification_procedures", "regulatory_reporting_procedures", "escalation_matrix"]
  }',
  true,
  '1.0'
);

-- Insert Critical Risk Profile Template
INSERT INTO policy_templates_enhanced (
  name, 
  description, 
  industry,
  regulation_framework,
  risk_profile_tier,
  template_rules,
  risk_categories,
  compliance_requirements,
  audit_checklist_base,
  audit_checklist_specific,
  control_requirements,
  is_public,
  version
) VALUES (
  'Critical Risk AI Tool Policy',
  'For high-stakes AI with significant harm potential. Examples: medical diagnosis AI, legal advice bots, automated medical treatment, safety-critical systems, regulatory content creation.',
  'healthcare,legal,pharmaceutical',
  'NIST_AI_RMF,HIPAA,FDA,AI_ACT',
  'critical',
  '{
    "approval": {
      "type": "board_level_approval",
      "requires_review": true,
      "approver_roles": ["compliance_officer", "legal_counsel", "security_team", "ciso", "executive_sponsor"],
      "review_turnaround": "20_business_days",
      "security_review_required": true,
      "legal_review_required": true,
      "risk_assessment_required": true,
      "external_audit_required": true,
      "board_notification_required": true
    },
    "review_frequency": "continuous",
    "data_handling": {
      "sensitive_data_allowed": true,
      "pii_allowed": true,
      "phi_allowed": true,
      "regulated_data": true,
      "retention_period": "as_required_by_regulation",
      "encryption_required": true,
      "encryption_at_rest": true,
      "encryption_in_transit": true,
      "data_minimization_required": true,
      "data_anonymization_required": true,
      "zero_knowledge_architecture_preferred": true
    },
    "usage_restrictions": {
      "internal_only": false,
      "customer_facing": true,
      "high_stakes_decisions": true,
      "life_safety_critical": true,
      "human_review_required": true,
      "human_final_decision": true,
      "human_in_the_loop": true,
      "output_validation_required": true,
      "explainability_required": true,
      "independent_validation_required": true
    }
  }',
  '{
    "data_sensitivity": "critical",
    "external_exposure": "critical",
    "model_transparency": "maximum_requirement",
    "misuse_vectors": "critical",
    "legal_risk": "critical",
    "operational_criticality": "critical"
  }',
  '{
    "data_handling": "maximum_regulated_controls",
    "explainability": "mandatory_detailed",
    "human_oversight": "mandatory_continuous",
    "audit_trail": "immutable_forensic_grade",
    "bias_testing": "mandatory_continuous"
  }',
  '["usage_tracking", "forensic_logging", "access_controls", "error_logging", "security_monitoring", "threat_monitoring"]',
  '["full_model_audit", "continuous_monitoring", "human_in_the_loop_validation", "regular_bias_testing", "explainability_certification", "legal_compliance_audit", "external_audit", "penetration_testing", "red_team_exercises"]',
  '{
    "monitoring": ["real_time_continuous_monitoring", "performance_metrics", "bias_metrics", "explainability_metrics", "safety_metrics", "adverse_event_tracking", "regulatory_compliance_tracking"],
    "documentation": ["comprehensive_model_card", "full_risk_assessment", "detailed_mitigation_plans", "data_protection_impact_assessment", "algorithm_impact_assessment", "explainability_documentation", "validation_reports", "external_audit_reports"],
    "training": ["comprehensive_training", "privacy_training", "ethics_training", "bias_awareness_training", "safety_training", "regulatory_compliance_training"],
    "incident_response": ["comprehensive_incident_response_plan", "breach_notification_procedures", "regulatory_reporting_procedures", "escalation_matrix", "crisis_management_procedures", "business_continuity_plan"],
    "insurance": ["professional_liability_insurance", "cyber_insurance", "errors_and_omissions_coverage"],
    "governance": ["ethics_board_oversight", "regular_board_reporting", "stakeholder_engagement", "transparency_reporting"]
  }',
  true,
  '1.0'
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_templates_risk_tier ON policy_templates_enhanced(risk_profile_tier);
CREATE INDEX IF NOT EXISTS idx_templates_industry_tier ON policy_templates_enhanced(industry, risk_profile_tier);

-- Add view for risk profile summary
CREATE OR REPLACE VIEW risk_profile_template_summary AS
SELECT 
  risk_profile_tier,
  COUNT(*) as template_count,
  array_agg(name) as template_names,
  array_agg(industry) as industries
FROM policy_templates_enhanced
WHERE risk_profile_tier IS NOT NULL
GROUP BY risk_profile_tier
ORDER BY 
  CASE risk_profile_tier
    WHEN 'minimal' THEN 1
    WHEN 'low' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'high' THEN 4
    WHEN 'critical' THEN 5
  END;

COMMENT ON VIEW risk_profile_template_summary IS 'Summary of policy templates by risk profile tier';












