import type { CardRank, CardSuit } from "@/components/ui/PlayingCard";
import { SUITS } from "./horses";

export interface Card {
  suit: CardSuit;
  rank: CardRank;
}

// Aces are removed from the deck — they're the horses themselves, laid at
// the starting line rather than shuffled into the race deck.
const RANKS: CardRank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const TRACK_LENGTH = 7;
const CHECKPOINT_COUNT = 7;

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ suit, rank });
  }
  return deck;
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export type RaceEvent =
  | { type: "flip"; suit: CardSuit; rank: CardRank; positions: Record<CardSuit, number> }
  | {
      type: "checkpoint";
      index: number;
      suit: CardSuit;
      rank: CardRank;
      positions: Record<CardSuit, number>;
    }
  | { type: "finish"; winner: CardSuit; positions: Record<CardSuit, number> };

export interface RaceResult {
  events: RaceEvent[];
  winner: CardSuit;
  finalPositions: Record<CardSuit, number>;
}

/**
 * Runs an entire race to completion in one shot and returns a full replay
 * log. The platform has no server-side clock and HostView is read-only (it
 * can't drive the race step by step), so the whole thing is simulated
 * deterministically here; HostView/PlayerView just animate through the
 * returned events client-side for the reveal.
 */
export function runRace(): RaceResult {
  const deck = shuffle(buildDeck());
  const checkpoints = deck.slice(0, CHECKPOINT_COUNT);
  const raceDeck = deck.slice(CHECKPOINT_COUNT);

  const positions: Record<CardSuit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
  const events: RaceEvent[] = [];
  let nextCheckpoint = 0;
  let winner: CardSuit | undefined;

  for (const card of raceDeck) {
    positions[card.suit] += 1;
    events.push({ type: "flip", suit: card.suit, rank: card.rank, positions: { ...positions } });

    if (positions[card.suit] >= TRACK_LENGTH) {
      winner = card.suit;
      break;
    }

    // A checkpoint only flips once every horse has reached (or passed) its
    // spot — a while loop so a single flip that happens to satisfy several
    // pending checkpoints at once resolves all of them in order.
    while (
      nextCheckpoint < checkpoints.length &&
      SUITS.every((s) => positions[s] >= nextCheckpoint + 1)
    ) {
      const checkpointCard = checkpoints[nextCheckpoint];
      positions[checkpointCard.suit] = Math.max(0, positions[checkpointCard.suit] - 1);
      events.push({
        type: "checkpoint",
        index: nextCheckpoint + 1,
        suit: checkpointCard.suit,
        rank: checkpointCard.rank,
        positions: { ...positions },
      });
      nextCheckpoint += 1;
    }
  }

  // The 41-card race deck comfortably covers the worst case (7 spaces per
  // horse, plus at most 7 checkpoint setbacks total), but if it's ever
  // exhausted without a finisher, crown whoever's furthest along.
  if (!winner) {
    winner = SUITS.slice().sort((a, b) => positions[b] - positions[a])[0];
  }
  events.push({ type: "finish", winner, positions: { ...positions } });

  return { events, winner, finalPositions: positions };
}
