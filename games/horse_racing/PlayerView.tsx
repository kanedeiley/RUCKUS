"use client";

import { useState } from "react";
import type { CardSuit } from "@/components/ui/PlayingCard";
import type { GamePlayerViewProps } from "@/lib/game-engine/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { HORSES, SUITS, SUIT_SYMBOL } from "./horses";
import { RaceCardFlip } from "./RaceCardFlip";
import type { HorseRacingState } from "./types";

export function PlayerView({ player, state, sendAction }: GamePlayerViewProps<HorseRacingState>) {
  const [starting, setStarting] = useState(false);
  const myPick = state.picks[player.id];
  const betting = state.phase === "betting";

  const pick = (suit: CardSuit) => sendAction({ type: "PICK_HORSE", suit });

  const start = async () => {
    setStarting(true);
    await sendAction({ type: "START_RACE" });
    setStarting(false);
  };

  if (!betting) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-muted">{player.displayName}</p>
        <RaceCardFlip events={state.events} myPick={myPick} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <p className="text-muted">{player.displayName}</p>
        <h1 className="text-2xl font-black">Pick your horse</h1>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        {SUITS.map((suit) => {
          const horse = HORSES[suit];
          const selected = myPick === suit;
          return (
            <button
              key={suit}
              type="button"
              onClick={() => pick(suit)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 bg-surface p-4 transition-[transform,box-shadow] active:translate-y-[2px] active:shadow-none",
                selected
                  ? "border-primary shadow-[0_4px_0_0_var(--primary-shadow)]"
                  : "border-surface-border shadow-[0_4px_0_0_var(--surface-border)]"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={horse.image} alt={horse.name} className="h-12 w-auto" />
              <span className="font-black">{horse.name}</span>
              <span className="text-xs text-muted">
                {SUIT_SYMBOL[suit]} {suit}
              </span>
            </button>
          );
        })}
      </div>

      {myPick ? (
        <Button size="lg" onClick={start} disabled={starting}>
          {starting ? "Starting…" : "Start Race 🏁"}
        </Button>
      ) : (
        <p className="text-sm text-muted">Pick a horse to unlock the start button.</p>
      )}
    </div>
  );
}
