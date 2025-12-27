-- =============================================================================
-- MIGRATION: Seed Regulatory Frameworks
-- PURPOSE: Populate regulatory frameworks and requirements for P0/P1 frameworks
-- =============================================================================

-- =============================================================================
-- EU AI ACT (P0) - 47 Requirements
-- =============================================================================

DO $$
DECLARE
  eu_ai_act_id UUID;
BEGIN
  -- Insert or get EU AI Act framework
  INSERT INTO public.regulatory_frameworks (
    name, short_name, jurisdiction, jurisdiction_display, regulatory_body,
    framework_type, risk_approach, scope_category,
    enacted_date, effective_date, enforcement_date, phase_dates,
    status, summary, key_obligations, penalty_info, source_url
  ) VALUES (
    'EU Artificial Intelligence Act',
    'EU_AI_ACT',
    'EU',
    'European Union',
    'European Commission',
    'legislation',
    'risk_based',
    ARRAY['high_risk_ai', 'general_purpose', 'transparency', 'prohibited_practices'],
    '2024-07-12',
    '2024-08-01',
    '2026-08-02',
    '{"prohibited_practices": "2025-02-02", "gpai_obligations": "2025-08-02", "high_risk": "2026-08-02"}'::jsonb,
    'active',
    'Comprehensive risk-based regulation of AI systems in the European Union, establishing requirements for high-risk AI systems and prohibitions on certain AI practices.',
    ARRAY[
      'Risk management system',
      'Data governance',
      'Technical documentation',
      'Record-keeping',
      'Transparency and provision of information',
      'Human oversight',
      'Accuracy, robustness and cybersecurity'
    ],
    '{"prohibited_practices": {"max_fine_eur": 35000000, "turnover_pct": 7}, "high_risk_violations": {"max_fine_eur": 15000000, "turnover_pct": 3}, "incorrect_info": {"max_fine_eur": 7500000, "turnover_pct": 1.5}}'::jsonb,
    'https://eur-lex.europa.eu/eli/reg/2024/1689'
  )
  ON CONFLICT (jurisdiction, short_name) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO eu_ai_act_id;

  -- If framework already exists, get its ID
  IF eu_ai_act_id IS NULL THEN
    SELECT id INTO eu_ai_act_id FROM public.regulatory_frameworks WHERE short_name = 'EU_AI_ACT';
  END IF;

  -- Insert key requirements (Article 9 - Risk Management System)
  INSERT INTO public.framework_requirements (
    framework_id, requirement_code, requirement_type, title, description,
    article_reference, section_reference, applicability_criteria,
    risk_categories, actor_types, evidence_required, compliance_indicators,
    compliance_weight, is_critical, sort_order
  ) VALUES (
    eu_ai_act_id,
    'ART_9',
    'mandatory',
    'Risk Management System',
    'Providers of high-risk AI systems shall establish, implement, document and maintain a risk management system.',
    'Article 9',
    'Chapter III, Section 2',
    '{"system_classification": ["high_risk"]}'::jsonb,
    ARRAY['high_risk'],
    ARRAY['provider'],
    '{
      "evidence_types": [
        {
          "type": "document",
          "name": "Risk Management Documentation",
          "required": true,
          "aicomplyr_source": "policy_attachments"
        },
        {
          "type": "audit_trail",
          "name": "Risk Assessment Activities",
          "required": true,
          "aicomplyr_source": "governance_actions",
          "aicomplyr_filter": {"action_category": "risk_assessment"}
        },
        {
          "type": "workflow",
          "name": "Risk Mitigation Workflow",
          "required": true,
          "aicomplyr_source": "governance_threads",
          "aicomplyr_filter": {"thread_type": "risk_mitigation"}
        }
      ]
    }'::jsonb,
    ARRAY['documented_risk_assessment', 'identified_risks', 'mitigation_measures', 'residual_risk_acceptance'],
    8,
    true,
    1
  ) ON CONFLICT DO NOTHING;

  -- Article 10 - Data Governance
  INSERT INTO public.framework_requirements (
    framework_id, requirement_code, requirement_type, title, description,
    article_reference, section_reference, applicability_criteria,
    risk_categories, actor_types, evidence_required, compliance_indicators,
    compliance_weight, is_critical, sort_order
  ) VALUES (
    eu_ai_act_id,
    'ART_10',
    'mandatory',
    'Data Governance',
    'Training, validation and testing data sets shall be subject to appropriate data governance and management practices.',
    'Article 10',
    'Chapter III, Section 2',
    '{"system_classification": ["high_risk"]}'::jsonb,
    ARRAY['high_risk'],
    ARRAY['provider'],
    '{
      "evidence_types": [
        {
          "type": "policy_config",
          "name": "Data Governance Policy",
          "required": true,
          "aicomplyr_source": "policies",
          "aicomplyr_field": "data_governance_rules"
        },
        {
          "type": "audit_trail",
          "name": "Data Quality Monitoring",
          "required": true,
          "aicomplyr_source": "vera.events",
          "aicomplyr_filter": {"event_type": "data_quality_check"}
        }
      ]
    }'::jsonb,
    ARRAY['data_quality_measures', 'data_bias_mitigation', 'data_provenance'],
    7,
    true,
    2
  ) ON CONFLICT DO NOTHING;

  -- Article 12 - Record-Keeping
  INSERT INTO public.framework_requirements (
    framework_id, requirement_code, requirement_type, title, description,
    article_reference, section_reference, applicability_criteria,
    risk_categories, actor_types, evidence_required, compliance_indicators,
    compliance_weight, is_critical, sort_order
  ) VALUES (
    eu_ai_act_id,
    'ART_12',
    'mandatory',
    'Record-Keeping',
    'Providers of high-risk AI systems shall keep the logs automatically generated by their systems.',
    'Article 12',
    'Chapter III, Section 2',
    '{"system_classification": ["high_risk"]}'::jsonb,
    ARRAY['high_risk'],
    ARRAY['provider'],
    '{
      "evidence_types": [
        {
          "type": "audit_trail",
          "name": "Immutable Audit Logs",
          "required": true,
          "aicomplyr_source": "vera.events",
          "aicomplyr_filter": {"immutable": true}
        },
        {
          "type": "metadata",
          "name": "Log Retention Policy",
          "required": true,
          "aicomplyr_source": "policy_config",
          "aicomplyr_field": "audit_retention_period"
        }
      ]
    }'::jsonb,
    ARRAY['immutable_logs', 'log_retention', 'log_accessibility'],
    9,
    true,
    3
  ) ON CONFLICT DO NOTHING;

  -- Article 13 - Transparency
  INSERT INTO public.framework_requirements (
    framework_id, requirement_code, requirement_type, title, description,
    article_reference, section_reference, applicability_criteria,
    risk_categories, actor_types, evidence_required, compliance_indicators,
    compliance_weight, is_critical, sort_order
  ) VALUES (
    eu_ai_act_id,
    'ART_13',
    'mandatory',
    'Transparency and Provision of Information',
    'High-risk AI systems shall be designed and developed in such a way that natural persons can be informed that they are interacting with an AI system.',
    'Article 13',
    'Chapter III, Section 2',
    '{"system_classification": ["high_risk", "limited_risk"]}'::jsonb,
    ARRAY['high_risk', 'limited_risk'],
    ARRAY['provider', 'deployer'],
    '{
      "evidence_types": [
        {
          "type": "attestation",
          "name": "Disclosure Generation",
          "required": true,
          "aicomplyr_source": "proof_bundle_attestations",
          "aicomplyr_field": "disclosure_attestation"
        },
        {
          "type": "workflow",
          "name": "User Notification Workflow",
          "required": true,
          "aicomplyr_source": "governance_actions",
          "aicomplyr_filter": {"action_type": "user_notification"}
        }
      ]
    }'::jsonb,
    ARRAY['user_disclosure', 'ai_origin_labeling', 'transparency_measures'],
    6,
    false,
    4
  ) ON CONFLICT DO NOTHING;

  -- Article 14 - Human Oversight
  INSERT INTO public.framework_requirements (
    framework_id, requirement_code, requirement_type, title, description,
    article_reference, section_reference, applicability_criteria,
    risk_categories, actor_types, evidence_required, compliance_indicators,
    compliance_weight, is_critical, sort_order
  ) VALUES (
    eu_ai_act_id,
    'ART_14',
    'mandatory',
    'Human Oversight',
    'High-risk AI systems shall be designed and developed in such a way that they can be effectively overseen by natural persons.',
    'Article 14',
    'Chapter III, Section 2',
    '{"system_classification": ["high_risk"]}'::jsonb,
    ARRAY['high_risk'],
    ARRAY['provider', 'deployer'],
    '{
      "evidence_types": [
        {
          "type": "workflow",
          "name": "Human Review Workflow",
          "required": true,
          "aicomplyr_source": "governance_actions",
          "aicomplyr_filter": {"action_type": "human_review", "required": true}
        },
        {
          "type": "attestation",
          "name": "Human Oversight Confirmation",
          "required": true,
          "aicomplyr_source": "proof_bundle_attestations",
          "aicomplyr_field": "human_oversight_attestation"
        }
      ]
    }'::jsonb,
    ARRAY['human_review_workflow', 'override_capability', 'oversight_documentation'],
    8,
    true,
    5
  ) ON CONFLICT DO NOTHING;

END $$;

-- =============================================================================
-- FDA 21 CFR PART 11 (P0) - 8 Requirements
-- =============================================================================

DO $$
DECLARE
  fda_framework_id UUID;
BEGIN
  INSERT INTO public.regulatory_frameworks (
    name, short_name, jurisdiction, jurisdiction_display, regulatory_body,
    framework_type, risk_approach, scope_category,
    effective_date, enforcement_date,
    status, summary, key_obligations, penalty_info, source_url
  ) VALUES (
    'FDA 21 CFR Part 11',
    'FDA_21CFR11',
    'US-Federal',
    'United States - Federal',
    'FDA',
    'regulation',
    'principles_based',
    ARRAY['electronic_records', 'electronic_signatures', 'audit_trails'],
    '1997-08-20',
    '1997-08-20',
    'active',
    'Electronic records and signatures regulation. Requires immutable audit trails, access controls, and system validation.',
    ARRAY[
      'Immutable audit trails',
      'System validation',
      'Access controls',
      'Electronic signature requirements'
    ],
    '{"violations": {"warning_letters": true, "product_seizures": true, "injunctions": true}}'::jsonb,
    'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application'
  )
  ON CONFLICT (jurisdiction, short_name) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO fda_framework_id;

  IF fda_framework_id IS NULL THEN
    SELECT id INTO fda_framework_id FROM public.regulatory_frameworks WHERE short_name = 'FDA_21CFR11';
  END IF;

  -- 21 CFR 11.10(e) - Audit Trails
  INSERT INTO public.framework_requirements (
    framework_id, requirement_code, requirement_type, title, description,
    article_reference, section_reference, applicability_criteria,
    risk_categories, actor_types, evidence_required, compliance_indicators,
    compliance_weight, is_critical, sort_order
  ) VALUES (
    fda_framework_id,
    '21CFR11_10E',
    'mandatory',
    'Secure, Computer-Generated, Time-Stamped Audit Trails',
    'System must maintain secure, computer-generated, time-stamped audit trails.',
    '21 CFR 11.10(e)',
    'Subpart B',
    '{"industry": "pharmaceutical", "record_type": "electronic"}'::jsonb,
    ARRAY['all'],
    ARRAY['provider', 'deployer'],
    '{
      "evidence_types": [
        {
          "type": "audit_trail",
          "name": "Immutable Audit Logs",
          "required": true,
          "aicomplyr_source": "vera.events",
          "aicomplyr_filter": {"immutable": true, "timestamped": true}
        }
      ]
    }'::jsonb,
    ARRAY['immutable_audit_logs', 'timestamp_verification', 'user_identification'],
    10,
    true,
    1
  ) ON CONFLICT DO NOTHING;

  -- 21 CFR 11.10(a) - System Validation
  INSERT INTO public.framework_requirements (
    framework_id, requirement_code, requirement_type, title, description,
    article_reference, section_reference, applicability_criteria,
    risk_categories, actor_types, evidence_required, compliance_indicators,
    compliance_weight, is_critical, sort_order
  ) VALUES (
    fda_framework_id,
    '21CFR11_10A',
    'mandatory',
    'Validation of Systems',
    'Validation of systems to ensure accuracy, reliability, and consistent intended performance.',
    '21 CFR 11.10(a)',
    'Subpart B',
    '{"industry": "pharmaceutical", "system_type": "electronic"}'::jsonb,
    ARRAY['all'],
    ARRAY['provider'],
    '{
      "evidence_types": [
        {
          "type": "document",
          "name": "System Validation Documentation",
          "required": true,
          "aicomplyr_source": "policy_attachments"
        },
        {
          "type": "metadata",
          "name": "Validation Testing Records",
          "required": true,
          "aicomplyr_source": "policy_config",
          "aicomplyr_field": "validation_records"
        }
      ]
    }'::jsonb,
    ARRAY['system_validation', 'documentation', 'testing_records'],
    9,
    true,
    2
  ) ON CONFLICT DO NOTHING;

END $$;

-- =============================================================================
-- NY S.8420-A (P0) - 1 Requirement
-- =============================================================================

DO $$
DECLARE
  ny_framework_id UUID;
BEGIN
  INSERT INTO public.regulatory_frameworks (
    name, short_name, jurisdiction, jurisdiction_display, regulatory_body,
    framework_type, risk_approach, scope_category,
    effective_date, enforcement_date,
    status, summary, key_obligations, penalty_info, source_url
  ) VALUES (
    'NY Synthetic Performer Disclosure Law',
    'NY_S.8420-A',
    'US-NY',
    'United States - New York',
    'NY State Legislature',
    'legislation',
    'principles_based',
    ARRAY['disclosure', 'transparency', 'advertising'],
    '2024-12-01',
    '2026-06-01',
    'enacted',
    'Requires conspicuous disclosure when advertisements contain AI-generated human likenesses. Applies to ads distributed in New York.',
    ARRAY['Conspicuous disclosure of AI-generated content'],
    '{"violations": {"fine_range": "$1,000-$5,000", "per_violation": true}}'::jsonb,
    'https://legislation.nysenate.gov/'
  )
  ON CONFLICT (jurisdiction, short_name) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO ny_framework_id;

  IF ny_framework_id IS NULL THEN
    SELECT id INTO ny_framework_id FROM public.regulatory_frameworks WHERE short_name = 'NY_S.8420-A';
  END IF;

  INSERT INTO public.framework_requirements (
    framework_id, requirement_code, requirement_type, title, description,
    article_reference, section_reference, applicability_criteria,
    risk_categories, actor_types, evidence_required, compliance_indicators,
    compliance_weight, is_critical, sort_order
  ) VALUES (
    ny_framework_id,
    'S8420A_S2A',
    'mandatory',
    'Conspicuous Disclosure Required',
    'Conspicuous disclosure required when advertisement contains AI-generated human likeness',
    'S.8420-A §2(a)',
    'Section 2',
    '{"content_type": "synthetic_performer", "distribution": "advertising", "region": ["NY"]}'::jsonb,
    ARRAY['all'],
    ARRAY['provider', 'deployer'],
    '{
      "evidence_types": [
        {
          "type": "attestation",
          "name": "Disclosure Attestation",
          "required": true,
          "aicomplyr_source": "proof_bundle_attestations",
          "aicomplyr_field": "disclosure_attestation"
        },
        {
          "type": "workflow",
          "name": "Disclosure Generation",
          "required": true,
          "aicomplyr_source": "governance_actions",
          "aicomplyr_filter": {"action_type": "disclosure_generation"}
        }
      ]
    }'::jsonb,
    ARRAY['disclosure_attestation', 'ai_tool_classification', 'distribution_metadata'],
    8,
    true,
    1
  ) ON CONFLICT DO NOTHING;

END $$;

-- =============================================================================
-- GDPR AI PROCESSING (P1) - Key Requirements
-- =============================================================================

DO $$
DECLARE
  gdpr_framework_id UUID;
BEGIN
  INSERT INTO public.regulatory_frameworks (
    name, short_name, jurisdiction, jurisdiction_display, regulatory_body,
    framework_type, risk_approach, scope_category,
    effective_date, enforcement_date,
    status, summary, key_obligations, penalty_info, source_url
  ) VALUES (
    'GDPR - AI Processing',
    'GDPR_AI',
    'EU',
    'European Union',
    'European Commission',
    'regulation',
    'principles_based',
    ARRAY['data_protection', 'automated_decision_making', 'privacy'],
    '2018-05-25',
    '2018-05-25',
    'active',
    'Data protection regulation with specific requirements for automated decision-making and AI processing of personal data.',
    ARRAY[
      'Right to explanation',
      'Data minimization',
      'Purpose limitation',
      'Automated decision-making safeguards'
    ],
    '{"violations": {"max_fine_eur": 20000000, "turnover_pct": 4}}'::jsonb,
    'https://gdpr.eu/'
  )
  ON CONFLICT (jurisdiction, short_name) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO gdpr_framework_id;

  IF gdpr_framework_id IS NULL THEN
    SELECT id INTO gdpr_framework_id FROM public.regulatory_frameworks WHERE short_name = 'GDPR_AI';
  END IF;

  -- Article 22 - Automated Decision Making
  INSERT INTO public.framework_requirements (
    framework_id, requirement_code, requirement_type, title, description,
    article_reference, section_reference, applicability_criteria,
    risk_categories, actor_types, evidence_required, compliance_indicators,
    compliance_weight, is_critical, sort_order
  ) VALUES (
    gdpr_framework_id,
    'GDPR_ART22',
    'mandatory',
    'Automated Individual Decision-Making',
    'Data subject has the right not to be subject to a decision based solely on automated processing.',
    'Article 22',
    'Chapter III',
    '{"processing_type": "automated_decision_making", "personal_data": true}'::jsonb,
    ARRAY['all'],
    ARRAY['provider', 'deployer'],
    '{
      "evidence_types": [
        {
          "type": "workflow",
          "name": "Human Review Option",
          "required": true,
          "aicomplyr_source": "governance_actions",
          "aicomplyr_filter": {"action_type": "human_review", "required": false}
        },
        {
          "type": "attestation",
          "name": "Right to Explanation",
          "required": true,
          "aicomplyr_source": "proof_bundle_attestations",
          "aicomplyr_field": "explanation_provided"
        }
      ]
    }'::jsonb,
    ARRAY['human_review_option', 'explanation_right', 'decision_transparency'],
    7,
    true,
    1
  ) ON CONFLICT DO NOTHING;

END $$;

-- =============================================================================
-- DIGITAL SERVICES ACT (P1) - Key Requirements
-- =============================================================================

DO $$
DECLARE
  dsa_framework_id UUID;
BEGIN
  INSERT INTO public.regulatory_frameworks (
    name, short_name, jurisdiction, jurisdiction_display, regulatory_body,
    framework_type, risk_approach, scope_category,
    effective_date, enforcement_date,
    status, summary, key_obligations, penalty_info, source_url
  ) VALUES (
    'EU Digital Services Act',
    'EU_DSA',
    'EU',
    'European Union',
    'European Commission',
    'legislation',
    'principles_based',
    ARRAY['transparency', 'online_platforms', 'advertising'],
    '2024-02-17',
    '2024-02-17',
    'active',
    'Mandates transparency in online advertising, including ad repositories and audit trails. First enforcement: €120M fine against X (Dec 2024).',
    ARRAY[
      'Transparent advertising repository',
      'Audit trail maintenance',
      'Researcher access'
    ],
    '{"violations": {"max_fine_eur": 120000000, "turnover_pct": 6}}'::jsonb,
    'https://digital-markets-act.ec.europa.eu/'
  )
  ON CONFLICT (jurisdiction, short_name) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO dsa_framework_id;

  IF dsa_framework_id IS NULL THEN
    SELECT id INTO dsa_framework_id FROM public.regulatory_frameworks WHERE short_name = 'EU_DSA';
  END IF;

  -- Article 39 - Advertising Repository
  INSERT INTO public.framework_requirements (
    framework_id, requirement_code, requirement_type, title, description,
    article_reference, section_reference, applicability_criteria,
    risk_categories, actor_types, evidence_required, compliance_indicators,
    compliance_weight, is_critical, sort_order
  ) VALUES (
    dsa_framework_id,
    'DSA_ART39',
    'mandatory',
    'Transparent Advertising Repository',
    'Transparent advertising repository with accessible audit trails',
    'Article 39',
    'Chapter III',
    '{"distribution": "online_advertising", "region": ["EU"]}'::jsonb,
    ARRAY['all'],
    ARRAY['provider', 'deployer'],
    '{
      "evidence_types": [
        {
          "type": "audit_trail",
          "name": "Ad Repository Access Logs",
          "required": true,
          "aicomplyr_source": "vera.events",
          "aicomplyr_filter": {"event_type": "ad_repository_access"}
        },
        {
          "type": "metadata",
          "name": "Repository Accessibility",
          "required": true,
          "aicomplyr_source": "policy_config",
          "aicomplyr_field": "repository_public_access"
        }
      ]
    }'::jsonb,
    ARRAY['ad_repository', 'audit_trail', 'researcher_access'],
    8,
    true,
    1
  ) ON CONFLICT DO NOTHING;

END $$;

-- =============================================================================
-- CREATE EVIDENCE MAPPINGS FOR CRITICAL REQUIREMENTS
-- =============================================================================

-- Map EU AI Act Article 9 to evidence sources
INSERT INTO public.requirement_evidence_map (
  requirement_id, evidence_type, evidence_source, evidence_field, evidence_filter,
  validation_rule, validation_params, coverage_contribution, is_required
)
SELECT 
  fr.id,
  'audit_trail',
  'governance_actions',
  'action_type',
  '{"action_category": "risk_assessment"}'::jsonb,
  'count_gte',
  '{"min_count": 1}'::jsonb,
  0.4,
  true
FROM public.framework_requirements fr
JOIN public.regulatory_frameworks rf ON fr.framework_id = rf.id
WHERE rf.short_name = 'EU_AI_ACT' AND fr.requirement_code = 'ART_9'
ON CONFLICT DO NOTHING;

-- Map FDA 21 CFR 11.10(e) to vera.events
INSERT INTO public.requirement_evidence_map (
  requirement_id, evidence_type, evidence_source, evidence_field, evidence_filter,
  validation_rule, validation_params, coverage_contribution, is_required
)
SELECT 
  fr.id,
  'audit_trail',
  'vera.events',
  'event_type',
  '{"immutable": true, "timestamped": true}'::jsonb,
  'exists',
  '{}'::jsonb,
  1.0,
  true
FROM public.framework_requirements fr
JOIN public.regulatory_frameworks rf ON fr.framework_id = rf.id
WHERE rf.short_name = 'FDA_21CFR11' AND fr.requirement_code = '21CFR11_10E'
ON CONFLICT DO NOTHING;

-- Map NY S.8420-A to disclosure attestations
INSERT INTO public.requirement_evidence_map (
  requirement_id, evidence_type, evidence_source, evidence_field, evidence_filter,
  validation_rule, validation_params, coverage_contribution, is_required
)
SELECT 
  fr.id,
  'attestation',
  'proof_bundle_attestations',
  'disclosure_attestation',
  '{"attested": true}'::jsonb,
  'exists',
  '{}'::jsonb,
  1.0,
  true
FROM public.framework_requirements fr
JOIN public.regulatory_frameworks rf ON fr.framework_id = rf.id
WHERE rf.short_name = 'NY_S.8420-A' AND fr.requirement_code = 'S8420A_S2A'
ON CONFLICT DO NOTHING;

