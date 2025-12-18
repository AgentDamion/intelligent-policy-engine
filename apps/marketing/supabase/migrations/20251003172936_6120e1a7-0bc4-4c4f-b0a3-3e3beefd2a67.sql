-- Phase 2: Enterprise Policy RPCs (Fixed)
-- Tenant-safe, SECURITY DEFINER functions for policy and clause data access

create schema if not exists app;

-- Tool ↔ Policy ↔ Clause link table (removed FK for now, will add after verifying types)
create table if not exists public.tool_policy_links (
  id uuid primary key default gen_random_uuid(),
  tool_id bigint not null,              -- marketplace_tools.id
  policy_id text not null,              -- policy_master.id (TEXT)
  clause_id text not null,              -- policy_clauses.id (TEXT)
  created_at timestamptz default now(),
  unique(tool_id, clause_id)
);

-- Add FK to marketplace_tools only
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_tpl_tool'
  ) then
    alter table public.tool_policy_links
      add constraint fk_tpl_tool   
      foreign key (tool_id) references public.marketplace_tools(id) on delete cascade;
  end if;
end $$;

-- RPC 1: List policies for an enterprise
create or replace function app.app_policy_list(_enterprise_id uuid)
returns table (
  policy_id text,
  title text,
  version text,
  status text,
  owner text,
  effective_date date,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.title,
    p.version,
    p.status,
    p.owner,
    p.effective_date,
    p.updated_at
  from policy_master p
  where p.enterprise_id = _enterprise_id
    and public.is_enterprise_member(_enterprise_id)
  order by coalesce(p.updated_at, now()) desc, p.title;
$$;

revoke all on function app.app_policy_list(uuid) from public;
grant execute on function app.app_policy_list(uuid) to authenticated;

-- RPC 2: Tool → Policy → Clauses for an enterprise
create or replace function app.app_tool_policy_clauses(_enterprise_id uuid, _tool_id bigint)
returns table (
  tool_id bigint,
  tool_name text,
  policy_id text,
  policy_title text,
  policy_version text,
  clause_id text,
  clause_ref text,
  lane text,
  clause_text text
)
language sql
stable
security definer
set search_path = public
as $$
  with scoped_policies as (
    select p.*
    from policy_master p
    where p.enterprise_id = _enterprise_id
      and public.is_enterprise_member(_enterprise_id)
  )
  select
    tpl.tool_id::bigint,
    mt.name,
    sp.id,
    sp.title,
    sp.version,
    tpl.clause_id,
    pc.clause_ref,
    pc.lane::text,
    pc.clause_text
  from tool_policy_links tpl
  join scoped_policies sp on sp.id = tpl.policy_id
  join policy_clauses pc on pc.id = tpl.clause_id and pc.policy_id = sp.id
  left join marketplace_tools mt on mt.id = tpl.tool_id
  where tpl.tool_id = _tool_id
  order by sp.title, pc.clause_ref nulls last, tpl.clause_id;
$$;

revoke all on function app.app_tool_policy_clauses(uuid, bigint) from public;
grant execute on function app.app_tool_policy_clauses(uuid, bigint) to authenticated;