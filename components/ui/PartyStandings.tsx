import { cn } from "@/lib/utils/cn";
import { rankByScore } from "@/lib/game-engine/session";
import type { PlayerRow } from "@/lib/types/database";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface Props {
  players: PlayerRow[];
  /** playerId -> points from the game that just ended, shown as +N. */
  lastPoints?: Record<string, number>;
  highlightId?: string;
}

// The party scoreboard: players ranked by party points (players.score),
// which only the session layer writes. Shared by the host intermission,
// final results, and the player-side between-games screen.
export function PartyStandings({ players, lastPoints, highlightId }: Props) {
  const ranks = rankByScore(
    Object.fromEntries(players.map((p) => [p.id, p.score]))
  );
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <ul className="flex w-full max-w-md flex-col gap-2">
      {sorted.map((player) => {
        const rank = ranks[player.id];
        const gained = lastPoints?.[player.id] ?? 0;
        return (
          <li
            key={player.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border-2 border-surface-border bg-surface px-4 py-3",
              player.id === highlightId &&
                "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="w-7 shrink-0 text-lg font-black">
                {MEDALS[rank] ?? `#${rank}`}
              </span>
              <span className="truncate font-semibold">{player.display_name}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2">
              {gained > 0 && (
                <span className="text-sm font-bold text-primary">+{gained}</span>
              )}
              <span className="text-lg font-black">{player.score}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
