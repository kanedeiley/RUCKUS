-- Ruckus platform schema.
--
-- Only two tables at this layer: rooms and players. Game-specific state
-- lives in rooms.game_state (jsonb) — individual games never get their own
-- tables here; they read/write through the game engine contract instead.
--
-- Security model: every write to these tables goes through a Next.js API
-- route using the service-role key, which validates the caller (host vs.
-- player) before mutating anything. RLS below therefore only grants read
-- access, scoped to members of a room, and grants no direct client writes.

create extension if not exists "pgcrypto";

create type room_status as enum ('waiting', 'starting', 'playing', 'finished');
create type player_connection_status as enum ('connected', 'disconnected');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references auth.users (id) on delete cascade,
  status room_status not null default 'waiting',
  game_id text,
  game_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  is_host boolean not null default false,
  score integer not null default 0,
  status player_connection_status not null default 'connected',
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create index rooms_code_idx on public.rooms (code);
create index players_room_id_idx on public.players (room_id);

-- Keep rooms.updated_at current on every mutation.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

-- Atomic score increments, called by the game action API route so
-- concurrent submissions from different players can't clobber each other.
create or replace function public.increment_player_score(p_player_id uuid, p_delta integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.players set score = score + p_delta where id = p_player_id;
$$;

-- Membership check used by RLS policies below. security definer so it can
-- read both tables regardless of the calling role, without the policies
-- that reference it becoming self-recursive.
create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = target_room_id and r.host_id = auth.uid()
  ) or exists (
    select 1 from public.players p
    where p.room_id = target_room_id and p.user_id = auth.uid()
  );
$$;

alter table public.rooms enable row level security;
alter table public.players enable row level security;

create policy "Members can read their room"
  on public.rooms for select
  to authenticated
  using (public.is_room_member(id));

create policy "Members can read players in their room"
  on public.players for select
  to authenticated
  using (public.is_room_member(room_id));

-- Realtime: stream row changes for rooms/players to subscribed clients.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
