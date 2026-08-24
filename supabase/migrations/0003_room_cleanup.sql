-- Room cleanup: rooms are ephemeral party sessions, so old rows (and their
-- players, via cascade) are simply deleted on a schedule. That's the whole
-- termination story server-side — no heartbeats, no status juggling.
--
-- Client-side, players leave on their own: the host screen tracks itself in
-- the realtime Presence channel, and player phones navigate home once the
-- host has been absent for a while (see PlayerRoomController).
create extension if not exists pg_cron;

select cron.schedule(
  'delete-old-rooms',
  '0 * * * *', -- hourly
  $$ delete from public.rooms where created_at < now() - interval '24 hours' $$
);
