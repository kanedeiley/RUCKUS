import type { Metadata } from "next";
import { Geist, Geist_Mono, Bungee } from "next/font/google";
import { RetroBackdrop } from "@/components/ui/RetroBackdrop";
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
      <body className="min-h-full flex flex-col">
        <RetroBackdrop />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
