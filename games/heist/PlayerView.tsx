"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GamePlayerViewProps } from "@/lib/game-engine/types";
import type {
  ButtonMapping,
  GlitchEventPayload,
  HeistInput,
  HeistState,
} from "./types";
import { avatarSrcFor } from "./avatars";

const ACTION_LABELS: Record<HeistInput, string> = {
  LEFT: "←",
  RIGHT: "→",
  JUMP: "JUMP",
};

const DEFAULT_MAP: ButtonMapping = {
  buttonA: "LEFT",
  buttonB: "JUMP",
  buttonC: "RIGHT",
};

export function PlayerView({ room, player }: GamePlayerViewProps<HeistState>) {
  const [buttonMap, setButtonMap] = useState<ButtonMapping>(DEFAULT_MAP);
  const [glitchActive, setGlitchActive] = useState(false);
  const [avatarOk, setAvatarOk] = useState(true);
  const channelRef = useRef<any>(null);
  // Track which mapped action each physical button is currently holding, so
  // a glitch mid-press still releases the *old* action instead of leaking a
  // stuck key on the host.
  const activeActionRef = useRef<Partial<Record<keyof ButtonMapping, HeistInput>>>({});

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room-${room.code}`, {
        config: { broadcast: { self: false, ack: false } },
      })
      .on("broadcast", { event: "GLITCH_EVENT" }, ({ payload }) => {
        const glitch = payload as GlitchEventPayload;
        if (glitch.playerId !== player.id) return;
        setButtonMap(glitch.mapping);
        setGlitchActive(true);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        setTimeout(() => setGlitchActive(false), 400);
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [room.code, player.id]);

  const sendInput = (action: HeistInput, type: "PRESS" | "RELEASE") => {
    channelRef.current?.send({
      type: "broadcast",
      event: "INPUT_ACTION",
      payload: { playerId: player.id, action, type },
    });
  };

  const press = (button: keyof ButtonMapping) => {
    const action = buttonMap[button];
    activeActionRef.current[button] = action;
    sendInput(action, "PRESS");
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const release = (button: keyof ButtonMapping) => {
    const action = activeActionRef.current[button];
    if (!action) return;
    delete activeActionRef.current[button];
    sendInput(action, "RELEASE");
  };

  const renderButton = (button: keyof ButtonMapping) => {
    const action = buttonMap[button];
    const isJump = action === "JUMP";
    return (
      <button
        key={button}
        onTouchStart={(e) => {
          e.preventDefault();
          press(button);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          release(button);
        }}
        onTouchCancel={() => release(button)}
        onMouseDown={() => press(button)}
        onMouseUp={() => release(button)}
        onMouseLeave={() => release(button)}
        onContextMenu={(e) => e.preventDefault()}
        className={`flex h-24 min-w-0 flex-1 select-none items-center justify-center rounded-2xl border-b-8 font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4 ${
          isJump
            ? "border-red-800 bg-red-600 text-lg"
            : "border-slate-900 bg-slate-700 text-4xl"
        }`}
        style={{ touchAction: "none", WebkitUserSelect: "none" }}
      >
        {ACTION_LABELS[action]}
      </button>
    );
  };

  return (
    <div
      className={`flex w-full flex-col items-center gap-6 transition-colors duration-200 ${
        glitchActive ? "animate-pulse" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {avatarOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrcFor(player.id)}
            alt=""
            className="h-14 w-14"
            style={{ imageRendering: "pixelated" }}
            onError={() => setAvatarOk(false)}
          />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-primary" />
        )}
        <div>
          <p className="text-lg font-bold">{player.displayName}</p>
          <p className="text-xs text-muted">Room: {room.code}</p>
        </div>
      </div>

      {glitchActive ? (
        <div className="text-center">
          <p className="text-xl font-black text-danger">⚡ GLITCH! ⚡</p>
          <p className="text-sm text-danger">Buttons remapped!</p>
        </div>
      ) : (
        <p className="text-xs text-muted">Hold ← → to run • JUMP to jump</p>
      )}

      <div
        className={`flex w-full items-stretch gap-3 rounded-2xl border-2 p-3 ${
          glitchActive ? "border-danger" : "border-surface-border"
        } bg-surface`}
        style={{ touchAction: "none" }}
      >
        {renderButton("buttonA")}
        {renderButton("buttonB")}
        {renderButton("buttonC")}
      </div>
    </div>
  );
}
