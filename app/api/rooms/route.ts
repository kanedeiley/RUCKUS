import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateRoomCode } from "@/lib/rooms/codes";

const MAX_CODE_ATTEMPTS = 8;
const UNIQUE_VIOLATION = "23505";

// GAME_STARTED's counterpart at the front of the lifecycle: creates a room
// in `waiting` status and returns its join code. The caller becomes host.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await admin
      .from("rooms")
      .insert({ code, host_id: user.id, status: "waiting" })
      .select()
      .single();

    if (!error) {
      return NextResponse.json({ room: data });
    }

    if (error.code !== UNIQUE_VIOLATION) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Could not allocate a room code, try again." },
    { status: 500 }
  );
}
