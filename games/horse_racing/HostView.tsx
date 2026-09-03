import type { GameHostViewProps } from "@/lib/game-engine/types";
import { cn } from "@/lib/utils/cn";
import { HORSES, SUITS, SUIT_SYMBOL } from "./horses";
import { RaceTrack } from "./RaceTrack";
import type { HorseRacingState } from "./types";

export function HostView({ players, state }: GameHostViewProps<HorseRacingState>) {
  const betting = state.phase === "betting";

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Horse Race</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight">
          {betting ? "Place Your Bets" : "And They're Off!"}
        </h1>
        <p className="mt-3 text-muted">
          {betting
            ? "Pick a horse on your phone — the race starts once someone taps Start."
            : "The checkpoints can send anyone packing. Anything can happen."}
        </p>
      </div>

      <RaceTrack events={state.events} />

      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        {SUITS.map((suit) => {
          const horse = HORSES[suit];
          const backers = players.filter((p) => state.picks[p.id] === suit);
          const won = state.phase === "finished" && state.winner === suit;
          return (
            <div
              key={suit}
              className={cn(
                "rounded-2xl border-2 bg-surface p-4",
                won ? "border-accent" : "border-surface-border"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={horse.image} alt={horse.name} className="mx-auto h-10 w-auto" />
              <p className="mt-2 font-black">{horse.name}</p>
              <p className="text-xs text-muted">
                {SUIT_SYMBOL[suit]} {suit}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {backers.length === 0 ? (
                  <span className="text-xs text-muted">no bets yet</span>
                ) : (
                  backers.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full bg-background px-2 py-0.5 text-xs font-bold"
                    >
                      {p.displayName}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
