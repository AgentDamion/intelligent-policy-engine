-- ================================
-- AICOMPLYR.IO — RFP/RFI INTEGRATION MINIMAL SCHEMA
-- ================================
-- This migration adds minimal extensions to support RFP/RFI processing
-- while maintaining the existing Policy → Submissions → Audit → Meta-Loop spine

-- ========== OPTIONAL TABLE: RFP QUESTION LIBRARY ==========
-- Only if you want to persist parsed external RFI questions
create table if not exists rfp_question_library (
  id uuid primary key default gen_random_uuid(),
  distribution_id uuid references policy_distributions(id) on delete cascade,
  section text,
  question_number int,
  question_text text not null,
  question_type text check (question_type in ('free_text','multiple_choice','yes_no','matrix')) default 'free_text',
  required_evidence jsonb default '[]'::jsonb,
  is_mandatory boolean default true,
  ai_classification jsonb,
  created_at timestamptz default now()
);

-- ========== EXTEND EXISTING TABLES ==========

-- Extend policies table with RFP template data
alter table policies add column if not exists rfp_template_data jsonb;

-- Extend policy_versions table with compliance scoring profile
alter table policy_versions add column if not exists compliance_scoring_profile jsonb;

-- Extend policy_distributions table for RFP-specific fields
alter table policy_distributions add column if not exists target_workspace_id uuid references workspaces(id);
alter table policy_distributions add column if not exists response_deadline timestamptz;
alter table policy_distributions add column if not exists submission_status text default 'pending';

-- Create submissions table if it doesn't exist (extending tool_submissions)
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  policy_version_id uuid references policy_versions(id),
  distribution_id uuid references policy_distributions(id),
  submission_type text default 'standard' check (submission_type in ('standard', 'rfp_response')),
  rfp_response_data jsonb,
  compliance_score int,
  compliance_breakdown jsonb,
  status text default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  submitted_by text,
  submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add enterprise_id to submissions for multi-tenancy
alter table submissions add column if not exists enterprise_id uuid references enterprises(id) on delete cascade;

-- ========== USEFUL INDEXES ==========
create index if not exists idx_pd_target_deadline
  on policy_distributions (target_workspace_id, response_deadline);

create index if not exists idx_pd_status
  on policy_distributions (submission_status);

create index if not exists idx_submissions_workspace_type_status
  on submissions (workspace_id, submission_type, status);

create index if not exists idx_submissions_distribution
  on submissions (distribution_id);

create index if not exists idx_rfp_questions_distribution
  on rfp_question_library (distribution_id);

-- ========== RLS POLICIES ==========

-- Enable RLS on new tables
alter table rfp_question_library enable row level security;
alter table submissions enable row level security;

-- Partner can view distributions targeted to their workspace
create policy if not exists "agency: read assigned distributions"
on policy_distributions
for select
using (
  target_workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
);

-- Partner can create rfp_response
create policy if not exists "agency: create rfp response"
on submissions
for insert
with check (
  workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  and submission_type = 'rfp_response'
);

-- Partner can read own rfp_response
create policy if not exists "agency: read rfp response"
on submissions
for select
using (
  workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  and submission_type = 'rfp_response'
);

-- Partner can update own rfp_response drafts
create policy if not exists "agency: update own rfp draft"
on submissions
for update
using (
  workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  and submission_type = 'rfp_response'
  and status = 'draft'
)
with check (true);

-- Enterprise can manage all submissions in their workspaces
create policy if not exists "enterprise: manage submissions"
on submissions
for all
using (
  enterprise_id in (
    select e.id from enterprises e
    join enterprise_members em on e.id = em.enterprise_id
    where em.user_id = auth.uid()
  )
);

-- RFP question library access
create policy if not exists "agency: read rfp questions"
on rfp_question_library
for select
using (
  distribution_id in (
    select pd.id from policy_distributions pd
    where pd.target_workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  )
);

-- ========== GRANTS ==========
grant select, insert, update, delete on rfp_question_library to authenticated;
grant select, insert, update, delete on submissions to authenticated;

-- ========== COMMENTS ==========
comment on table rfp_question_library IS 'Optional storage for parsed external RFP/RFI questions';
comment on table submissions IS 'Unified submissions table supporting both standard and RFP responses';
comment on column policies.rfp_template_data IS 'RFP template configuration and clause templates';
comment on column policy_versions.compliance_scoring_profile IS 'Scoring weights and critical criteria for RFP evaluation';
comment on column policy_distributions.target_workspace_id IS 'Target workspace for RFP distribution';
comment on column policy_distributions.response_deadline IS 'Deadline for RFP response submission';
comment on column policy_distributions.submission_status IS 'Status of RFP submission (pending, submitted, approved, etc.)';

-- ================================
-- END MIGRATION
-- ================================