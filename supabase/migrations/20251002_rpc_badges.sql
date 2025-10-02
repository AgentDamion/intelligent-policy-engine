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

revoke all on function rpc_get_rfp_badges(uuid) from public;
grant execute on function rpc_get_rfp_badges(uuid) to authenticated;