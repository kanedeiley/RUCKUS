import type { CardSuit } from "@/components/ui/PlayingCard";
import type { RaceEvent } from "./track";

export type RacePhase = "betting" | "finished";

export interface HorseRacingState {
  phase: RacePhase;
  /** playerId -> the horse they backed. Only settable during betting. */
  picks: Record<string, CardSuit>;
  /** Empty until START_RACE — the full deterministic replay log. */
  events: RaceEvent[];
  winner?: CardSuit;
  finalPositions?: Record<CardSuit, number>;
}

export type HorseRacingAction =
  | { type: "PICK_HORSE"; suit: CardSuit }
  | { type: "START_RACE" };
