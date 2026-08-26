-- Party sessions: a room is either a one-shot game ('single', today's
-- behavior) or a 'party' — a sequence of games chosen by the host, each
-- ending in placements that convert to party points on players.score.
--
-- The session layer is platform-owned, exactly like the lobby: games never
-- see it. rooms.session_state (jsonb) holds the party history (which games
-- ran, the placements each reported, the points awarded), mirroring how
-- rooms.game_state holds the current game's private state.
--
-- 'intermission' is the between-games status in party mode: the last game's
-- result is on screen, scores are applied, and the host is picking the next
-- game. Quick-play rooms never enter it.

alter type room_status add value if not exists 'intermission';

create type room_mode as enum ('single', 'party');

alter table public.rooms
  add column mode room_mode not null default 'single',
  add column session_state jsonb not null default '{}'::jsonb;
