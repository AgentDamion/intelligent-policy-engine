-- Seed Data: Sample Policy Rules
-- This file provides two sample rules to test the prioritization and semver logic
-- in the policy-evaluate Edge Function.

-- Create seed function that's safe to run multiple times (idempotent)
CREATE OR REPLACE FUNCTION seed_policy_rules_if_empty()
RETURNS void AS $$
DECLARE
    rule_count INTEGER;
    test_tenant_id UUID;
BEGIN
    -- Check if rules already exist
    SELECT COUNT(*) INTO rule_count FROM public.policy_rules;
    
    IF rule_count > 0 THEN
        RAISE NOTICE 'Policy rules already exist (%), skipping seed', rule_count;
        RETURN;
    END IF;
    
    -- Get first user ID from auth.users for testing
    SELECT id INTO test_tenant_id FROM auth.users LIMIT 1;
    
    IF test_tenant_id IS NULL THEN
        RAISE WARNING 'No users found in auth.users - cannot seed policy rules';
        RETURN;
    END IF;
    
    -- Seed Rule 1: High-Priority Prohibition Rule (Priority 10)
    -- Prohibits Midjourney versions less than 6.0.0
    INSERT INTO public.policy_rules (tenant_id, context_id, priority, is_active, rule)
    VALUES (
        test_tenant_id,
        'global-media-tools',
        10,
        TRUE,
        '{
            "rule_id": "R1-PROHIBIT-OLD-MJ",
            "name": "Prohibit Midjourney < 6.0.0",
            "priority": 10,
            "is_active": true,
            "context_id": "global-media-tools",
            "conditions": {
                "operator": "AND",
                "clauses": [
                    { "field": "tool.name", "operator": "equals", "value": "Midjourney" },
                    { "field": "tool.version", "operator": "semver_less_than", "value": "6.0.0" }
                ]
            },
            "decision": {
                "status": "Prohibited",
                "reason": "Midjourney versions older than 6.0.0 are not compliant with current security standards.",
                "audit_trigger": true
            }
        }'::jsonb
    );
    
    -- Seed Rule 2: Lower-Priority Review Rule (Priority 50)
    -- Requires review for any tool version that cannot be validated
    INSERT INTO public.policy_rules (tenant_id, context_id, priority, is_active, rule)
    VALUES (
        test_tenant_id,
        'global-media-tools',
        50,
        TRUE,
        '{
            "rule_id": "R2-REVIEW-UNKNOWN",
            "name": "Review Unknown/Unversioned Tools",
            "priority": 50,
            "is_active": true,
            "context_id": "global-media-tools",
            "conditions": {
                "operator": "OR",
                "clauses": [
                    { "field": "tool.version", "operator": "equals", "value": "unknown" },
                    { "field": "tool.version", "operator": "equals", "value": "N/A" }
                ]
            },
            "decision": {
                "status": "RequiresReview",
                "reason": "Tool version information is missing or unrecognized, requiring manual safety review.",
                "audit_trigger": false
            }
        }'::jsonb
    );
    
    RAISE NOTICE 'Seeded 2 sample policy rules for tenant %', test_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Execute the seed function
SELECT seed_policy_rules_if_empty();

-- Optional: Drop the function after use (commented out to keep it available for future use)
-- DROP FUNCTION IF EXISTS seed_policy_rules_if_empty();
