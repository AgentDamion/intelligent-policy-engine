-- Update test account email domains from aicomplyr.io to aicomplyr.com
UPDATE customer_onboarding
SET email = 'enterprise.test@aicomplyr.com'
WHERE email = 'enterprise.test@aicomplyr.io';

UPDATE customer_onboarding
SET email = 'partner.test@aicomplyr.com'
WHERE email = 'partner.test@aicomplyr.io';

UPDATE customer_onboarding
SET email = 'vendor.test@aicomplyr.com'
WHERE email = 'vendor.test@aicomplyr.io';