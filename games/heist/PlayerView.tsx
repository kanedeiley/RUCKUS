"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GamePlayerViewProps } from "@/lib/game-engine/types";
import type { HeistState } from "./types";

interface ButtonMapping {
  buttonA: "JUMP" | "DASH" | "INTERACT";
  buttonB: "JUMP" | "DASH" | "INTERACT";
  buttonC: "JUMP" | "DASH" | "INTERACT";
}

export function PlayerView({
  room,
  player,
  state,
  sendAction,
}: GamePlayerViewProps<HeistState>) {
  const [buttonMap, setButtonMap] = useState<ButtonMapping>({
    buttonA: "JUMP",
    buttonB: "DASH",
    buttonC: "INTERACT",
  });

  const [glitchActive, setGlitchActive] = useState(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;

    const channel = supabase
      .channel(`room-${room.code}`, {
        config: {
          broadcast: { self: false, ack: false },
        },
      })
      .on("broadcast", { event: "GLITCH_EVENT" }, (payload) => {
        if (payload.payload.playerId === player.id) {
          setButtonMap(payload.payload.mapping);
          triggerGlitchFeedback();
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [room.code, player.id]);

  const triggerGlitchFeedback = () => {
    setGlitchActive(true);
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
    setTimeout(() => setGlitchActive(false), 300);
  };

  const handleButtonPress = useCallback(
    async (buttonKey: keyof ButtonMapping) => {
      const action = buttonMap[buttonKey];
      const direction = action === "DASH" ? "RIGHT" : undefined;

      await sendAction({
        type: action,
        ...(direction && { direction }),
      });
    },
    [buttonMap, sendAction]
  );

  const buttonLabels: Record<string, string> = {
    JUMP: "JUMP",
    DASH: "DASH",
    INTERACT: "ACT",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center h-screen bg-gradient-to-b from-slate-900 to-slate-950 gap-8 transition-colors duration-200 ${
        glitchActive ? "bg-red-900/20" : ""
      }`}
    >
      <div className="text-center">
        <p className="text-white text-xl font-bold">{player.displayName}</p>
        <p className="text-gray-400 text-sm">Room: {room.code}</p>
      </div>

      <div
        className={`grid grid-cols-3 gap-4 p-8 bg-slate-800/50 rounded-xl border-2 ${
          glitchActive ? "border-red-500 animate-pulse" : "border-yellow-500"
        }`}
      >
        {(["buttonA", "buttonB", "buttonC"] as const).map((btn) => (
          <button
            key={btn}
            onTouchStart={(e) => {
              e.preventDefault();
              handleButtonPress(btn);
            }}
            onMouseDown={() => handleButtonPress(btn)}
            className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 active:from-blue-700 active:to-blue-900 text-white font-bold text-lg shadow-lg border-2 border-blue-400 transition-all duration-75 flex items-center justify-center flex-col"
          >
            <span className="text-xs text-blue-200 mb-1">
              {["A", "B", "C"][["buttonA", "buttonB", "buttonC"].indexOf(btn)]}
            </span>
            <span className="text-sm">{buttonLabels[buttonMap[btn]]}</span>
          </button>
        ))}
      </div>

      {glitchActive && (
        <div className="text-center animate-bounce">
          <p className="text-red-500 font-bold text-lg">⚡ GLITCH! ⚡</p>
          <p className="text-red-400 text-xs">Buttons remapped!</p>
        </div>
      )}

      <p className="text-gray-500 text-xs text-center">
        Use touch or click to control • Tap for action
      </p>
    </div>
  );
}
