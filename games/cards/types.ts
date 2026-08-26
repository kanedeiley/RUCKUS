import type { Card } from "./deck";

export interface DeckState {
  /** playerId -> the hand they were dealt */
  hands: Record<string, Card[]>;
}

export type DeckAction = { type: "REDRAW" };
