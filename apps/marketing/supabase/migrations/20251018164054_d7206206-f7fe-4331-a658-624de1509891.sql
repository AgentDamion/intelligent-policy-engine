-- Align existing policy_conflicts table with Phase 3 requirements
-- Add missing columns and update schema

-- Add new columns to policy_conflicts
ALTER TABLE public.policy_conflicts 
  ADD COLUMN IF NOT EXISTS conflicting_rule TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS resolution_status TEXT CHECK (resolution_status IN ('unresolved', 'resolved', 'acknowledged'));

-- Migrate existing data: resolved boolean → resolution_status text
UPDATE public.policy_conflicts 
SET resolution_status = CASE 
  WHEN resolved = TRUE THEN 'resolved'
  ELSE 'unresolved'
END
WHERE resolution_status IS NULL;

-- Set defaults for new columns based on existing data
UPDATE public.policy_conflicts 
SET conflicting_rule = field_path
WHERE conflicting_rule IS NULL;

-- Make new columns NOT NULL after migration
ALTER TABLE public.policy_conflicts
  ALTER COLUMN conflicting_rule SET NOT NULL,
  ALTER COLUMN resolution_status SET NOT NULL,
  ALTER COLUMN resolution_status SET DEFAULT 'unresolved';