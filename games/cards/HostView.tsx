import type { GameHostViewProps } from "@/lib/game-engine/types";
import { PlayingCard } from "@/components/ui/PlayingCard";
import type { DeckState } from "./types";

export function HostView({ players, state }: GameHostViewProps<DeckState>) {
  return (
    <div className="flex flex-col items-center gap-10 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Deal Me In</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Everyone&apos;s Hand</h1>
        <p className="mt-3 text-muted">Check your phone — your cards are waiting.</p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="rounded-2xl border-2 border-surface-border bg-surface p-5"
          >
            <p className="mb-3 truncate text-lg font-bold">{player.displayName}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {(state.hands[player.id] ?? []).map((card, i) => (
                <PlayingCard key={i} rank={card.rank} suit={card.suit} size="sm" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
