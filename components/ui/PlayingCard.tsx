import { cn } from "@/lib/utils/cn";

export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";
export type CardRank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

interface Props {
  rank?: CardRank;
  suit?: CardSuit;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SUIT_ICON: Record<CardSuit, string> = {
  hearts: "/card/heart.svg",
  diamonds: "/card/diamond.svg",
  clubs: "/card/club.svg",
  spades: "/card/spade.svg",
};

// public/card/*.svg bake their own red (an exact match for --primary) or
// black fill directly into the artwork rather than using currentColor, so
// the rank digit and center wordmark are colored to match by hand instead
// of inheriting one shared suit color.
const SUIT_TEXT_COLOR: Record<CardSuit, string> = {
  hearts: "text-primary",
  diamonds: "text-primary",
  clubs: "text-foreground",
  spades: "text-foreground",
};

// Corner offsets are spelled out per size (rather than built from one shared
// number) because Tailwind's class scanner needs each complete class name to
// appear literally in the source — a template string like `left-${n}` won't
// get picked up.
const SIZE = {
  sm: {
    card: "w-14",
    rank: "text-sm",
    icon: "h-3 w-3",
    word: "text-[9px]",
    tl: "absolute left-1 top-1",
    tr: "absolute right-1 top-1",
    bl: "absolute bottom-1 left-1",
    br: "absolute bottom-1 right-1",
  },
  md: {
    card: "w-20",
    rank: "text-xl",
    icon: "h-4 w-4",
    word: "text-xs",
    tl: "absolute left-1.5 top-1.5",
    tr: "absolute right-1.5 top-1.5",
    bl: "absolute bottom-1.5 left-1.5",
    br: "absolute bottom-1.5 right-1.5",
  },
  lg: {
    card: "w-32",
    rank: "text-3xl",
    icon: "h-7 w-7",
    word: "text-lg",
    tl: "absolute left-2.5 top-2.5",
    tr: "absolute right-2.5 top-2.5",
    bl: "absolute bottom-2.5 left-2.5",
    br: "absolute bottom-2.5 right-2.5",
  },
} as const;

// A sticker-style white halo around the wordmark, the same visual language
// as the outline baked into public/RUCKUS.svg — recreated in text (rather
// than using the Logo component) specifically so it can take the suit's
// color, which the logo's baked-in red fill can't do.
const WORDMARK_OUTLINE =
  "[text-shadow:1px_1px_0_var(--surface),-1px_1px_0_var(--surface),1px_-1px_0_var(--surface),-1px_-1px_0_var(--surface),1px_0_0_var(--surface),-1px_0_0_var(--surface),0_1px_0_var(--surface),0_-1px_0_var(--surface)]";

function Wordmark({ suit, className }: { suit: CardSuit; className?: string }) {
  return (
    <span
      className={cn(
        "font-black uppercase tracking-tight",
        SUIT_TEXT_COLOR[suit],
        WORDMARK_OUTLINE,
        className
      )}
    >
      Ruckus
    </span>
  );
}

// A single component covers both faces — face-down just needs the back
// design, so callers don't need a separate component for a deck's hidden
// cards vs. a dealt hand.
export function PlayingCard({ rank, suit, faceDown = false, size = "md", className }: Props) {
  const s = SIZE[size];

  if (faceDown || !rank || !suit) {
    return (
      <div
        className={cn(
          "flex aspect-[5/7] items-center justify-center rounded-xl border-[3px] border-surface-border bg-surface",
          s.card,
          className
        )}
      >
        <Wordmark suit="clubs" className={s.word} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-[5/7] items-center justify-center rounded-xl border-[3px] border-surface-border bg-surface",
        s.card,
        className
      )}
    >
      {/* Suits sit on one diagonal, ranks on the other — every glyph stays
          right-side up, unlike a physical card's mirrored corners. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SUIT_ICON[suit]} alt={suit} className={cn(s.icon, s.tl)} />
      <span className={cn("font-black", s.rank, s.tr, SUIT_TEXT_COLOR[suit])}>{rank}</span>
      <span className={cn("font-black", s.rank, s.bl, SUIT_TEXT_COLOR[suit])}>{rank}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SUIT_ICON[suit]} alt={suit} className={cn(s.icon, s.br)} />
      <Wordmark suit={suit} className={s.word} />
    </div>
  );
}
