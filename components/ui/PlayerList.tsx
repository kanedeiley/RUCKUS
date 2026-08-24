import { StatusDot } from "./StatusDot";
import { cn } from "@/lib/utils/cn";
import type { PlayerRow } from "@/lib/types/database";

interface Props {
  players: PlayerRow[];
  onlinePlayerIds: Set<string>;
  variant: "host" | "player";
  highlightId?: string;
}

export function PlayerList({ players, onlinePlayerIds, variant, highlightId }: Props) {
  return (
    <ul
      className={cn(
        "flex flex-col gap-2",
        variant === "host" && "grid grid-cols-2 gap-3 sm:grid-cols-3"
      )}
    >
      {players.map((player) => (
        <li
          key={player.id}
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border-2 border-surface-border bg-surface px-4 py-3",
            player.id === highlightId && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          <span className="flex min-w-0 items-center gap-2 font-semibold">
            <StatusDot online={onlinePlayerIds.has(player.id)} />
            <span className="truncate">{player.display_name}</span>
          </span>
          {variant === "host" && (
            <span className="shrink-0 text-sm text-muted">{player.score}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
