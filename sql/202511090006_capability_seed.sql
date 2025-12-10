-- Seed core capabilities, implementations, and default selection policies

-- Capabilities
INSERT INTO public.capabilities (capability_key, description)
VALUES
  ('evaluate_policy_rule', 'Evaluate a policy rule against a candidate request'),
  ('detect_policy_drift', 'Detect differences between EPS versions and live usage'),
  ('assess_tool_risk', 'Assess compliance risk for a tool submission'),
  ('generate_proof_bundle', 'Assemble cryptographic proof bundles from ledger events'),
  ('estimate_impact', 'Estimate the impact of a proposed policy change'),
  ('explain_decision', 'Generate human-readable explanations for AI decisions')
ON CONFLICT (capability_key) DO NOTHING;

-- Implementations (fast and quality tiers for each capability)
WITH base_caps AS (
  SELECT id, capability_key
  FROM public.capabilities
  WHERE capability_key IN (
    'evaluate_policy_rule',
    'detect_policy_drift',
    'assess_tool_risk',
    'generate_proof_bundle',
    'estimate_impact',
    'explain_decision'
  )
),
impl_catalog(vendor, model, tier, cost_per_1k_tokens, slo_p95_ms) AS (
  VALUES
    ('openai', 'gpt-4.1-mini', 'fast', 0.15, 1200),
    ('openai', 'gpt-4.1-nano', 'fast', 0.10, 900),
    ('anthropic', 'claude-3-5-sonnet', 'quality', 0.30, 1800),
    ('google', 'gemini-2.5-flash', 'quality', 0.25, 2000)
)
INSERT INTO public.capability_implementations (
  capability_id,
  enterprise_id,
  name,
  provider,
  tier,
  region,
  cost_model,
  config,
  sla
)
SELECT
  caps.id,
  NULL,
  impl.model,
  impl.vendor,
  impl.tier,
  'us-east-1',
  jsonb_build_object('cost_per_1k_tokens', impl.cost_per_1k_tokens),
  jsonb_build_object('default', true),
  jsonb_build_object('p95_ms', impl.slo_p95_ms)
FROM base_caps caps
CROSS JOIN impl_catalog impl
ON CONFLICT (capability_id, provider, name, tier)
DO NOTHING;

-- Default selection policies (global scope)
WITH capability_targets AS (
  SELECT id, capability_key
  FROM public.capabilities
)
INSERT INTO public.selection_policies (
  enterprise_id,
  capability_id,
  strategy,
  config
)
SELECT
  NULL,
  ct.id,
  'tier-preference',
  CASE
    WHEN ct.capability_key IN ('assess_tool_risk', 'estimate_impact')
      THEN jsonb_build_object(
             'prefer', 'quality',
             'escalate_on_failure', true,
             'max_cost_per_1k', 0.35
           )
    ELSE jsonb_build_object(
           'prefer', 'fast',
           'escalate_on_failure', true,
           'max_cost_per_1k', 0.20
         )
  END
FROM capability_targets ct
WHERE NOT EXISTS (
  SELECT 1
  FROM public.selection_policies sp
  WHERE sp.enterprise_id IS NULL
    AND sp.capability_id = ct.id
);

