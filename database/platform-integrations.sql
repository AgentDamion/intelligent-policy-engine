-- Platform Integration Database Schema
-- Run these in Supabase SQL editor

-- 1) Platform configurations
create table if not exists platform_configurations (
  id uuid primary key default gen_random_uuid(),
  enterprise_id uuid not null,
  name text not null,
  platform_type text check (platform_type in ('veeva','sharepoint','custom')) not null,
  status text check (status in ('active','inactive','error')) not null default 'inactive',
  auth_config jsonb not null,             -- encrypted at rest (server-side only usage)
  sync_settings jsonb not null default '{}'::jsonb,  -- { auto_sync: bool, sync_on_approval: bool, sync_on_submission: bool }
  last_sync_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

-- 2) Integration logs
create table if not exists platform_integration_logs (
  id uuid primary key default gen_random_uuid(),
  enterprise_id uuid not null,
  platform_config_id uuid not null references platform_configurations(id) on delete cascade,
  submission_id uuid,
  sync_type text check (sync_type in ('upload','metadata_update','test')) not null,
  status text check (status in ('success','failed','pending')) not null default 'pending',
  file_name text,
  external_id text,
  error_message text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_platform_configs_ent on platform_configurations(enterprise_id);
create index if not exists idx_platform_logs_ent on platform_integration_logs(enterprise_id);
create index if not exists idx_platform_logs_config on platform_integration_logs(platform_config_id);

-- RLS
alter table platform_configurations enable row level security;
alter table platform_integration_logs enable row level security;

-- RLS Policies - adapted to your existing auth pattern
-- Replace with your actual enterprise context function
create or replace function current_enterprise_id() returns uuid language sql stable as $$
  select nullif(current_setting('request.headers', true)::jsonb->>'x-enterprise-id','')::uuid
$$;

create policy platform_configs_select
on platform_configurations for select
using (enterprise_id = current_enterprise_id());

create policy platform_configs_modify
on platform_configurations for insert with check (enterprise_id = current_enterprise_id());

create policy platform_configs_update
on platform_configurations for update
using (enterprise_id = current_enterprise_id())
with check (enterprise_id = current_enterprise_id());

create policy platform_logs_select
on platform_integration_logs for select
using (enterprise_id = current_enterprise_id());

create policy platform_logs_insert
on platform_integration_logs for insert
with check (enterprise_id = current_enterprise_id());