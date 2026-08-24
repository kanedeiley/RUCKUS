import Link from "next/link";
import { SmallLogo } from "./SmallLogo";

// Mounted once in the root layout (app/layout.tsx), not per-page — it needs
// to be everywhere (landing, join, lobby, in-game), and fixed positioning
// means every page gets it for free with no shell wiring.
//
// Styled like Button.tsx's primary variant (same border/shadow/press
// language) rather than a bespoke pixel-art glyph — the app's actual retro
// look already comes from the Bungee display font (--font-sans) plus that
// shadow treatment, not from simulating a pixel grid.
export function HomeButton() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="fixed left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-surface-border bg-primary text-2xl text-primary-foreground shadow-[0_4px_0_0_var(--primary-shadow)] transition-[transform,box-shadow] active:translate-y-[4px] active:shadow-none"
    >
      <SmallLogo />
    </Link>
  );
}
