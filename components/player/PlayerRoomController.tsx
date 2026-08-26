"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRoomRealtime } from "@/lib/hooks/useRoomRealtime";
import { usePresence, HOST_PRESENCE_KEY } from "@/lib/hooks/usePresence";
import { getGame } from "@/games/registry";
import { toEnginePlayer, toEngineRoom } from "@/lib/game-engine/mappers";
import { PlayerShell } from "./PlayerShell";
import { PlayerLobby } from "./PlayerLobby";
import { PlayerIntermission } from "./PlayerIntermission";
import type { RoomRow, PlayerRow } from "@/lib/types/database";

// Leave once the host screen has been gone this long. Generous enough that
// a host refresh (a few seconds of absence) never kicks anyone.
const HOST_GONE_MS = 30_000;

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
  const router = useRouter();

  // When the host screen's presence has been gone for HOST_GONE_MS, just
  // leave — no server round trip, no room bookkeeping. The abandoned row
  // gets deleted by the pg_cron job (migration 0003).
  const hostOnline = onlinePlayerIds.has(HOST_PRESENCE_KEY);
  const hostOnlineRef = useRef(hostOnline);
  hostOnlineRef.current = hostOnline;

  useEffect(() => {
    let lastSeen = Date.now();
    const id = setInterval(() => {
      if (hostOnlineRef.current) {
        lastSeen = Date.now();
      } else if (Date.now() - lastSeen > HOST_GONE_MS) {
        router.push("/");
      }
    }, 5_000);
    return () => clearInterval(id);
  }, [router]);

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

  // Session-layer screens: between games in a party, and the party's end.
  if (
    room.status === "intermission" ||
    (room.status === "finished" && room.mode === "party")
  ) {
    return (
      <PlayerShell>
        <PlayerIntermission
          room={room}
          players={players}
          currentPlayerId={me.id}
          final={room.status === "finished"}
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
