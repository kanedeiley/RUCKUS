import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGame } from "@/games/registry";
import { toEnginePlayer, toEngineRoom } from "@/lib/game-engine/mappers";
import {
  isPartyComplete,
  parseSessionState,
  pointsFromPlacements,
  type CompletedGame,
} from "@/lib/game-engine/session";
import type { RoomRow, RoomStatus } from "@/lib/types/database";

const MAX_CONFLICT_RETRIES = 5;

// PLAYER_ACTION / PLAYER_SUBMITTED. The only path any game state mutation
// takes: validate the caller has a player row in this room, hand their
// action to the active game's reducer, and persist the result. A player can
// only ever submit for themselves — ctx.playerId is derived from the
// authenticated session, never the body.
//
// GAME_ENDED is where the session layer takes over from the game: the
// game's placements convert to party points (the only writes players.score
// receives — in-game scores live in game_state), the game is appended to
// session_state history, and the room moves to `finished` (single) or
// `intermission` (party, host picks the next game).
//
// game_state is read-modify-written in application code (the reducer is a
// plain TS function, not SQL, so it can't run inside one atomic statement).
// Two actions submitted close together — e.g. rapid taps — could otherwise
// both read the same state and the second write would silently clobber the
// first. `game_state_version` guards the write with optimistic concurrency:
// the conditional update only lands if the version is still what we read,
// and we retry (re-read, re-reduce, re-write) on conflict.
//
// The response returns the state we just computed directly, with no
// read-back after the write — the caller already knows exactly what it
// wrote. Callers apply this response to their local UI immediately rather
// than waiting for the realtime echo, since that's a second network hop
// (DB -> Realtime -> client) on top of this request/response.
export async function POST(
  request: Request,
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

  const action = await request.json().catch(() => null);
  if (!action || typeof action.type !== "string") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = createAdminClient();
  const normalizedCode = code.trim().toUpperCase();

  const { data: initialRoom } = await admin
    .from("rooms")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!initialRoom) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const { data: playersData } = await admin
    .from("players")
    .select("*")
    .eq("room_id", initialRoom.id);

  const players = playersData ?? [];
  const player = players.find((p) => p.user_id === user.id);

  if (!player) {
    return NextResponse.json({ error: "You are not in this room" }, { status: 403 });
  }

  let room: RoomRow = initialRoom;

  for (let attempt = 0; attempt < MAX_CONFLICT_RETRIES; attempt++) {
    if (room.status !== "playing" || !room.game_id) {
      return NextResponse.json({ error: "Game is not in progress" }, { status: 409 });
    }

    const game = getGame(room.game_id);
    if (!game) {
      return NextResponse.json({ error: "Unknown game" }, { status: 500 });
    }

    const result = game.reducer(room.game_state, action, {
      room: toEngineRoom(room),
      players: players.map(toEnginePlayer),
      playerId: player.id,
    });

    const nextVersion = room.game_state_version + 1;
    let nextStatus: RoomStatus = room.status;
    let nextFinishedAt = room.finished_at;
    let nextSessionState = room.session_state;
    let pointsAwarded: Record<string, number> | null = null;

    if (result.endGame) {
      // Party points exist only in party mode — quick play games still
      // report placements (the game's own view can show who won), but
      // nothing accumulates on players.score.
      pointsAwarded =
        room.mode === "party" && result.placements
          ? pointsFromPlacements(result.placements)
          : {};
      const completed: CompletedGame = {
        gameId: room.game_id,
        endedAt: new Date().toISOString(),
        placements: result.placements,
        pointsAwarded,
      };
      const session = parseSessionState(room.session_state);
      const nextSession = {
        ...session,
        gamesPlayed: [...session.gamesPlayed, completed],
      };
      nextSessionState = nextSession;

      if (room.mode === "party" && !isPartyComplete(nextSession)) {
        nextStatus = "intermission";
      } else {
        nextStatus = "finished";
        nextFinishedAt = completed.endedAt;
      }
    }

    const { error, count } = await admin
      .from("rooms")
      .update(
        {
          game_state: result.state as Record<string, unknown>,
          game_state_version: nextVersion,
          status: nextStatus,
          finished_at: nextFinishedAt,
          session_state: nextSessionState,
        },
        { count: "exact" }
      )
      .eq("id", room.id)
      .eq("game_state_version", room.game_state_version);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count === 1) {
      // Party points, applied exactly once — only after the guarded write
      // landed, so a retried reducer run can never double-award.
      if (pointsAwarded) {
        await Promise.all(
          Object.entries(pointsAwarded)
            .filter(([, points]) => points !== 0)
            .map(([playerId, points]) =>
              admin.rpc("increment_player_score", {
                p_player_id: playerId,
                p_delta: points,
              })
            )
        );
      }

      const updatedRoom: RoomRow = {
        ...room,
        game_state: result.state as Record<string, unknown>,
        game_state_version: nextVersion,
        status: nextStatus,
        finished_at: nextFinishedAt,
        session_state: nextSessionState,
      };

      return NextResponse.json({ room: updatedRoom });
    }

    // Lost the race — another action committed first. Small jittered
    // backoff so concurrent conflicting requests don't retry in lockstep
    // and immediately collide again, then re-read and retry the reducer
    // against the state that actually landed.
    await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 20));

    const { data: freshRoom } = await admin
      .from("rooms")
      .select("*")
      .eq("id", room.id)
      .maybeSingle();

    if (!freshRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    room = freshRoom;
  }

  return NextResponse.json(
    { error: "Too much contention on this room, try again." },
    { status: 409 }
  );
}
