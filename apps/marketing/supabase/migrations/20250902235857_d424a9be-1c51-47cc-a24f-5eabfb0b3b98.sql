-- Create enums
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE public.enterprise_role_enum AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE public.policy_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.submission_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'changes_requested');
CREATE TYPE public.decision_outcome AS ENUM ('approved', 'approved_with_conditions', 'rejected');
CREATE TYPE public.evidence_scan_status AS ENUM ('pending', 'clean', 'infected', 'quarantined');

-- Core workspaces and user management (extend existing)
CREATE TABLE IF NOT EXISTS public.enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table (separate from profiles to avoid RLS recursion)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, workspace_id),
    UNIQUE (user_id, enterprise_id)
);

-- Policies and versions
CREATE TABLE public.policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    enterprise_id UUID REFERENCES public.enterprises(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    rules JSONB DEFAULT '{}',
    status policy_status DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    distributed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (policy_id, version_number)
);

CREATE TABLE public.policy_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_version_id UUID REFERENCES public.policy_versions(id) ON DELETE CASCADE NOT NULL,
    target_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    distributed_by UUID REFERENCES auth.users(id),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (policy_version_id, target_workspace_id)
);

-- Submissions
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    policy_version_id UUID REFERENCES public.policy_versions(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status submission_status DEFAULT 'draft',
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    submitted_at TIMESTAMP WITH TIME ZONE,
    last_scored_at TIMESTAMP WITH TIME ZONE,
    decision_id UUID,
    decided_at TIMESTAMP WITH TIME ZONE,
    submitted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.submission_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    ai_tool_name TEXT NOT NULL,
    vendor TEXT,
    description TEXT,
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    decision_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decisions
CREATE TABLE public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
    submission_item_id UUID REFERENCES public.submission_items(id) ON DELETE CASCADE,
    outcome decision_outcome NOT NULL,
    conditions TEXT,
    feedback TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    decided_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((submission_id IS NOT NULL AND submission_item_id IS NULL) OR (submission_id IS NULL AND submission_item_id IS NOT NULL))
);

-- Scores
CREATE TABLE public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
    submission_item_id UUID REFERENCES public.submission_items(id) ON DELETE CASCADE,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    category_scores JSONB DEFAULT '{}',
    run_id TEXT,
    run_mode TEXT DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((submission_id IS NOT NULL AND submission_item_id IS NULL) OR (submission_id IS NULL AND submission_item_id IS NOT NULL))
);

-- Evidence management
CREATE TABLE public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_item_id UUID REFERENCES public.submission_items(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    content_hash TEXT,
    content_type TEXT,
    scan_status evidence_scan_status DEFAULT 'pending',
    scan_result JSONB,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail (append-only)
CREATE TABLE public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    user_id UUID REFERENCES auth.users(id),
    workspace_id UUID REFERENCES public.workspaces(id),
    enterprise_id UUID REFERENCES public.enterprises(id),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for decisions back to submissions
ALTER TABLE public.submissions ADD CONSTRAINT fk_submissions_decision_id 
    FOREIGN KEY (decision_id) REFERENCES public.decisions(id);
ALTER TABLE public.submission_items ADD CONSTRAINT fk_submission_items_decision_id 
    FOREIGN KEY (decision_id) REFERENCES public.decisions(id);

-- Indexes for performance
CREATE INDEX idx_policies_enterprise_id ON public.policies(enterprise_id);
CREATE INDEX idx_policy_versions_policy_id ON public.policy_versions(policy_id);
CREATE INDEX idx_policy_versions_status ON public.policy_versions(status);
CREATE INDEX idx_submissions_workspace_id ON public.submissions(workspace_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submission_items_submission_id ON public.submission_items(submission_id);
CREATE INDEX idx_decisions_submission_id ON public.decisions(submission_id);
CREATE INDEX idx_decisions_submission_item_id ON public.decisions(submission_item_id);
CREATE INDEX idx_evidence_submission_item_id ON public.evidence(submission_item_id);
CREATE INDEX idx_audit_events_entity ON public.audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_workspace_id ON public.audit_events(workspace_id);
CREATE INDEX idx_audit_events_created_at ON public.audit_events(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_enterprises_updated_at
    BEFORE UPDATE ON public.enterprises
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON public.policies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();