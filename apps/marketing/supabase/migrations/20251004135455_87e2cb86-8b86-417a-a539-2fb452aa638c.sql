-- Create test account invitations for PharmaCorp enterprise
-- These allow the test accounts to automatically join the correct enterprise/workspace

INSERT INTO customer_onboarding (
  email,
  company_name,
  workspace_name,
  magic_token,
  enterprise_id,
  workspace_id,
  account_type,
  target_role,
  invitation_type,
  expires_at
) VALUES
  -- Enterprise test account
  (
    'enterprise.test@aicomplyr.io',
    'PharmaCorp Global',
    'PharmaCorp Compliance',
    encode(gen_random_bytes(32), 'hex'),
    'b3a15512-fb3c-43e2-9d70-b6fdd8dedea6',
    '550e8400-e29b-41d4-a716-446655440001',
    'enterprise',
    'admin',
    'customer_signup',
    NOW() + INTERVAL '365 days'
  ),
  -- Partner/Agency test account
  (
    'partner.test@aicomplyr.io',
    'PharmaCorp Global',
    'PharmaCorp Compliance',
    encode(gen_random_bytes(32), 'hex'),
    'b3a15512-fb3c-43e2-9d70-b6fdd8dedea6',
    '550e8400-e29b-41d4-a716-446655440001',
    'partner',
    'member',
    'customer_signup',
    NOW() + INTERVAL '365 days'
  ),
  -- Vendor test account
  (
    'vendor.test@aicomplyr.io',
    'PharmaCorp Global',
    'PharmaCorp Compliance',
    encode(gen_random_bytes(32), 'hex'),
    'b3a15512-fb3c-43e2-9d70-b6fdd8dedea6',
    '550e8400-e29b-41d4-a716-446655440001',
    'partner',
    'viewer',
    'customer_signup',
    NOW() + INTERVAL '365 days'
  );