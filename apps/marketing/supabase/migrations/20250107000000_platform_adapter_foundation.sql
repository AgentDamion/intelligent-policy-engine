-- UNIVERSAL PLATFORM ADAPTER FOUNDATION (trimmed initial pass)

create extension if not exists pgcrypto;

create table if not exists public.platform_configurations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  platform_type varchar(50) not null,
  platform_name varchar(100) not null,
  configuration jsonb not null,
  credentials_encrypted text,
  field_mappings jsonb default '{}'::jsonb,
  webhook_config jsonb default '{}'::jsonb,
  status varchar(20) default 'active' check (status in ('active','inactive','error')),
  last_connection_test timestamptz,
  connection_status varchar(20) default 'unknown' check (connection_status in ('connected','disconnected','error','unknown')),
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid,
  updated_by uuid
);

create table if not exists public.platform_integration_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  platform_config_id uuid not null references public.platform_configurations(id) on delete cascade,
  operation varchar(50) not null,
  entity_type varchar(50),
  entity_id varchar(255),
  platform_entity_id varchar(255),
  status varchar(20) not null check (status in ('success','error','pending','retrying')),
  request_data jsonb,
  response_data jsonb,
  error_code varchar(50),
  error_message text,
  duration_ms integer,
  retry_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.platform_integration_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  platform_config_id uuid not null references public.platform_configurations(id) on delete cascade,
  job_type varchar(50) not null,
  priority integer default 5,
  payload jsonb not null,
  status varchar(20) default 'pending' check (status in ('pending','processing','completed','failed','cancelled')),
  scheduled_for timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  retry_count integer default 0,
  max_retries integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.platform_webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  platform_config_id uuid not null references public.platform_configurations(id) on delete cascade,
  webhook_type varchar(50) not null,
  platform_webhook_id varchar(255),
  endpoint_url text not null,
  secret_key text,
  event_types text[] default '{}',
  status varchar(20) default 'active' check (status in ('active','inactive','error')),
  last_triggered timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.platform_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  platform_config_id uuid not null references public.platform_configurations(id) on delete cascade,
  metric_type varchar(50) not null,
  metric_value numeric not null,
  metric_unit varchar(20),
  time_period varchar(20) default 'hour',
  recorded_at timestamptz default now()
);

create index if not exists idx_platform_configurations_org_id on public.platform_configurations(organization_id);
create index if not exists idx_platform_configurations_type on public.platform_configurations(platform_type);
create index if not exists idx_platform_configurations_status on public.platform_configurations(status);

create index if not exists idx_platform_integration_logs_org_id on public.platform_integration_logs(organization_id);
create index if not exists idx_platform_integration_logs_config_id on public.platform_integration_logs(platform_config_id);
create index if not exists idx_platform_integration_logs_operation on public.platform_integration_logs(operation);
create index if not exists idx_platform_integration_logs_status on public.platform_integration_logs(status);
create index if not exists idx_platform_integration_logs_created_at on public.platform_integration_logs(created_at);

create index if not exists idx_platform_integration_jobs_status on public.platform_integration_jobs(status);
create index if not exists idx_platform_integration_jobs_scheduled on public.platform_integration_jobs(scheduled_for);
create index if not exists idx_platform_integration_jobs_priority on public.platform_integration_jobs(priority);

create index if not exists idx_platform_webhooks_config_id on public.platform_webhooks(platform_config_id);
create index if not exists idx_platform_webhooks_status on public.platform_webhooks(status);

create index if not exists idx_platform_metrics_config_id on public.platform_metrics(platform_config_id);
create index if not exists idx_platform_metrics_type on public.platform_metrics(metric_type);
create index if not exists idx_platform_metrics_recorded_at on public.platform_metrics(recorded_at);


