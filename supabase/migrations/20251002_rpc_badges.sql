-- ================================
-- AICOMPLYR.IO — RFP URGENCY BADGES & AUTOSAVE VERSIONING
-- ================================
-- Server-side urgency badges (fast, timezone-safe) and autosave versioning

-- ========== URGENCY BADGES RPC ==========
create or replace function rpc_get_rfp_badges(workspace uuid)
returns table(new_count int, due_soon_count int, overdue_count int)
language sql
security definer
as $$
  with d as (
    select response_deadline
    from policy_distributions
    where target_workspace_id = workspace
      and coalesce(submission_status,'') not in ('submitted','approved')
      and response_deadline is not null
  )
  select
    count(*) filter (where response_deadline > (now() + interval '72 hours')) as new_count,
    count(*) filter (where response_deadline between now() and (now() + interval '72 hours')) as due_soon_count,
    count(*) filter (where response_deadline < now()) as overdue_count;
$$;

-- ========== AUTOSAVE VERSIONING ==========
-- Add versioning columns to submissions
alter table submissions add column if not exists draft_version int default 0;
alter table submissions add column if not exists draft_updated_at timestamptz;

-- Function to bump draft version with conflict detection
create or replace function bump_draft_version(submission_id uuid, new_payload jsonb, if_match_version int)
returns void
language plpgsql
security definer
as $$
declare cur int;
begin
  select draft_version into cur from submissions where id = submission_id for update;
  if cur is null then cur := 0; end if;
  if if_match_version is not null and cur <> if_match_version then
    raise exception 'version_conflict';
  end if;

  update submissions
  set rfp_response_data = new_payload,
      draft_version = coalesce(draft_version,0) + 1,
      draft_updated_at = now()
  where id = submission_id;
end;
$$;

-- ========== RFP ORCHESTRATION HELPERS ==========
-- Function to get RFP distribution details with urgency
create or replace function rpc_get_rfp_distributions(workspace uuid)
returns table(
  id uuid,
  policy_name text,
  response_deadline timestamptz,
  submission_status text,
  urgency_level text,
  days_remaining int
)
language sql
security definer
as $$
  select 
    pd.id,
    p.name as policy_name,
    pd.response_deadline,
    coalesce(pd.submission_status, 'pending') as submission_status,
    case 
      when pd.response_deadline < now() then 'overdue'
      when pd.response_deadline <= (now() + interval '72 hours') then 'due_soon'
      else 'new'
    end as urgency_level,
    extract(days from (pd.response_deadline - now()))::int as days_remaining
  from policy_distributions pd
  join policies p on pd.policy_id = p.id
  where pd.target_workspace_id = workspace
    and pd.response_deadline is not null
  order by pd.response_deadline asc;
$$;

-- Function to get submission progress for a distribution
create or replace function rpc_get_submission_progress(distribution_id uuid)
returns table(
  submission_id uuid,
  status text,
  compliance_score int,
  draft_version int,
  last_updated timestamptz,
  questions_total int,
  questions_answered int
)
language sql
security definer
as $$
  select 
    s.id as submission_id,
    s.status,
    s.compliance_score,
    s.draft_version,
    s.draft_updated_at as last_updated,
    (select count(*) from rfp_question_library rql where rql.distribution_id = distribution_id) as questions_total,
    (
      select count(*) 
      from rfp_question_library rql 
      where rql.distribution_id = distribution_id
        and exists (
          select 1 from jsonb_each(s.rfp_response_data) as answers
          where answers.key = rql.id::text
        )
    ) as questions_answered
  from submissions s
  where s.distribution_id = distribution_id
    and s.submission_type = 'rfp_response'
  limit 1;
$$;

-- ========== PERMISSIONS ==========
revoke all on function rpc_get_rfp_badges(uuid) from public;
grant execute on function rpc_get_rfp_badges(uuid) to authenticated;

revoke all on function bump_draft_version(uuid, jsonb, int) from public;
grant execute on function bump_draft_version(uuid, jsonb, int) to authenticated;

revoke all on function rpc_get_rfp_distributions(uuid) from public;
grant execute on function rpc_get_rfp_distributions(uuid) to authenticated;

revoke all on function rpc_get_submission_progress(uuid) from public;
grant execute on function rpc_get_submission_progress(uuid) to authenticated;

-- ========== COMMENTS ==========
comment on function rpc_get_rfp_badges(uuid) IS 'Get urgency badge counts for RFP distributions (timezone-safe)';
comment on function bump_draft_version(uuid, jsonb, int) IS 'Bump draft version with conflict detection for autosave';
comment on function rpc_get_rfp_distributions(uuid) IS 'Get RFP distributions with urgency levels for workspace';
comment on function rpc_get_submission_progress(uuid) IS 'Get submission progress and completion stats for distribution';

-- ================================
-- END MIGRATION
-- ================================