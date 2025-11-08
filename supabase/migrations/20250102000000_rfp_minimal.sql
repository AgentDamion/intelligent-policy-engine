-- RFP/RFI Integration - Minimal Schema Extensions
-- This migration adds the minimal required tables for RFP integration
-- while reusing existing policy and organization infrastructure

-- Create submissions table for unified RFP/standard responses
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    submission_type VARCHAR(50) NOT NULL CHECK (submission_type IN ('rfp_response', 'standard_response', 'compliance_submission')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'submitted', 'rejected')),
    
    -- RFP-specific fields
    rfi_id VARCHAR(100),
    question_id VARCHAR(100),
    response_text TEXT,
    scoring_results JSONB,
    
    -- Standard response fields
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    policy_version_id UUID REFERENCES policy_versions(id) ON DELETE SET NULL,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT submissions_rfp_fields CHECK (
        (submission_type = 'rfp_response' AND rfi_id IS NOT NULL AND question_id IS NOT NULL AND response_text IS NOT NULL) OR
        (submission_type IN ('standard_response', 'compliance_submission') AND policy_id IS NOT NULL)
    )
);

-- Create RFP question library (optional, for parsed external RFIs)
CREATE TABLE IF NOT EXISTS rfp_question_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rfi_id VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    organization VARCHAR(200),
    due_date TIMESTAMP WITH TIME ZONE,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique RFI per organization
    UNIQUE(organization_id, rfi_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_org_type ON submissions(organization_id, submission_type);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_rfp ON submissions(rfi_id, question_id) WHERE submission_type = 'rfp_response';
CREATE INDEX IF NOT EXISTS idx_submissions_policy ON submissions(policy_id) WHERE policy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

CREATE INDEX IF NOT EXISTS idx_rfp_library_org ON rfp_question_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_rfp_library_rfi ON rfp_question_library(rfi_id);
CREATE INDEX IF NOT EXISTS idx_rfp_library_due_date ON rfp_question_library(due_date);

-- Add RLS policies for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view submissions in their organization" ON submissions
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create submissions in their organization" ON submissions
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update submissions in their organization" ON submissions
    FOR UPDATE USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete submissions in their organization" ON submissions
    FOR DELETE USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Add RLS policies for RFP question library
ALTER TABLE rfp_question_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view RFP library in their organization" ON rfp_question_library
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create RFP library entries in their organization" ON rfp_question_library
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update RFP library in their organization" ON rfp_question_library
    FOR UPDATE USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete RFP library in their organization" ON rfp_question_library
    FOR DELETE USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_submissions_updated_at 
    BEFORE UPDATE ON submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfp_library_updated_at 
    BEFORE UPDATE ON rfp_question_library 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

