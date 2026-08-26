import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isPartyComplete,
  parseSessionState,
  type CompletedGame,
} from "@/lib/game-engine/session";
import type { RoomStatus } from "@/lib/types/database";

// Host-only session-layer transitions that don't go through a game's
// reducer (games only end themselves via endGame in the action route):
//
// - from `intermission`: the party is over — move to `finished` so both
//   screens show final results.
// - from `playing`: end the current game early with no placements and no
//   points (a party's escape hatch for games with no natural end, or one
//   that's dragging). Party rooms go to `intermission`, quick-play rooms
//   straight to `finished`.
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
      { error: "Only the host can end the game" },
      { status: 403 }
    );
  }

  if (room.status !== "playing" && room.status !== "intermission") {
    return NextResponse.json({ error: "Nothing to end" }, { status: 409 });
  }

  const now = new Date().toISOString();
  let nextStatus: RoomStatus;
  let nextSessionState = room.session_state;

  if (room.status === "intermission") {
    nextStatus = "finished";
  } else {
    // Ending a running game: record it in the history with no result so the
    // intermission can still say what was played, but award nothing.
    let nextSession = parseSessionState(room.session_state);
    if (room.game_id) {
      const completed: CompletedGame = {
        gameId: room.game_id,
        endedAt: now,
        pointsAwarded: {},
      };
      nextSession = { ...nextSession, gamesPlayed: [...nextSession.gamesPlayed, completed] };
      nextSessionState = nextSession as unknown as Record<string, unknown>;
    }
    nextStatus =
      room.mode === "party" && !isPartyComplete(nextSession) ? "intermission" : "finished";
  }

  const { data: updatedRoom, error } = await admin
    .from("rooms")
    .update({
      status: nextStatus,
      session_state: nextSessionState,
      // Bump so clients accept this update over any in-flight stale one.
      game_state_version: room.game_state_version + 1,
      finished_at: nextStatus === "finished" ? now : room.finished_at,
    })
    .eq("id", room.id)
    // Guarded on the version we read: if a player action commits in the
    // same instant, this no-ops instead of clobbering it (host just taps
    // again — a stale button beats a lost game result).
    .eq("game_state_version", room.game_state_version)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!updatedRoom) {
    return NextResponse.json(
      { error: "Room changed underneath you, try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({ room: updatedRoom });
}
