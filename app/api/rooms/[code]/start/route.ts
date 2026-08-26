import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGame } from "@/games/registry";
import { toEnginePlayer } from "@/lib/game-engine/mappers";
import type { SessionState } from "@/lib/game-engine/session";

// GAME_STARTED. Host-only: the caller must be the room's host_id, checked
// server-side — a client can't start a game just by hitting this route.
//
// Serves both the first start (from `waiting`, where the room's mode —
// quick-play vs party — is locked in) and every "next game" in a party
// (from `intermission`, where mode is already set and players.score
// carries the party points accumulated so far).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const normalizedCode = code.trim().toUpperCase();

  const { data: room } = await admin
    .from("rooms")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.host_id !== user.id) {
    return NextResponse.json(
      { error: "Only the host can start the game" },
      { status: 403 }
    );
  }

  if (room.status !== "waiting" && room.status !== "intermission") {
    return NextResponse.json({ error: "Game already started" }, { status: 409 });
  }

  const { data: players } = await admin
    .from("players")
    .select("*")
    .eq("room_id", room.id);

  // Get gameId from request body, default to placeholder
  const body = await _request.json().catch(() => ({}));
  const gameId = body.gameId || "placeholder";
  const game = getGame(gameId);

  // Mode (and, for a party, how many games the host is committing to) is
  // chosen once, at the first start; intermission starts keep it as-is —
  // session_state already carries the history and plannedGames by then.
  const isFirstStart = room.status === "waiting";
  const mode = isFirstStart ? (body.mode === "party" ? "party" : "single") : room.mode;

  let sessionState: SessionState | undefined;
  if (isFirstStart && mode === "party") {
    const requested = Number(body.plannedGames);
    const plannedGames =
      Number.isInteger(requested) && requested > 0 ? requested : undefined;
    sessionState = { gamesPlayed: [], ...(plannedGames ? { plannedGames } : {}) };
  }

  if (!game) {
    return NextResponse.json({ error: "Unknown game" }, { status: 500 });
  }

  if (!players || players.length < game.minPlayers) {
    return NextResponse.json(
      { error: `Need at least ${game.minPlayers} player(s) to start` },
      { status: 409 }
    );
  }

  const initialState = game.createInitialState(players.map(toEnginePlayer));

  const { data: updatedRoom, error } = await admin
    .from("rooms")
    .update({
      status: "playing",
      mode,
      game_id: gameId,
      game_state: initialState as Record<string, unknown>,
      // Never reset to 0: clients drop room updates whose version is below
      // the one they've seen (useRoomRealtime), so the version is a
      // room-lifetime counter, not a per-game one — resetting on game 2 of
      // a party would wedge every screen at intermission.
      game_state_version: room.game_state_version + 1,
      started_at: new Date().toISOString(),
      // Only set on the room's very first start — an intermission start
      // must not touch session_state, or it'd wipe the party's history.
      ...(sessionState ? { session_state: sessionState as unknown as Record<string, unknown> } : {}),
    })
    .eq("id", room.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ room: updatedRoom });
}
