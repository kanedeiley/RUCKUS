import type { CardSuit } from "@/components/ui/PlayingCard";

export const SUITS: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];

export const SUIT_SYMBOL: Record<CardSuit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export interface HorseInfo {
  suit: CardSuit;
  name: string;
  image: string;
}

// The four public/horse/*.svg colors stand in for the four suits — the
// mapping is arbitrary (nothing in the rules ties a suit to a color), it
// just needs to be fixed so a horse always looks the same across a race.
export const HORSES: Record<CardSuit, HorseInfo> = {
  spades: { suit: "spades", name: "Midnight", image: "/horse/black_horse.svg" },
  clubs: { suit: "clubs", name: "Biscuit", image: "/horse/brown_horse.svg" },
  hearts: { suit: "hearts", name: "Sandy", image: "/horse/tan_horse.svg" },
  diamonds: { suit: "diamonds", name: "Ghost", image: "/horse/white_horse.svg" },
};
