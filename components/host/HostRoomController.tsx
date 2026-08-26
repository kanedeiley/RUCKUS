"use client";

import { useCallback, useMemo, useState } from "react";
import { useRoomRealtime } from "@/lib/hooks/useRoomRealtime";
import { usePresence, HOST_PRESENCE_KEY } from "@/lib/hooks/usePresence";
import { getGame } from "@/games/registry";
import { toEnginePlayer, toEngineRoom } from "@/lib/game-engine/mappers";
import { Button } from "@/components/ui/Button";
import { HostShell } from "./HostShell";
import { HostLobby } from "./HostLobby";
import { HostIntermission } from "./HostIntermission";
import { HostFinalResults } from "./HostFinalResults";
import type { RoomRow, PlayerRow, RoomMode } from "@/lib/types/database";

interface Props {
  room: RoomRow;
  players: PlayerRow[];
}

// Owns the host's view of a single room: subscribes to realtime state and
// switches between the platform lobby, the active game's HostView, and the
// session-layer screens (intermission / final results) based on room.status.
// Never mutates state directly — every action is a fetch to an API route
// that validates and applies the change server-side.
export function HostRoomController({ room: initialRoom, players: initialPlayers }: Props) {
  const { room, players, applyRoomUpdate } = useRoomRealtime(
    initialRoom.id,
    initialRoom,
    initialPlayers
  );
  // The host tracks itself in presence (not as a player) so phones know,
  // live, whether the host screen is still open — when it disappears for
  // long enough, players send themselves home (see PlayerRoomController).
  const hostPresence = useMemo(
    () => ({ playerId: HOST_PRESENCE_KEY, displayName: "Host" }),
    []
  );
  const onlinePlayerIds = usePresence(room.id, hostPresence);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = useCallback(
    async (gameId: string, mode?: RoomMode, plannedGames?: number) => {
      setStarting(true);
      setError(null);
      const res = await fetch(`/api/rooms/${room.code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, mode, plannedGames }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Could not start game");
      } else {
        applyRoomUpdate(body.room as RoomRow);
      }
      setStarting(false);
    },
    [room.code, applyRoomUpdate]
  );

  // Session-layer transitions the host drives directly: ending a running
  // game early (no points) and closing out the party from intermission.
  const finish = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/rooms/${room.code}/finish`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Could not end the game");
    } else {
      applyRoomUpdate(body.room as RoomRow);
    }
  }, [room.code, applyRoomUpdate]);

  // Quick play's loop: reopen a finished room back to the lobby so the
  // group can pick the next game without a new room code.
  const backToLobby = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/rooms/${room.code}/reset`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Could not reopen the room");
    } else {
      applyRoomUpdate(body.room as RoomRow);
    }
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

  if (room.status === "intermission") {
    return (
      <HostShell>
        <HostIntermission
          room={room}
          players={players}
          onStart={startGame}
          onFinishParty={finish}
          starting={starting}
          error={error}
        />
      </HostShell>
    );
  }

  if (room.status === "finished" && room.mode === "party") {
    return (
      <HostShell>
        <HostFinalResults room={room} players={players} />
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
      {room.mode === "party" && room.status === "playing" && (
        <div className="mt-8 text-center">
          <button
            onClick={finish}
            className="text-sm text-muted underline-offset-4 hover:underline"
          >
            End this game early (no points)
          </button>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>
      )}
      {room.mode === "single" && room.status === "finished" && (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <Button size="lg" onClick={backToLobby}>
            Back to Game Selection
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </HostShell>
  );
}
