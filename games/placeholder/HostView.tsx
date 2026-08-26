import type { GameHostViewProps } from "@/lib/game-engine/types";
import type { PlaceholderState } from "./types";

export function HostView({ players, state }: GameHostViewProps<PlaceholderState>) {
  const sorted = [...players].sort(
    (a, b) => (state.taps[b.id] ?? 0) - (state.taps[a.id] ?? 0)
  );
  const winner = state.winnerId
    ? players.find((p) => p.id === state.winnerId)
    : undefined;

  return (
    <div className="flex flex-col items-center gap-10 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Tap race</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Ruckus Check</h1>
        <p className="mt-3 text-muted">
          {winner
            ? `${winner.displayName} wins the race!`
            : `First to ${state.targetTaps} taps wins.`}
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        {sorted.map((player) => (
          <div
            key={player.id}
            className={`rounded-2xl border-2 bg-surface p-5 ${
              player.id === state.winnerId ? "border-primary" : "border-surface-border"
            }`}
          >
            <p className="truncate text-lg font-bold">{player.displayName}</p>
            <p className="text-3xl font-black text-primary">{state.taps[player.id] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
