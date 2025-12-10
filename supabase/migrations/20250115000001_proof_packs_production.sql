-- ================================
-- PRODUCTION PROOF PACKS
-- ================================
-- Migration: 20250115000001
-- Description: Add production-ready Proof Packs for EU AI Act, US Pharma, and HIPAA

-- ============================================
-- EU AI Act - Public AI Content (Article 50)
-- ============================================
INSERT INTO public.proof_packs (id, enterprise_id, organization_id, label, description, priority, applies_when, severity, version) VALUES
  ('eu_ai_act_public_content_v1', NULL, NULL, 'EU AI Act - Public AI Content', 
   'EU AI Act Article 50 requirements for public-facing AI-generated content', 
   10, 
   '{"jurisdictions": ["EU"], "channels": ["public", "paid_social"], "assetTypes": ["image", "video", "text"], "aiUsed": true}'::jsonb,
   'regulatory', '1.0')
ON CONFLICT (id) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  applies_when = EXCLUDED.applies_when,
  priority = EXCLUDED.priority,
  severity = EXCLUDED.severity,
  version = EXCLUDED.version,
  updated_at = NOW();

INSERT INTO public.proof_pack_atoms (proof_pack_id, atom_id, required, constraints) VALUES
  ('eu_ai_act_public_content_v1', 'AI_ORIGIN_LABEL', TRUE, '{}'::jsonb),
  ('eu_ai_act_public_content_v1', 'C2PA_MANIFEST_HASH', TRUE, '{}'::jsonb),
  ('eu_ai_act_public_content_v1', 'HUMAN_REVIEW_EVENT', TRUE, '{}'::jsonb),
  ('eu_ai_act_public_content_v1', 'POLICY_SNAPSHOT_ID', TRUE, '{}'::jsonb),
  ('eu_ai_act_public_content_v1', 'JURISDICTION_TAGS', TRUE, '{"allowedValues": ["EU"]}'::jsonb),
  ('eu_ai_act_public_content_v1', 'TOOL_VERSION_LIST', FALSE, '{}'::jsonb)
ON CONFLICT (proof_pack_id, atom_id) DO UPDATE SET 
  required = EXCLUDED.required,
  constraints = EXCLUDED.constraints;

-- ============================================
-- US Pharma Promotional Content (FDA)
-- ============================================
INSERT INTO public.proof_packs (id, enterprise_id, organization_id, label, description, priority, applies_when, severity, version) VALUES
  ('us_pharma_promo_v1', NULL, NULL, 'US Pharma Promotional Content', 
   'FDA requirements for pharmaceutical promotional content', 
   10, 
   '{"jurisdictions": ["US"], "categories": ["pharma_promo"], "assetTypes": ["image", "video", "text"]}'::jsonb,
   'regulatory', '1.0')
ON CONFLICT (id) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  applies_when = EXCLUDED.applies_when,
  priority = EXCLUDED.priority,
  severity = EXCLUDED.severity,
  version = EXCLUDED.version,
  updated_at = NOW();

INSERT INTO public.proof_pack_atoms (proof_pack_id, atom_id, required, constraints) VALUES
  ('us_pharma_promo_v1', 'HUMAN_REVIEW_EVENT', TRUE, '{}'::jsonb),
  ('us_pharma_promo_v1', 'POLICY_SNAPSHOT_ID', TRUE, '{}'::jsonb),
  ('us_pharma_promo_v1', 'DATA_CLASSIFICATION', TRUE, '{"allowedValues": ["PHI", "PII"]}'::jsonb),
  ('us_pharma_promo_v1', 'VENDOR_CERTIFICATION', TRUE, '{}'::jsonb),
  ('us_pharma_promo_v1', 'CONTENT_MODERATION_RESULT', TRUE, '{}'::jsonb),
  ('us_pharma_promo_v1', 'AI_ORIGIN_LABEL', FALSE, '{}'::jsonb)
ON CONFLICT (proof_pack_id, atom_id) DO UPDATE SET 
  required = EXCLUDED.required,
  constraints = EXCLUDED.constraints;

-- ============================================
-- US HIPAA Healthcare Data Processing
-- ============================================
INSERT INTO public.proof_packs (id, enterprise_id, organization_id, label, description, priority, applies_when, severity, version) VALUES
  ('us_hipaa_healthcare_data_v1', NULL, NULL, 'HIPAA Healthcare Data Processing', 
   'HIPAA requirements for processing healthcare data', 
   10, 
   '{"jurisdictions": ["US"], "categories": ["healthcare"], "assetTypes": ["text", "image"]}'::jsonb,
   'regulatory', '1.0')
ON CONFLICT (id) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  applies_when = EXCLUDED.applies_when,
  priority = EXCLUDED.priority,
  severity = EXCLUDED.severity,
  version = EXCLUDED.version,
  updated_at = NOW();

INSERT INTO public.proof_pack_atoms (proof_pack_id, atom_id, required, constraints) VALUES
  ('us_hipaa_healthcare_data_v1', 'DATA_CLASSIFICATION', TRUE, '{"allowedValues": ["PHI"]}'::jsonb),
  ('us_hipaa_healthcare_data_v1', 'VENDOR_CERTIFICATION', TRUE, '{"allowedValues": ["HIPAA", "SOC2"]}'::jsonb),
  ('us_hipaa_healthcare_data_v1', 'POLICY_SNAPSHOT_ID', TRUE, '{}'::jsonb),
  ('us_hipaa_healthcare_data_v1', 'HUMAN_REVIEW_EVENT', TRUE, '{}'::jsonb)
ON CONFLICT (proof_pack_id, atom_id) DO UPDATE SET 
  required = EXCLUDED.required,
  constraints = EXCLUDED.constraints;

