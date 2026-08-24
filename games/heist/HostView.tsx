"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GameHostViewProps } from "@/lib/game-engine/types";
import type { HeistState, HeistInput, InputActionPayload } from "./types";
import { AVATAR_FILES, avatarIndexFor } from "./avatars";

const AVATAR_COLORS = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33F1",
  "#F1FF33",
  "#33FFF1",
];

const RUN_SPEED = 250;
const JUMP_VELOCITY = -500;
const ACTIONS: HeistInput[] = ["LEFT", "JUMP", "RIGHT"];

interface HeldState {
  left: boolean;
  right: boolean;
}

export function HostView({ room, players }: GameHostViewProps<HeistState>) {
  const gameRef = useRef<any>(null);
  const spritesRef = useRef<Map<string, any>>(new Map());
  // Held-button state per player, mutated by broadcast events and read every
  // physics frame — this is what makes movement continuous instead of a
  // one-off impulse per tap.
  const heldRef = useRef<Map<string, HeldState>>(new Map());
  const jumpQueueRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<any>(null);
  const glitchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playersRef = useRef(players);
  playersRef.current = players;

  useEffect(() => {
    let mounted = true;

    const initGame = async () => {
      const Phaser = (await import("phaser")).default;
      if (!mounted) return;

      const sprites = spritesRef.current;
      const held = heldRef.current;
      const jumpQueue = jumpQueueRef.current;

      class HeistScene extends Phaser.Scene {
        constructor() {
          super({ key: "HeistScene" });
        }

        preload() {
          AVATAR_FILES.forEach((file, i) => {
            this.load.image(`avatar-img-${i}`, `/avatars/${file}`);
          });
        }

        create() {
          const bg = this.make.graphics({ x: 0, y: 0 }, false);
          bg.fillStyle(0x1a1a2e, 1);
          bg.fillRect(0, 0, 1024, 600);
          bg.fillStyle(0x0f3460, 1);
          bg.fillRect(0, 560, 1024, 40);
          bg.generateTexture("background", 1024, 600);
          bg.destroy();

          this.add.image(512, 300, "background");
          // Floor is the world bound at y=560 so avatars stand on the
          // visible ledge instead of the canvas edge.
          this.physics.world.setBounds(0, 0, 1024, 560);
        }

        update() {
          // Spawn sprites for any player that doesn't have one yet — this
          // also covers players who join mid-game.
          playersRef.current.forEach((player, index) => {
            if (!sprites.has(player.id)) {
              this.spawnAvatar(player.id, player.displayName, index);
            }
          });

          sprites.forEach((sprite, playerId) => {
            const body = sprite.body;
            if (!body) return;

            const h = held.get(playerId);
            const dir = (h?.right ? 1 : 0) - (h?.left ? 1 : 0);
            body.setVelocityX(dir * RUN_SPEED);

            if (jumpQueue.has(playerId)) {
              jumpQueue.delete(playerId);
              if (body.blocked.down) {
                body.setVelocityY(JUMP_VELOCITY);
              }
            }

            sprite.nicknameText.setPosition(sprite.x, sprite.y - 36);
          });
        }

        spawnAvatar(playerId: string, nickname: string, index: number) {
          // Prefer the platform avatar image; if that file hasn't been
          // dropped into public/avatars/ yet, its load failed and the
          // texture won't exist — fall back to a colored square.
          const avatarKey = `avatar-img-${avatarIndexFor(playerId)}`;
          let textureKey = avatarKey;

          if (!this.textures.exists(avatarKey)) {
            textureKey = `avatar-fallback-${playerId}`;
            const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
            if (!this.textures.exists(textureKey)) {
              const g = this.make.graphics({ x: 0, y: 0 }, false);
              g.fillStyle(parseInt(color.slice(1), 16), 1);
              g.fillRect(0, 0, 40, 40);
              g.generateTexture(textureKey, 40, 40);
              g.destroy();
            }
          }

          const sprite = this.physics.add.sprite(
            120 + index * 150,
            400,
            textureKey
          );
          sprite.setDisplaySize(48, 48);
          sprite.setBounce(0.1);
          sprite.setCollideWorldBounds(true);

          (sprite as any).nicknameText = this.add
            .text(sprite.x, sprite.y - 36, nickname, {
              fontSize: "13px",
              color: "#ffffff",
              fontStyle: "bold",
            })
            .setOrigin(0.5, 1);

          sprites.set(playerId, sprite);
        }
      }

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        width: 1024,
        height: 600,
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 800 },
            debug: false,
          },
        },
        scene: HeistScene,
        parent: "phaser-container",
      });
    };

    initGame();

    // Fire-and-forget broadcast channel: phones send inputs here directly,
    // no API route or DB write in the loop.
    const supabase = createClient();
    const channel = supabase
      .channel(`room-${room.code}`, {
        config: { broadcast: { self: false, ack: false } },
      })
      .on("broadcast", { event: "INPUT_ACTION" }, ({ payload }) => {
        const { playerId, action, type } = payload as InputActionPayload;
        const pressed = type === "PRESS";

        if (action === "JUMP") {
          if (pressed) jumpQueueRef.current.add(playerId);
          return;
        }

        const held = heldRef.current.get(playerId) ?? {
          left: false,
          right: false,
        };
        if (action === "LEFT") held.left = pressed;
        if (action === "RIGHT") held.right = pressed;
        heldRef.current.set(playerId, held);
      })
      .subscribe();
    channelRef.current = channel;

    const scheduleGlitch = () => {
      glitchTimerRef.current = setTimeout(() => {
        const ids = playersRef.current.map((p) => p.id);
        if (ids.length > 0) {
          const targetId = ids[Math.floor(Math.random() * ids.length)];
          // Shuffle so every action stays reachable — just on the wrong button.
          const shuffled = [...ACTIONS].sort(() => Math.random() - 0.5);
          channelRef.current?.send({
            type: "broadcast",
            event: "GLITCH_EVENT",
            payload: {
              playerId: targetId,
              mapping: {
                buttonA: shuffled[0],
                buttonB: shuffled[1],
                buttonC: shuffled[2],
              },
            },
          });
        }
        scheduleGlitch();
      }, 30000);
    };
    scheduleGlitch();

    return () => {
      mounted = false;
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
      channel.unsubscribe();
      channelRef.current = null;
      spritesRef.current.clear();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [room.code]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        id="phaser-container"
        className="overflow-hidden rounded-xl border-4 border-yellow-500 shadow-lg"
      />
      <p className="text-sm text-muted">
        Host Screen • Game Code: {room.code}
      </p>
    </div>
  );
}
