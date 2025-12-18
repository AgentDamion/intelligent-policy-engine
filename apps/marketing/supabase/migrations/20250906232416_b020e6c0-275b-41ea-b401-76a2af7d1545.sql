
-- 1) Create an enum for top-level account role
create type public.account_type as enum ('enterprise', 'partner');

-- 2) Create profiles table that mirrors auth.users and stores the role
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  account_type public.account_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Enable RLS and add safe policies
alter table public.profiles enable row level security;

-- Users can view their own profile
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Users can create their own profile (fallback if trigger fails or missing)
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- Users can update their own profile (e.g., selecting enterprise/partner)
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- 4) Keep updated_at fresh via a trigger (uses existing update_updated_at_column if present)
-- Create trigger function if not already present; if it exists, this will overwrite with safe search_path.
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
before update on public.profiles
for each row execute procedure public.update_updated_at_column();

-- 5) Auto-create a profile row on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, account_type)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    null -- will force first-login role selection
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
