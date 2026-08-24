![Logo](./app/public/RUCKUS.svg)

Party games for everyone. This repo is the multiplayer **platform** — rooms,
players, connections, real-time sync, and a game-plugin contract — with one
placeholder game proving the whole pipeline works. No real party game lives
here yet; see `games/placeholder/` for the shape a real one should follow.

## Architecture

- **Platform** (`lib/`, `app/api/`) owns rooms, players, room codes, and
  lifecycle (`waiting -> starting -> playing -> finished`). It has no
  knowledge of any game's rules.
- **Game engine contract** (`lib/game-engine/types.ts`) — the `GameModule`
  interface every game implements: `createInitialState`, a pure
  `reducer(state, action, ctx)`, and `HostView` / `PlayerView` components.
- **Games** (`games/<name>/`) are self-contained. Adding one means adding a
  folder and one line in `games/registry.ts` — no platform code changes.

State is server-authoritative throughout: clients call `POST
/api/rooms/[code]/{join,start,action}`, each route validates the caller
(host vs. player, via their Supabase session) before writing anything with
the service-role client, and Supabase Realtime (`postgres_changes`) pushes
the resulting row changes back out to every subscribed client. Live
connection status uses Supabase Presence instead of the database, since
that's exactly the kind of transient state that shouldn't be persisted.

**Action latency**: `POST /api/rooms/[code]/action` returns the state it
just computed in the same response — `useRoomRealtime`'s `applyRoomUpdate`
lets the acting client apply that immediately instead of waiting for the
realtime echo of its own write (a second network hop: DB -> Realtime ->
client). Realtime is still what propagates the change to *other* clients
(the host screen, other players). `game_state_version` on `rooms` orders
these two update paths against each other so an in-flight/stale message
can't clobber a newer one, and the same column protects the underlying
read-reduce-write in `action/route.ts` with optimistic concurrency —
without it, two actions submitted close together (e.g. rapid taps) could
both read the same `game_state` and the second write would silently
overwrite the first (see the comment at the top of that route).

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Enable anonymous sign-ins**: Authentication -> Sign In / Providers ->
   turn on "Allow anonymous sign-ins". Ruckus never requires an account to
   play.
3. **Run the schema**: paste `supabase/migrations/0001_init.sql`, then
   `0002_game_state_concurrency.sql`, into the SQL Editor and run them in
   order. Together they create `rooms` and `players`, RLS policies, add
   both tables to the `supabase_realtime` publication, and add the
   `game_state_version` column used for optimistic concurrency.
4. **Copy env vars**: `cp .env.local.example .env.local` and fill in the
   Project URL, anon key, and service role key from Project Settings -> API.
5. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```

## First-milestone test

1. Open `/`, click **Create Game** on a laptop — you land in the host lobby
   with a room code.
2. Open `/join` on one or more phones (or other browser tabs), enter the
   code and a name.
3. Players appear in the host lobby in real time, and each other in their
   own lobby.
4. Reload a player tab mid-lobby — it reconnects as the same player rather
   than duplicating.
5. Click **Start Game** on the host — every screen transitions to the
   placeholder game. Tap **Ruckus!** on a phone and watch the host's counts
   update live.

## Deliberately deferred

- **Game selection UI** — `start` hardcodes `gameId: "placeholder"` since
  there's only one game to pick from.
- **Round timers** — no server-side clock exists. The convention (documented
  in `lib/game-engine/types.ts`) is for a game to put a deadline timestamp in
  its own state; views render a countdown from it client-side and the
  reducer rejects late actions. No platform infrastructure needed until a
  game actually requires it.
- **Accounts, stats, friends, game history** — anonymous auth only for now,
  per the MVP scope.
