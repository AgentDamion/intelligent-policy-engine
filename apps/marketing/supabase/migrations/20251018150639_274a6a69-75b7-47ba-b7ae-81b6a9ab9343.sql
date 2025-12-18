-- Phase 1 Part B: Database Schema - Scopes-First RBAC + Secrets + Egress + Cache

-- Step 1.1: Enable ltree extension for hierarchical paths
create extension if not exists ltree;

-- Step 1.1: Create scopes table
create table if not exists scopes (
  id uuid primary key default gen_random_uuid(),
  enterprise_id uuid not null references enterprises(id) on delete cascade,
  parent_id uuid references scopes(id) on delete cascade,
  scope_path ltree not null,
  scope_name text not null,
  scope_type text not null check (scope_type in ('enterprise', 'region', 'country', 'brand', 'agency')),
  region text,
  country_code text,
  data_class text,
  compliance_frameworks text[] default array[]::text[],
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (enterprise_id, scope_path)
);

create index idx_scopes_enterprise on scopes(enterprise_id);
create index idx_scopes_path on scopes using gist(scope_path);
create index idx_scopes_parent on scopes(parent_id);

-- Step 1.2: Auto-sync parent_id from scope_path
create or replace function sync_scope_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_path ltree;
begin
  if nlevel(NEW.scope_path) > 1 then
    parent_path := subpath(NEW.scope_path, 0, nlevel(NEW.scope_path) - 1);
    select id into NEW.parent_id from scopes 
    where enterprise_id = NEW.enterprise_id 
    and scope_path = parent_path;
  else
    NEW.parent_id := null;
  end if;
  return NEW;
end;
$$;

create trigger tg_sync_scope_parent
  before insert or update on scopes
  for each row execute function sync_scope_parent();

-- Step 1.3: Extend user_roles to support scopes
alter table user_roles 
  add column if not exists scope_id uuid references scopes(id) on delete cascade;

create index if not exists idx_user_roles_scope on user_roles(scope_id);

-- Step 1.5: Create hierarchical role check function
create or replace function has_role_in_scope(
  _user_id uuid,
  _role app_role,
  _enterprise_id uuid,
  _scope_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles ur
    where ur.user_id = _user_id
      and ur.enterprise_id = _enterprise_id
      and ur.role = _role
      and (
        ur.scope_id = _scope_id
        or ur.scope_id is null
        or (_scope_id is not null and exists (
          select 1 from scopes s1, scopes s2
          where s1.id = _scope_id
            and s2.id = ur.scope_id
            and s1.scope_path <@ s2.scope_path
        ))
      )
  );
$$;

-- Step 1.6: Create access matrix view
create or replace view access_matrix_scope_first as
select
  s.enterprise_id,
  s.id as scope_id,
  s.scope_path::text as scope_path,
  s.scope_name,
  s.scope_type,
  s.region,
  s.compliance_frameworks,
  ur.role,
  ur.user_id,
  coalesce(p.first_name || ' ' || p.last_name, 'Unknown User') as user_name
from scopes s
left join user_roles ur 
  on ur.enterprise_id = s.enterprise_id
  and (ur.scope_id = s.id or ur.scope_id is null)
left join profiles p on p.id = ur.user_id
order by s.scope_path, ur.role;

-- Step 1.7: Add RLS policies to scopes table
alter table scopes enable row level security;

create policy "scopes_tenant_read" on scopes
  for select using (
    enterprise_id in (
      select enterprise_id from enterprise_members 
      where user_id = auth.uid()
    )
  );

create policy "scopes_admin_write" on scopes
  for all using (
    has_role_in_scope(auth.uid(), 'admin'::app_role, enterprise_id, null)
  )
  with check (
    has_role_in_scope(auth.uid(), 'admin'::app_role, enterprise_id, null)
  );

-- Step 1.8: Secrets metadata table
create table if not exists secrets (
  id uuid primary key default gen_random_uuid(),
  enterprise_id uuid not null references enterprises(id) on delete cascade,
  scope_id uuid references scopes(id) on delete cascade,
  name text not null,
  wrapped_key_ref text not null,
  rotation_interval_days int default 90,
  created_at timestamptz default now(),
  rotated_at timestamptz,
  unique (enterprise_id, scope_id, name)
);

create index idx_secrets_enterprise on secrets(enterprise_id);
create index idx_secrets_scope on secrets(scope_id);

create table if not exists secret_access_log (
  id uuid primary key default gen_random_uuid(),
  secret_id uuid references secrets(id) on delete cascade,
  actor_id uuid not null,
  action text check (action in ('read','write','rotate')),
  at timestamptz default now()
);

create index idx_secret_access_log_secret on secret_access_log(secret_id);
create index idx_secret_access_log_actor on secret_access_log(actor_id);

alter table secrets enable row level security;
alter table secret_access_log enable row level security;

create policy "secrets_meta_read" on secrets
  for select using (
    enterprise_id in (
      select enterprise_id from enterprise_members where user_id = auth.uid()
    )
    and (
      has_role_in_scope(auth.uid(), 'admin'::app_role, enterprise_id, scope_id) or
      has_role_in_scope(auth.uid(), 'audit_viewer'::app_role, enterprise_id, scope_id) or
      has_role_in_scope(auth.uid(), 'compliance_officer'::app_role, enterprise_id, scope_id)
    )
  );

create policy "secrets_write" on secrets
  for all using (
    enterprise_id in (
      select enterprise_id from enterprise_members where user_id = auth.uid()
    )
    and has_role_in_scope(auth.uid(), 'admin'::app_role, enterprise_id, scope_id)
  )
  with check (
    enterprise_id in (
      select enterprise_id from enterprise_members where user_id = auth.uid()
    )
    and has_role_in_scope(auth.uid(), 'admin'::app_role, enterprise_id, scope_id)
  );

create policy "secret_log_read" on secret_access_log
  for select using (
    exists (
      select 1 from secrets s 
      where s.id = secret_access_log.secret_id
      and s.enterprise_id in (
        select enterprise_id from enterprise_members where user_id = auth.uid()
      )
      and (
        has_role_in_scope(auth.uid(), 'admin'::app_role, s.enterprise_id, s.scope_id) or
        has_role_in_scope(auth.uid(), 'audit_viewer'::app_role, s.enterprise_id, s.scope_id)
      )
    )
  );

-- Step 1.9: Egress allow-list table
create table if not exists egress_rules (
  id uuid primary key default gen_random_uuid(),
  enterprise_id uuid not null references enterprises(id) on delete cascade,
  scope_id uuid references scopes(id) on delete cascade,
  dest_host text not null,
  protocol text default 'https' check (protocol in ('https', 'http', 'sftp', 'ftps')),
  allowed boolean not null default true,
  created_at timestamptz default now(),
  unique (enterprise_id, scope_id, dest_host, protocol)
);

create index idx_egress_rules_enterprise on egress_rules(enterprise_id);
create index idx_egress_rules_scope on egress_rules(scope_id);

alter table egress_rules enable row level security;

create policy "egress_read" on egress_rules
  for select using (
    enterprise_id in (
      select enterprise_id from enterprise_members where user_id = auth.uid()
    )
  );

create policy "egress_write" on egress_rules
  for all using (
    enterprise_id in (
      select enterprise_id from enterprise_members where user_id = auth.uid()
    )
    and has_role_in_scope(auth.uid(), 'admin'::app_role, enterprise_id, scope_id)
  )
  with check (
    enterprise_id in (
      select enterprise_id from enterprise_members where user_id = auth.uid()
    )
    and has_role_in_scope(auth.uid(), 'admin'::app_role, enterprise_id, scope_id)
  );

-- Step 1.10: Marketplace score cache table
create table if not exists tool_policy_scores (
  tool_id uuid not null,
  enterprise_id uuid not null references enterprises(id) on delete cascade,
  policy_version_hash text not null,
  score numeric not null check (score between 0 and 100),
  cached_at timestamptz not null default now(),
  primary key (tool_id, enterprise_id, policy_version_hash)
);

create index idx_tool_policy_scores_enterprise on tool_policy_scores(enterprise_id);
create index idx_tool_policy_scores_cached on tool_policy_scores(cached_at);

create or replace view tool_policy_scores_fresh as
select *
from tool_policy_scores
where cached_at > now() - interval '24 hours';

create or replace function invalidate_tool_scores_for_policy(p_enterprise uuid, p_policy_hash text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from tool_policy_scores
   where enterprise_id = p_enterprise
     and policy_version_hash = p_policy_hash;
$$;

alter table tool_policy_scores enable row level security;

create policy "tool_scores_tenant" on tool_policy_scores
  for select using (
    enterprise_id in (
      select enterprise_id from enterprise_members where user_id = auth.uid()
    )
  );