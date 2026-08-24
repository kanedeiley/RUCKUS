import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_PLAYERS = 24;

// PLAYER_JOINED / PLAYER_RECONNECTED: a client is never trusted to insert
// its own player row directly (RLS grants no write policy on `players`).
// This route validates the room/name and performs the write with the
// service-role client.
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

  const body = await request.json().catch(() => ({}));
  const displayName = String(body.displayName ?? "").trim().slice(0, 24);

  if (!displayName) {
    return NextResponse.json({ error: "Display name is required" }, { status: 400 });
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

  if (room.host_id === user.id) {
    return NextResponse.json(
      { error: "You're hosting this room, not joining as a player." },
      { status: 400 }
    );
  }

  const { data: existingPlayer } = await admin
    .from("players")
    .select("*")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingPlayer) {
    if (room.status !== "waiting") {
      return NextResponse.json(
        { error: "This game has already started." },
        { status: 409 }
      );
    }

    const { count } = await admin
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id);

    if ((count ?? 0) >= MAX_PLAYERS) {
      return NextResponse.json({ error: "Room is full" }, { status: 409 });
    }

    const { data: inserted, error: insertError } = await admin
      .from("players")
      .insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName,
        is_host: false,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ room, player: inserted, reconnected: false });
  }

  // Same browser/user rejoining (refresh, dropped connection, etc.).
  const { data: updated, error: updateError } = await admin
    .from("players")
    .update({
      display_name: displayName,
      status: "connected",
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", existingPlayer.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ room, player: updated, reconnected: true });
}
