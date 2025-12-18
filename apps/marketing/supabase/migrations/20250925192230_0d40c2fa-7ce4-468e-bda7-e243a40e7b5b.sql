-- Fix the test user's email confirmation status (only email_confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'enterprise.test@aicomply.io' AND email_confirmed_at IS NULL;

-- Also fix the partner test user if it exists
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'partner.test@aicomplyr.io' AND email_confirmed_at IS NULL;

-- Update the existing profile to have an account type
UPDATE profiles 
SET account_type = 'enterprise'
WHERE id = '07006852-9243-40e8-b81c-6195e1fc5691' AND account_type IS NULL;