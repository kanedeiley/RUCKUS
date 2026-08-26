import type { CardRank, CardSuit } from "@/components/ui/PlayingCard";

export interface Card {
  suit: CardSuit;
  rank: CardRank;
}

const SUITS: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: CardRank[] = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
];

export function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ suit, rank });
  }
  return deck;
}

// Fisher-Yates.
export function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
