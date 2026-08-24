import type { ReactNode } from "react";

// Layout for the shared TV/laptop screen: big, centered, meant to be read
// from across a room. Kept separate from PlayerShell even though both are
// thin wrappers, because host and player are fundamentally different
// surfaces that will diverge further as real games are built.
// The home button is mounted globally in app/layout.tsx, not here.
export function HostShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-8 py-12 text-foreground">
      <div className="w-full max-w-5xl">{children}</div>
    </main>
  );
}
