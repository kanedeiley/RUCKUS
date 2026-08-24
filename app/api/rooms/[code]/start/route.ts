import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGame } from "@/games/registry";
import { toEnginePlayer } from "@/lib/game-engine/mappers";

// GAME_STARTED. Host-only: the caller must be the room's host_id, checked
// server-side — a client can't start a game just by hitting this route.
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

  if (room.status !== "waiting") {
    return NextResponse.json({ error: "Game already started" }, { status: 409 });
  }

  const { data: players } = await admin
    .from("players")
    .select("*")
    .eq("room_id", room.id);

  // Hardcoded until a game-selection screen exists — the platform doesn't
  // otherwise know or care which game this is.
  const gameId = "placeholder";
  const game = getGame(gameId);

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
      game_id: gameId,
      game_state: initialState as Record<string, unknown>,
      game_state_version: 0,
      started_at: new Date().toISOString(),
    })
    .eq("id", room.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ room: updatedRoom });
}
