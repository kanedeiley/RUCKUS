import type { Metadata } from "next";
import { Geist, Geist_Mono, Bungee } from "next/font/google";
import { RetroBackdrop } from "@/components/ui/RetroBackdrop";
import { HomeButton } from "@/components/ui/HomeButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The app's one font everywhere (see --font-sans in globals.css) — bold
// retro-arcade type with normal, smooth letterforms rather than a
// simulated pixel grid, which is what made letters like c/l/9 hard to tell
// apart in the pixel fonts tried earlier.
const bungee = Bungee({
  variable: "--font-retro",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ruckus",
  description: "Party games for everyone.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bungee.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden flex flex-col">
        <RetroBackdrop />
        <HomeButton />
        {/*
          The page itself never scrolls (overflow-hidden above) — this inner
          div is the one scrollable region instead. iOS Safari has a
          long-standing bug where `position: fixed` elements stop receiving
          taps at their visible location once the outer document has been
          scrolled and the address bar collapses/expands (the fixed element
          repaints correctly but hit-testing uses stale coordinates). Keeping
          the real scrolling confined to this div means the document/body
          never scrolls, so HomeButton (fixed, in RootLayout) never drifts
          out of sync with where it's drawn.
        */}
        <div
          className="relative z-10 flex h-full flex-1 flex-col overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
