-- Chat App backend bootstrap for Supabase
-- Creates a public.profiles table linked 1:1 with auth.users

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  status text not null default 'offline' check (status in ('online','offline','away','busy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Explicit grants required for Data API + RLS access.
grant select, insert, update on table public.profiles to authenticated;

-- Anyone authenticated can read minimal profile data.
drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

-- Users can insert only their own profile row.
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Users can update only their own profile row.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Keep updated_at current.
create or replace function public.handle_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profile_updated_at on public.profiles;
create trigger set_profile_updated_at
before update on public.profiles
for each row
execute function public.handle_profile_updated_at();

-- Auto-create a profile whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
