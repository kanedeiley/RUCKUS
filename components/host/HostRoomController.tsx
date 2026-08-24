"use client";

import { useCallback, useState } from "react";
import { useRoomRealtime } from "@/lib/hooks/useRoomRealtime";
import { usePresence } from "@/lib/hooks/usePresence";
import { getGame } from "@/games/registry";
import { toEnginePlayer, toEngineRoom } from "@/lib/game-engine/mappers";
import { HostShell } from "./HostShell";
import { HostLobby } from "./HostLobby";
import type { RoomRow, PlayerRow } from "@/lib/types/database";

interface Props {
  room: RoomRow;
  players: PlayerRow[];
}

// Owns the host's view of a single room: subscribes to realtime state and
// switches between the platform lobby and the active game's HostView based
// on room.status. Never mutates state directly — every action is a fetch to
// an API route that validates and applies the change server-side.
export function HostRoomController({ room: initialRoom, players: initialPlayers }: Props) {
  const { room, players, applyRoomUpdate } = useRoomRealtime(
    initialRoom.id,
    initialRoom,
    initialPlayers
  );
  const onlinePlayerIds = usePresence(room.id, null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = useCallback(async () => {
    setStarting(true);
    setError(null);
    const res = await fetch(`/api/rooms/${room.code}/start`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Could not start game");
    } else {
      applyRoomUpdate(body.room as RoomRow);
    }
    setStarting(false);
  }, [room.code, applyRoomUpdate]);

  if (room.status === "waiting" || room.status === "starting") {
    return (
      <HostShell>
        <HostLobby
          room={room}
          players={players}
          onlinePlayerIds={onlinePlayerIds}
          onStart={startGame}
          starting={starting}
          error={error}
        />
      </HostShell>
    );
  }

  const game = room.game_id ? getGame(room.game_id) : undefined;

  if (!game) {
    return (
      <HostShell>
        <p className="text-center text-muted">Unknown game.</p>
      </HostShell>
    );
  }

  const HostView = game.HostView;

  return (
    <HostShell>
      <HostView
        room={toEngineRoom(room)}
        players={players.map(toEnginePlayer)}
        state={room.game_state}
      />
    </HostShell>
  );
}
