import type { ReactNode } from "react";

// Mobile-first layout for a player's phone. Kept separate from HostShell —
// see the note there.
// The home button is mounted globally in app/layout.tsx, not here.
export function PlayerShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-foreground">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
