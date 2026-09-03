"use client";

import { gameRegistry } from "@/games/registry";

interface Props {
  selectedGameId: string;
  onSelect: (gameId: string) => void;
  playerCount: number;
}

// Placeholder cover art, keyed by game id, so tiles read as distinct
// characters in the grid before real art exists. Swap an entry for a
// `background-image: url(...)` once a game has cover art to show.
const GAME_ART: Record<string, string> = {
  heist: "linear-gradient(135deg, #cb0808, #740000)",
  cards: "linear-gradient(135deg, #16213e, #4b5b7a)",
  horse_racing: "linear-gradient(135deg, #fbd000, #c79a00)",
};
const FALLBACK_ART = "linear-gradient(135deg, #4b5b7a, #16213e)";

// The host's game grid, shared by the lobby (first game) and the party
// intermission (every game after). Character-select-style tiles instead of
// a stacked list, so a growing game roster doesn't turn into an endless
// scroll. Selection state lives in the caller.
export function GamePicker({ selectedGameId, onSelect, playerCount }: Props) {
  const games = Object.values(gameRegistry);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {games.map((game) => {
        const tooFewPlayers = playerCount < game.minPlayers;
        const selected = selectedGameId === game.id;
        return (
          <button
            key={game.id}
            onClick={() => onSelect(game.id)}
            className={`relative aspect-square overflow-hidden rounded-xl border-2 text-left transition-[transform,box-shadow] active:translate-y-[3px] active:shadow-none ${
              selected
                ? "border-primary shadow-[0_4px_0_0_var(--primary-shadow)]"
                : "border-surface-border shadow-[0_4px_0_0_var(--surface-border)] hover:border-primary/60"
            } ${tooFewPlayers ? "opacity-50" : ""}`}
          >
            <div
              className="absolute inset-0"
              style={{ backgroundImage: GAME_ART[game.id] ?? FALLBACK_ART }}
            />
            {selected && <div className="absolute inset-0 bg-primary/25" />}
            {selected && (
              <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                ✓
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2.5">
              <p className="truncate text-sm font-black uppercase leading-tight text-white">
                {game.name}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/70">
                {game.description}
              </p>
              {tooFewPlayers ? (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-danger">
                  Need {game.minPlayers - playerCount} more
                </p>
              ) : (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/50">
                  {game.minPlayers}-{game.maxPlayers} players
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
