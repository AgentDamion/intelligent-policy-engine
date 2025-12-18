-- Seed baseline feature flags for pilot organizations.
INSERT INTO public.features (enterprise_id, feature_key, enabled, rollout_strategy, metadata)
VALUES 
    (NULL, 'proofs.anchor.enabled', FALSE, 'global_default', '{}'::JSONB),
    (NULL, 'broker.kill_switch', FALSE, 'global_default', '{}'::JSONB),
    (NULL, 'governance.constellation', TRUE, 'global_default', '{}'::JSONB)
ON CONFLICT DO NOTHING;

