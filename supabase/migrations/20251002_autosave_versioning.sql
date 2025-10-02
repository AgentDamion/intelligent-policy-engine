-- Autosave versioning (prevent silent overwrites)
alter table submissions add column if not exists draft_version int default 0;
alter table submissions add column if not exists draft_updated_at timestamptz;

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

revoke all on function bump_draft_version(uuid, jsonb, int) from public;
grant execute on function bump_draft_version(uuid, jsonb, int) to authenticated;