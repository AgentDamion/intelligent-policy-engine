-- Secure tool_policy_links table with RLS

-- Enable RLS
alter table public.tool_policy_links enable row level security;

-- Policy: Enterprise members can view tool-policy links for their enterprise
create policy "Enterprise members can view tool policy links"
on public.tool_policy_links for select
to authenticated
using (
  exists (
    select 1 from policy_master pm
    where pm.id = tool_policy_links.policy_id
      and public.is_enterprise_member(pm.enterprise_id)
  )
);

-- Policy: Enterprise admins can manage tool-policy links
create policy "Enterprise admins can manage tool policy links"
on public.tool_policy_links for all
to authenticated
using (
  exists (
    select 1 
    from policy_master pm
    join enterprise_members em on em.enterprise_id = pm.enterprise_id
    where pm.id = tool_policy_links.policy_id
      and em.user_id = auth.uid()
      and em.role in ('admin', 'owner')
  )
)
with check (
  exists (
    select 1 
    from policy_master pm
    join enterprise_members em on em.enterprise_id = pm.enterprise_id
    where pm.id = tool_policy_links.policy_id
      and em.user_id = auth.uid()
      and em.role in ('admin', 'owner')
  )
);