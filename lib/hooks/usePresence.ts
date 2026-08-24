"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PresenceMeta {
  playerId: string;
  displayName: string;
}

// crypto.randomUUID() only exists in secure contexts (HTTPS, or localhost) —
// it throws over plain HTTP on a LAN address, which is exactly how a host
// laptop gets tested against phones on the same WiFi during development.
// This key is just a Presence channel identifier, not a security value, so
// a non-cryptographic fallback is fine.
function observerKey(): string {
  return `observer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Live "is this phone connected right now" signal via Supabase Presence.
 * Deliberately not persisted to Postgres — connection state is exactly the
 * kind of highly transient data that belongs in realtime infra, not the
 * database. `players.status` in Postgres only tracks last-known state for
 * reconnect logic, not live presence.
 *
 * Pass `self: null` to observe a room's presence without joining it
 * (the host screen isn't itself a player).
 */
export function usePresence(roomId: string, self: PresenceMeta | null) {
  const [onlinePlayerIds, setOnlinePlayerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`room-presence:${roomId}`, {
      config: { presence: { key: self?.playerId ?? observerKey() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceMeta>();
        setOnlinePlayerIds(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && self) {
          await channel.track(self);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, self?.playerId, self?.displayName]);

  return onlinePlayerIds;
}
