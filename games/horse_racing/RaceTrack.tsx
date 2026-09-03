"use client";

import { PlayingCard } from "@/components/ui/PlayingCard";
import { cn } from "@/lib/utils/cn";
import { HORSES, SUITS, SUIT_SYMBOL } from "./horses";
import { TRACK_LENGTH, type RaceEvent } from "./track";
import { useRaceReplay } from "./useRaceReplay";

const START_POSITIONS: Record<string, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };

interface Props {
  events: RaceEvent[];
}

// The host's big-screen view of a race: all four lanes plus the checkpoint
// strip, replayed at watchable pace via useRaceReplay. PlayerView uses the
// simpler RaceCardFlip instead — four animated lanes at once is a lot to
// parse on a phone.
export function RaceTrack({ events }: Props) {
  const { revealed, latest, finishEvent } = useRaceReplay(events);
  const positions = latest?.positions ?? START_POSITIONS;

  const checkpointReveals = new Map<number, Extract<RaceEvent, { type: "checkpoint" }>>();
  for (const e of revealed) if (e.type === "checkpoint") checkpointReveals.set(e.index, e);

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between px-12">
        {Array.from({ length: TRACK_LENGTH }, (_, i) => i + 1).map((index) => {
          const reveal = checkpointReveals.get(index);
          return (
            <PlayingCard
              key={index}
              size="md"
              faceDown={!reveal}
              suit={reveal?.suit}
              rank={reveal?.rank}
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border-2 border-surface-border bg-surface p-3">
        {SUITS.map((suit) => {
          const horse = HORSES[suit];
          const pct = Math.min(96, (positions[suit] / TRACK_LENGTH) * 100);
          return (
            <div key={suit} className="relative h-9">
              <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-surface-border/40" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={horse.image}
                alt={horse.name}
                className={cn(
                  "absolute top-1/2 h-8 w-auto -translate-y-1/2 transition-[left] duration-500 ease-out",
                  finishEvent?.winner === suit && "drop-shadow-[0_0_8px_var(--accent)]"
                )}
                style={{ left: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-sm text-muted">
        {finishEvent
          ? `🏆 ${HORSES[finishEvent.winner].name} (${SUIT_SYMBOL[finishEvent.winner]}) wins the race!`
          : latest?.type === "checkpoint"
            ? `Checkpoint ${latest.index}: ${latest.rank}${SUIT_SYMBOL[latest.suit]} sends ${HORSES[latest.suit].name} back a space!`
            : latest?.type === "flip"
              ? `${latest.rank}${SUIT_SYMBOL[latest.suit]} — ${HORSES[latest.suit].name} moves up!`
              : "Waiting for the starting flag..."}
      </p>
    </div>
  );
}
