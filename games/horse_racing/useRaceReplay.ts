"use client";

import { useEffect, useState } from "react";
import type { RaceEvent } from "./track";

const FLIP_DELAY_MS = 900;
// Checkpoints are the game's big swings — a beat longer than a plain flip
// gives the reveal room to land instead of blowing past it at the same pace.
const CHECKPOINT_DELAY_MS = 1700;

function delayAfter(event: RaceEvent): number {
  return event.type === "checkpoint" ? CHECKPOINT_DELAY_MS : FLIP_DELAY_MS;
}

/**
 * Steps through a precomputed race log one event at a time, for HostView's
 * full track and PlayerView's simple card flip to both replay in lockstep
 * at the same pace. A chained setTimeout rather than setInterval so each
 * step's delay can depend on the event it just revealed (see
 * CHECKPOINT_DELAY_MS). Keyed on the event count rather than the `events`
 * array itself — the realtime echo of the room update that delivers
 * `events` arrives as a freshly-deserialized array (new reference,
 * identical content), and depending on the array would restart the
 * animation from scratch on that echo.
 */
export function useRaceReplay(events: RaceEvent[]) {
  const [revealCount, setRevealCount] = useState(0);
  const eventCount = events.length;

  useEffect(() => {
    if (eventCount === 0) return;
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout>;

    const scheduleNext = (i: number) => {
      if (i >= eventCount) return;
      timerId = setTimeout(() => {
        if (cancelled) return;
        setRevealCount(i + 1);
        scheduleNext(i + 1);
      }, delayAfter(events[i]));
    };
    scheduleNext(0);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
    // `events` deliberately excluded — see the doc comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventCount]);

  const revealed = events.slice(0, revealCount);
  const latest = revealed[revealed.length - 1];
  const finishEvent = revealed.find(
    (e): e is Extract<RaceEvent, { type: "finish" }> => e.type === "finish"
  );

  return { revealCount, revealed, latest, finishEvent };
}
