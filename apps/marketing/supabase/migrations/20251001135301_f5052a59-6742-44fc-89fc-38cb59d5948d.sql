-- Phase 1: RFP as Policy Distribution - Database Schema Extensions

-- Step 1: Extend policies table
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS rfp_template_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_generate_clauses BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.policies.rfp_template_data IS 'Stores RFP configuration including questions, scoring criteria, and distribution settings';
COMMENT ON COLUMN public.policies.auto_generate_clauses IS 'Whether to automatically generate RFP clauses from policy content';

-- Step 2: Extend policy_versions table
ALTER TABLE public.policy_versions 
ADD COLUMN IF NOT EXISTS compliance_scoring_profile JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rfp_metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN public.policy_versions.compliance_scoring_profile IS 'Defines scoring criteria, weights, and thresholds for compliance evaluation';
COMMENT ON COLUMN public.policy_versions.rfp_metadata IS 'Additional RFP-specific metadata like deadlines, categories, evaluation criteria';

-- Step 3: Extend submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS rfp_response_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS compliance_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS compliance_breakdown JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.submissions.submission_type IS 'Type of submission: standard, rfp_response, policy_review, etc.';
COMMENT ON COLUMN public.submissions.rfp_response_data IS 'Structured RFP response data with answers, evidence, and metadata';
COMMENT ON COLUMN public.submissions.compliance_score IS 'Overall compliance score (0-100) calculated by Audit Agent';
COMMENT ON COLUMN public.submissions.compliance_breakdown IS 'Detailed breakdown of compliance scores by domain/question';
COMMENT ON COLUMN public.submissions.response_deadline IS 'Deadline for RFP response submission';

-- Step 4: Create index for submission_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_submissions_type ON public.submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_submissions_deadline ON public.submissions(response_deadline) WHERE response_deadline IS NOT NULL;

-- Step 5: RLS Policy - Partners can view RFP distributions sent to them
CREATE POLICY "Partners can view RFP distributions sent to their workspace"
ON public.policy_distributions
FOR SELECT
USING (
  target_workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Step 6: RLS Policy - Partners can create RFP response submissions
CREATE POLICY "Partners can create RFP response submissions"
ON public.submissions
FOR INSERT
WITH CHECK (
  submission_type = 'rfp_response' AND
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Step 7: RLS Policy - Partners can update their own RFP responses before submission
CREATE POLICY "Partners can update their own RFP responses"
ON public.submissions
FOR UPDATE
USING (
  submission_type = 'rfp_response' AND
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  ) AND
  status = 'draft'
);