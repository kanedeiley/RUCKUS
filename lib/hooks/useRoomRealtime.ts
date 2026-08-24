"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoomRow, PlayerRow } from "@/lib/types/database";

// Realtime (the WebSocket push) is the primary transport — this is only a
// backstop for a connection that silently stalls while the tab stays
// foregrounded. A phone waking from sleep is handled separately, and much
// faster, by the visibilitychange listener below.
const POLL_INTERVAL_MS = 8000;

/**
 * Subscribes to Postgres changes for a room and its players, seeded with
 * server-rendered initial data. This is the mechanism behind "host + players
 * update their UIs" — every authoritative write happens through an API
 * route, and this hook is what pushes the resulting row changes back out to
 * every connected client.
 *
 * Also returns `applyRoomUpdate`, so a caller that just made a write (e.g.
 * a player's own tap) can apply the API response to local state the moment
 * it arrives, instead of waiting for the realtime echo of that same write —
 * a second network hop (DB -> Realtime -> client) on top of the request
 * that already told us the answer.
 */
export function useRoomRealtime(
  roomId: string,
  initialRoom: RoomRow,
  initialPlayers: PlayerRow[]
) {
  const [room, setRoom] = useState(initialRoom);
  const [players, setPlayers] = useState(initialPlayers);

  // The optimistic apply (from an API response), the realtime echo of that
  // same write, and the poll/resync fallback below can all arrive in any
  // order. game_state_version only moves forward, so this is a cheap guard
  // against an in-flight/stale message clobbering a state we've already
  // moved past — but it fails *open* when either version isn't a usable
  // number (e.g. a tab that fetched its initial state before a migration
  // added the column). `undefined >= undefined` is always false in JS, so
  // without this fallback a bad version would silently wedge the UI shut
  // for the rest of the session instead of just skipping one comparison.
  const applyRoomUpdate = useCallback((next: RoomRow) => {
    setRoom((current) => {
      const nextVersion = next.game_state_version;
      const currentVersion = current.game_state_version;
      if (typeof nextVersion !== "number" || typeof currentVersion !== "number") {
        return next;
      }
      return nextVersion >= currentVersion ? next : current;
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const resync = async () => {
      const [{ data: freshRoom }, { data: freshPlayers }] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", roomId).maybeSingle(),
        supabase.from("players").select("*").eq("room_id", roomId),
      ]);
      if (cancelled) return;
      if (freshRoom) applyRoomUpdate(freshRoom);
      if (freshPlayers) setPlayers(freshPlayers);
    };

    const channel = supabase
      .channel(`room-db:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => applyRoomUpdate(payload.new as RoomRow)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setPlayers((current) => {
            if (payload.eventType === "DELETE") {
              const removed = payload.old as PlayerRow;
              return current.filter((p) => p.id !== removed.id);
            }
            const next = payload.new as PlayerRow;
            const exists = current.some((p) => p.id === next.id);
            return exists
              ? current.map((p) => (p.id === next.id ? next : p))
              : [...current, next];
          });
        }
      )
      .subscribe();

    // A WebSocket can die silently: a phone backgrounding the tab, the
    // screen locking, a momentary WiFi drop. There's no client-side event
    // for "you missed some messages," so resync immediately when the tab
    // becomes visible again (the common case), and on a slow interval as a
    // backstop for a connection that stalls while still in the foreground.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") resync();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const pollId = setInterval(resync, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [roomId, applyRoomUpdate]);

  return { room, players, applyRoomUpdate };
}
