-- Optimistic concurrency for rooms.game_state.
--
-- The action route does read -> run reducer -> write, all in application
-- code (the reducer is a plain TS function, not SQL, so it can't run
-- inside a single atomic statement). Two actions submitted close together
-- (e.g. rapid taps) could otherwise both read the same game_state, both
-- compute "+1", and the second write would silently clobber the first —
-- a classic lost update. game_state_version guards the write: the route
-- only commits if the version it read is still current, and retries
-- (re-read, re-reduce, re-write) on conflict.

alter table public.rooms
  add column game_state_version integer not null default 0;
