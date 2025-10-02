-- OPTIONAL TABLE: only if you want to persist parsed external RFI questions
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

-- Submissions: ensure the type column exists and has our value
do $$ begin
  alter table submissions add column if not exists submission_type text default 'standard';
exception when duplicate_column then null; end $$;

-- Useful indexes
create index if not exists idx_pd_target_deadline
  on policy_distributions (target_workspace_id, response_deadline);

create index if not exists idx_pd_status
  on policy_distributions (submission_status);

create index if not exists idx_submissions_workspace_type_status
  on submissions (workspace_id, submission_type, status);

-- RLS Policies (examples — adjust to your schema names)
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

-- Optional: drafts update
create policy if not exists "agency: update own rfp draft"
on submissions
for update
using (
  workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  and submission_type = 'rfp_response'
  and status = 'draft'
)
with check (true);