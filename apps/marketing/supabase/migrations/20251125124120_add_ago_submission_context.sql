-- ================================
-- ADD AGO SUBMISSION CONTEXT COLUMNS
-- ================================
-- Migration: 20251125124120
-- Description: Add brand, region, and channel columns to submissions table for AGO (AI Governance Officer) support
-- These fields enable boundary-only governance of partner AI tool usage

-- ============================================
-- STEP 1: Add brand, region, channel columns to submissions
-- ============================================
DO $$ BEGIN
  -- Add brand column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'brand'
  ) THEN
    ALTER TABLE submissions ADD COLUMN brand VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_submissions_brand ON submissions(brand);
  END IF;

  -- Add region column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'region'
  ) THEN
    ALTER TABLE submissions ADD COLUMN region VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_submissions_region ON submissions(region);
  END IF;

  -- Add channel column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'channel'
  ) THEN
    ALTER TABLE submissions ADD COLUMN channel VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_submissions_channel ON submissions(channel);
  END IF;
END $$;

-- ============================================
-- STEP 2: Create composite index for AGO context lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_submissions_ago_context 
  ON submissions(enterprise_id, brand, region, channel) 
  WHERE brand IS NOT NULL AND region IS NOT NULL AND channel IS NOT NULL;

-- ============================================
-- STEP 3: Add comments for documentation
-- ============================================
COMMENT ON COLUMN submissions.brand IS 'Brand identifier for AGO boundary governance (e.g., GLUCOSTABLE)';
COMMENT ON COLUMN submissions.region IS 'Region identifier for AGO boundary governance (e.g., EU, US)';
COMMENT ON COLUMN submissions.channel IS 'Channel identifier for AGO boundary governance (e.g., HCP_email, public_social)';

