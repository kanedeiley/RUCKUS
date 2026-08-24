"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GamePlayerViewProps } from "@/lib/game-engine/types";
import type { PlaceholderState } from "./types";

const FLUSH_INTERVAL_MS = 150;

/**
 * A fast tapper can fire many taps per second. Sending one request per tap
 * means each one competes for the same optimistic-concurrency slot on the
 * room row (see action/route.ts) and retries on conflict — the player ends
 * up fighting their own previous requests, and the UI stalls waiting for
 * responses that are stuck behind each other.
 *
 * Instead, taps accumulate locally and get flushed as a single batched
 * `{ count }` request on a short interval. The displayed count is
 * `confirmedTaps + pending` — an optimistic prediction that's safe here
 * specifically because TAP's effect (add N) is simple and known
 * client-side; `pending` shrinks as the server confirms batches, via the
 * delta-reconciliation in the effect below (not a naive decrement on send,
 * which would make the count visibly dip mid-flight).
 */
export function PlayerView({ player, state, sendAction }: GamePlayerViewProps<PlaceholderState>) {
  const confirmedTaps = state.taps[player.id] ?? 0;
  const [pending, setPending] = useState(0);
  const pendingRef = useRef(0);
  const flushingRef = useRef(false);
  const lastConfirmedRef = useRef(confirmedTaps);

  useEffect(() => {
    const delta = confirmedTaps - lastConfirmedRef.current;
    lastConfirmedRef.current = confirmedTaps;
    if (delta > 0) {
      pendingRef.current = Math.max(0, pendingRef.current - delta);
      setPending(pendingRef.current);
    }
  }, [confirmedTaps]);

  const flush = useCallback(async () => {
    if (flushingRef.current || pendingRef.current === 0) return;
    flushingRef.current = true;
    const count = pendingRef.current;
    try {
      await sendAction({ type: "TAP", count });
    } finally {
      flushingRef.current = false;
    }
  }, [sendAction]);

  useEffect(() => {
    const interval = setInterval(flush, FLUSH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [flush]);

  const handleTap = () => {
    pendingRef.current += 1;
    setPending(pendingRef.current);
    if (!flushingRef.current) flush();
  };

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <p className="text-muted">Your taps</p>
        <p className="text-6xl font-black text-primary">{confirmedTaps + pending}</p>
      </div>
      <button
        onClick={handleTap}
        className="h-40 w-40 rounded-full border-2 border-surface-border bg-primary text-xl font-black uppercase tracking-wide text-primary-foreground shadow-[0_6px_0_0_var(--primary-shadow)] transition-[transform,box-shadow] active:translate-y-[6px] active:shadow-none"
      >
        Ruckus!
      </button>
    </div>
  );
}
