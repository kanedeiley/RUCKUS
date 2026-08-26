import Link from "next/link";

// Mounted once in the root layout (app/layout.tsx), not per-page — it needs
// to be everywhere (landing, join, lobby, in-game), and fixed positioning
// means every page gets it for free with no shell wiring.
//
// No separate button chrome (border/shadow/rounded square) — the logo
// badge is already a self-contained circle, so it IS the button.
export function HomeButton() {
  return (
    <Link
      href="/"
      aria-label="Back to Home"
      className="fixed left-4 top-4 z-20 h-12 w-12 transition-transform active:scale-90"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/RuckusLogoSmall.svg" alt="Ruckus" className="h-full w-full" />
    </Link>
  );
}
