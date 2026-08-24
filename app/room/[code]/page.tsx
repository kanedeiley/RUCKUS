import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { HostRoomController } from "@/components/host/HostRoomController";
import { PlayerRoomController } from "@/components/player/PlayerRoomController";

interface Props {
  params: Promise<{ code: string }>;
}

// Server Component: resolves who's asking (host, existing player, or a
// stranger) before rendering anything, using the service-role client only
// for reads here — writes still only ever happen through API routes.
export default async function RoomPage({ params }: Props) {
  const { code } = await params;
  const normalizedCode = code.trim().toUpperCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/join?code=${normalizedCode}`);
  }

  const admin = createAdminClient();
  const { data: room } = await admin
    .from("rooms")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!room) {
    notFound();
  }

  if (room.host_id === user.id) {
    const { data: players } = await admin
      .from("players")
      .select("*")
      .eq("room_id", room.id)
      .order("joined_at");

    return <HostRoomController room={room} players={players ?? []} />;
  }

  const { data: player } = await admin
    .from("players")
    .select("*")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!player) {
    redirect(`/join?code=${normalizedCode}`);
  }

  const { data: players } = await admin
    .from("players")
    .select("*")
    .eq("room_id", room.id)
    .order("joined_at");

  return (
    <PlayerRoomController room={room} players={players ?? []} currentPlayer={player} />
  );
}
