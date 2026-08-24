"use client";

import { useState } from "react";
import { RoomCodeBadge } from "@/components/ui/RoomCodeBadge";
import { PlayerList } from "@/components/ui/PlayerList";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { gameRegistry } from "@/games/registry";
import type { RoomRow, PlayerRow } from "@/lib/types/database";

interface Props {
  room: RoomRow;
  players: PlayerRow[];
  onlinePlayerIds: Set<string>;
  onStart: (gameId: string) => void;
  starting: boolean;
  error: string | null;
}

export function HostLobby({
  room,
  players,
  onlinePlayerIds,
  onStart,
  starting,
  error,
}: Props) {
  const [selectedGame, setSelectedGame] = useState("placeholder");
  const games = Object.values(gameRegistry);
  const selectedGameObj = gameRegistry[selectedGame];

  const canStart =
    !starting &&
    players.length > 0 &&
    selectedGameObj &&
    players.length >= selectedGameObj.minPlayers;

  return (
    <div className="flex flex-col items-center gap-10 text-center">
      <div>
        <h1>
          <Logo className="mx-auto h-8 w-auto" />
        </h1>
        <p className="mt-6 text-sm uppercase tracking-widest text-muted">Room code</p>
        <RoomCodeBadge code={room.code} />
        <p className="mt-4 text-muted">Join from your phone using this code</p>
      </div>

      <div className="w-full">
        <p className="mb-4 text-sm uppercase tracking-widest text-muted">
          Players ({players.length})
        </p>
        {players.length > 0 ? (
          <PlayerList players={players} onlinePlayerIds={onlinePlayerIds} variant="host" />
        ) : (
          <p className="text-muted">Waiting for players to join...</p>
        )}
      </div>

      <div className="w-full max-w-md">
        <p className="mb-4 text-sm uppercase tracking-widest text-muted">Select a game</p>
        <div className="flex flex-col gap-2">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`rounded-lg border-2 p-4 text-left transition-colors ${
                selectedGame === game.id
                  ? "border-primary bg-primary/10"
                  : "border-surface-border bg-surface hover:border-primary/50"
              }`}
            >
              <p className="font-bold">{game.name}</p>
              <p className="text-xs text-muted">{game.description}</p>
              <p className="mt-1 text-xs text-muted">
                {game.minPlayers}-{game.maxPlayers} players
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={() => onStart(selectedGame)}
          disabled={!canStart}
        >
          {starting ? "Starting..." : "Start Game"}
        </Button>
        {!canStart && selectedGameObj && players.length < selectedGameObj.minPlayers && (
          <p className="text-sm text-danger">
            Need {selectedGameObj.minPlayers - players.length} more player(s)
          </p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
