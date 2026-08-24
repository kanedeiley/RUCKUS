"use client";

import { useCallback, useMemo } from "react";
import { useRoomRealtime } from "@/lib/hooks/useRoomRealtime";
import { usePresence } from "@/lib/hooks/usePresence";
import { getGame } from "@/games/registry";
import { toEnginePlayer, toEngineRoom } from "@/lib/game-engine/mappers";
import { PlayerShell } from "./PlayerShell";
import { PlayerLobby } from "./PlayerLobby";
import type { RoomRow, PlayerRow } from "@/lib/types/database";

interface Props {
  room: RoomRow;
  players: PlayerRow[];
  currentPlayer: PlayerRow;
}

// Player-side counterpart to HostRoomController: same realtime state, same
// status-driven switch between lobby and game, but renders the game's
// PlayerView and is the only place PLAYER_ACTION requests originate from.
export function PlayerRoomController({
  room: initialRoom,
  players: initialPlayers,
  currentPlayer,
}: Props) {
  const { room, players, applyRoomUpdate } = useRoomRealtime(
    initialRoom.id,
    initialRoom,
    initialPlayers
  );

  const self = useMemo(
    () => ({ playerId: currentPlayer.id, displayName: currentPlayer.display_name }),
    [currentPlayer.id, currentPlayer.display_name]
  );
  const onlinePlayerIds = usePresence(room.id, self);

  const sendAction = useCallback(
    async (action: { type: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/rooms/${room.code}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      // Apply the server's response immediately rather than waiting for the
      // realtime echo of this same write — that's a second network hop
      // (DB -> Realtime -> client) this request has already made moot.
      if (res.ok) {
        const body = await res.json();
        applyRoomUpdate(body.room as RoomRow);
      }
    },
    [room.code, applyRoomUpdate]
  );

  const me = players.find((p) => p.id === currentPlayer.id) ?? currentPlayer;

  if (room.status === "waiting" || room.status === "starting") {
    return (
      <PlayerShell>
        <PlayerLobby
          room={room}
          players={players}
          onlinePlayerIds={onlinePlayerIds}
          currentPlayerId={me.id}
        />
      </PlayerShell>
    );
  }

  const game = room.game_id ? getGame(room.game_id) : undefined;

  if (!game) {
    return (
      <PlayerShell>
        <p className="text-center text-muted">Unknown game.</p>
      </PlayerShell>
    );
  }

  const PlayerView = game.PlayerView;

  return (
    <PlayerShell>
      <PlayerView
        room={toEngineRoom(room)}
        player={toEnginePlayer(me)}
        state={room.game_state}
        sendAction={sendAction}
      />
    </PlayerShell>
  );
}
