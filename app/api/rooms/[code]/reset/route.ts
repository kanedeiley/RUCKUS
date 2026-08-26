import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Host-only: reopen a finished quick-play room back to the lobby so the
// group can pick another game with the same room code and players. This is
// what makes quick play a loop (game -> results -> game selection -> game)
// rather than a dead end — with no scores to protect, there's nothing to
// reset but the status. Party rooms don't reopen: their whole arc ends in a
// final scoreboard, so going again means a fresh room.
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
      { error: "Only the host can reopen the room" },
      { status: 403 }
    );
  }

  if (room.status !== "finished" || room.mode !== "single") {
    return NextResponse.json(
      { error: "Only a finished quick-play room can go back to the lobby" },
      { status: 409 }
    );
  }

  const { data: updatedRoom, error } = await admin
    .from("rooms")
    .update({
      status: "waiting",
      game_id: null,
      game_state: {},
      // Room-lifetime counter — never reset (see start route).
      game_state_version: room.game_state_version + 1,
      finished_at: null,
    })
    .eq("id", room.id)
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
