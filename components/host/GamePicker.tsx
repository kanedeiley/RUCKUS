"use client";

import { gameRegistry } from "@/games/registry";

interface Props {
  selectedGameId: string;
  onSelect: (gameId: string) => void;
  playerCount: number;
}

// The host's game list, shared by the lobby (first game) and the party
// intermission (every game after). Selection state lives in the caller.
export function GamePicker({ selectedGameId, onSelect, playerCount }: Props) {
  const games = Object.values(gameRegistry);

  return (
    <div className="flex flex-col gap-2">
      {games.map((game) => {
        const tooFewPlayers = playerCount < game.minPlayers;
        return (
          <button
            key={game.id}
            onClick={() => onSelect(game.id)}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              selectedGameId === game.id
                ? "border-primary bg-primary/10"
                : "border-surface-border bg-surface hover:border-primary/50"
            } ${tooFewPlayers ? "opacity-60" : ""}`}
          >
            <p className="font-bold">{game.name}</p>
            <p className="text-xs text-muted">{game.description}</p>
            <p className="mt-1 text-xs text-muted">
              {game.minPlayers}-{game.maxPlayers} players
            </p>
          </button>
        );
      })}
    </div>
  );
}
