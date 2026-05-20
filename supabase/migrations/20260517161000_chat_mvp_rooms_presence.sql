-- MVP chat schema: rooms, members, messages, global status pins, and live presence.
-- Aligned to Next.js + Supabase SSR + client realtime architecture.

create extension if not exists pgcrypto;

-- -----------------------------
-- Profiles adjustments (global status pin fields)
-- -----------------------------
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists status_emoji text,
  add column if not exists status_text varchar(10),
  add column if not exists status_expires_at timestamptz;

-- backfill display_name from existing fields where possible
update public.profiles
set display_name = coalesce(display_name, nullif(full_name, ''), nullif(username, ''), 'friend')
where display_name is null;

alter table public.profiles
  alter column display_name set default 'friend';

-- -----------------------------
-- Rooms and membership
-- -----------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  code char(6) not null unique check (code ~ '^[A-Z0-9]{6}$'),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  theme_key text not null default 'neo-violet' check (theme_key in ('neo-violet', 'neo-cyan')),
  created_at timestamptz not null default now()
);

create index if not exists idx_rooms_owner_id on public.rooms(owner_id);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists idx_room_members_user_id on public.room_members(user_id);

-- -----------------------------
-- Messages (text-only for MVP)
-- -----------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_room_created on public.messages(room_id, created_at desc);
create index if not exists idx_messages_sender_id on public.messages(sender_id);

-- -----------------------------
-- Presence state (realtime presence companion)
-- -----------------------------
create table if not exists public.presence_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_online boolean not null default false,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_presence_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_presence_updated_at on public.presence_state;
create trigger set_presence_updated_at
before update on public.presence_state
for each row
execute function public.handle_presence_updated_at();

-- -----------------------------
-- Grants (Data API exposure for authenticated clients)
-- -----------------------------
grant select, insert, update on table public.rooms to authenticated;
grant select, insert, delete on table public.room_members to authenticated;
grant select, insert on table public.messages to authenticated;
grant select, insert, update on table public.presence_state to authenticated;
-- existing table, extend privileges for new status fields updates
grant select, update on table public.profiles to authenticated;

-- -----------------------------
-- RLS enablement
-- -----------------------------
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.presence_state enable row level security;

-- -----------------------------
-- RLS policies: profiles
-- -----------------------------
drop policy if exists "Users can update own status pin and display name" on public.profiles;
create policy "Users can update own status pin and display name"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- -----------------------------
-- RLS policies: rooms
-- -----------------------------
drop policy if exists "Authenticated can read rooms" on public.rooms;
create policy "Authenticated can read rooms"
on public.rooms
for select
to authenticated
using (true);

-- NOTE: join flow looks up rooms by invite code before membership insert,
-- so authenticated users need SELECT visibility for room-code lookup.

drop policy if exists "Authenticated can create rooms they own" on public.rooms;
create policy "Authenticated can create rooms they own"
on public.rooms
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Only owner can update room" on public.rooms;
create policy "Only owner can update room"
on public.rooms
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- -----------------------------
-- RLS policies: room_members
-- -----------------------------
drop policy if exists "Members can read membership of their rooms" on public.room_members;
create policy "Members can read membership of their rooms"
on public.room_members
for select
to authenticated
using (
  exists (
    select 1
    from public.room_members self
    where self.room_id = room_members.room_id
      and self.user_id = auth.uid()
  )
);

drop policy if exists "Users can add themselves to a room" on public.room_members;
create policy "Users can add themselves to a room"
on public.room_members
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can leave rooms themselves" on public.room_members;
create policy "Users can leave rooms themselves"
on public.room_members
for delete
to authenticated
using (user_id = auth.uid());

-- -----------------------------
-- RLS policies: messages
-- -----------------------------
drop policy if exists "Members can read room messages" on public.messages;
create policy "Members can read room messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.room_members rm
    where rm.room_id = messages.room_id
      and rm.user_id = auth.uid()
  )
);

drop policy if exists "Members can send room messages as self" on public.messages;
create policy "Members can send room messages as self"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.room_members rm
    where rm.room_id = messages.room_id
      and rm.user_id = auth.uid()
  )
);

-- -----------------------------
-- RLS policies: presence_state
-- -----------------------------
drop policy if exists "Users can upsert own presence" on public.presence_state;
create policy "Users can upsert own presence"
on public.presence_state
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read shared-room presence" on public.presence_state;
create policy "Users can read shared-room presence"
on public.presence_state
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.room_members mine
    join public.room_members theirs
      on theirs.room_id = mine.room_id
    where mine.user_id = auth.uid()
      and theirs.user_id = presence_state.user_id
  )
);

-- -----------------------------
-- Auto-membership: room owner joins created room
-- -----------------------------
create or replace function public.handle_new_room_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.room_members (room_id, user_id)
  values (new.id, new.owner_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_room_created_add_owner_member on public.rooms;
create trigger on_room_created_add_owner_member
after insert on public.rooms
for each row execute function public.handle_new_room_membership();

-- -----------------------------
-- Realtime publication
-- -----------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.presence_state;
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_members;
