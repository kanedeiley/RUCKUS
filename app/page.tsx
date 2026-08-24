"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ensureAnonymousSession } from "@/lib/supabase/anon";

export default function LandingPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async () => {
    setCreating(true);
    setError(null);
    try {
      await ensureAnonymousSession();
      const res = await fetch("/api/rooms", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not create room");
      router.push(`/room/${body.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 text-center text-foreground">
      <div>
        <h1>
          <Logo className="h-14 w-auto drop-shadow-[3px_3px_0_var(--surface-border)] sm:h-16" />
        </h1>
        <p className="mt-4 text-lg font-semibold text-foreground/80">
          Party games for everyone.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <Button size="lg" onClick={createGame} disabled={creating}>
          {creating ? "Creating..." : "Create Game"}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => router.push("/join")}>
          Join Game
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </main>
  );
}
