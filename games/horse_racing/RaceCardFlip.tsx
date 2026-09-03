"use client";

import type { CardSuit } from "@/components/ui/PlayingCard";
import { PlayingCard } from "@/components/ui/PlayingCard";
import { HORSES } from "./horses";
import type { RaceEvent } from "./track";
import { useRaceReplay } from "./useRaceReplay";

interface Props {
  events: RaceEvent[];
  /** The horse this player backed, if any — decides the eventual headline. */
  myPick?: CardSuit;
}

// PlayerView's take on the race: tracking four moving horses on a phone is
// a lot to parse, so instead of the host's full track this just flips one
// card at a time — the same replay, paced by the same shared hook, reduced
// to what actually matters on a small screen. The win/lose headline is
// gated on this component's own replay reaching the finish event (not on
// state.winner directly), so a phone doesn't spoil the ending before the
// cards have even started flipping.
export function RaceCardFlip({ events, myPick }: Props) {
  const { revealCount, revealed, latest, finishEvent } = useRaceReplay(events);
  // The "finish" event carries no card of its own — it just names the
  // winner — so once it's revealed, keep showing the actual card that
  // decided the race instead of flipping back to a blank face-down back.
  const flipped = [...revealed].reverse().find((e) => e.type !== "finish");

  return (
    <div className="flex flex-col items-center gap-5">
      <style>{`
        @keyframes horse-race-card-flip {
          from { transform: rotateY(90deg); opacity: 0.3; }
          to { transform: rotateY(0deg); opacity: 1; }
        }
      `}</style>

      <h1 className="text-2xl font-black">
        {!finishEvent
          ? "🏁 Race's on!"
          : myPick && myPick === finishEvent.winner
            ? "🏆 You called it!"
            : "😬 Better luck next time"}
      </h1>

      <div key={revealCount} className="[animation:horse-race-card-flip_350ms_ease-out] [perspective:400px]">
        <PlayingCard size="lg" faceDown={!flipped} suit={flipped?.suit} rank={flipped?.rank} />
      </div>

      <p className="text-center text-sm text-muted">
        {finishEvent
          ? `${HORSES[finishEvent.winner].name} crosses the line first!`
          : latest?.type === "checkpoint"
            ? `Checkpoint ${latest.index} — ${HORSES[latest.suit].name} sent back a space!`
            : latest?.type === "flip"
              ? `${HORSES[latest.suit].name} moves up!`
              : "Shuffling the deck..."}
      </p>
    </div>
  );
}
