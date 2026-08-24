"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ensureAnonymousSession } from "@/lib/supabase/anon";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [displayName, setDisplayName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinGame = async (event: FormEvent) => {
    event.preventDefault();
    setJoining(true);
    setError(null);
    try {
      await ensureAnonymousSession();
      const res = await fetch(`/api/rooms/${code.trim().toUpperCase()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not join room");
      router.push(`/room/${body.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setJoining(false);
    }
  };

  return (
    <form onSubmit={joinGame} className="flex w-full max-w-xs flex-col gap-4">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ROOM CODE"
        maxLength={4}
        required
        className="rounded-xl border-2 border-surface-border bg-surface px-4 py-4 text-center text-2xl font-black uppercase tracking-[0.3em] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Your name"
        maxLength={24}
        required
        className="rounded-xl border-2 border-surface-border bg-surface px-4 py-4 text-center text-lg font-semibold text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <Button size="lg" type="submit" disabled={joining}>
        {joining ? "Joining..." : "Join Game"}
      </Button>
      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </form>
  );
}

export default function JoinPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 text-center text-foreground">
      <div>
        <Logo className="mx-auto h-10 w-auto" />
        <h1 className="mt-4 text-2xl font-black uppercase tracking-tight">Join Game</h1>
      </div>
      <Suspense>
        <JoinForm />
      </Suspense>
    </main>
  );
}
