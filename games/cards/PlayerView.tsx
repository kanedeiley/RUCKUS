"use client";

import type { GamePlayerViewProps } from "@/lib/game-engine/types";
import { PlayingCard } from "@/components/ui/PlayingCard";
import { Button } from "@/components/ui/Button";
import type { DeckState } from "./types";

export function PlayerView({ player, state, sendAction }: GamePlayerViewProps<DeckState>) {
  const hand = state.hands[player.id] ?? [];

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <p className="text-muted">Your hand</p>
        <h1 className="text-2xl font-black">{player.displayName}</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {hand.map((card, i) => (
          <PlayingCard key={i} rank={card.rank} suit={card.suit} size="lg" />
        ))}
      </div>

      <Button onClick={() => sendAction({ type: "REDRAW" })}>Shuffle new hand</Button>
    </div>
  );
}
