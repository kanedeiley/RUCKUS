"use client";

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import type { GameHostViewProps } from "@/lib/game-engine/types";
import type { HeistState, AvatarState } from "./types";

type PhaserAvatarSprite = Phaser.Physics.Arcade.Sprite & {
  nickname: Phaser.GameObjects.Text;
};

interface AvatarInput {
  playerId: string;
  action: "JUMP" | "DASH" | "INTERACT";
  direction?: "LEFT" | "RIGHT";
}

export function HostView({
  room,
  players,
  state,
}: GameHostViewProps<HeistState>) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<Phaser.Scene | null>(null);
  const spritesRef = useRef<Map<string, PhaserAvatarSprite>>(new Map());
  const inputQueueRef = useRef<AvatarInput[]>([]);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1024,
      height: 600,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 800 },
          debug: false,
        },
      },
      scene: {
        init: (scene) => {
          sceneRef.current = scene;
        },
        create: (scene) => {
          const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
          graphics.fillStyle(0x222222, 1);
          graphics.fillRect(0, 0, 1024, 600);
          graphics.generateTexture("background", 1024, 600);
          graphics.destroy();

          scene.add.image(512, 300, "background");

          Object.entries(state.avatars).forEach(([playerId, avatar]) => {
            createAvatarSprite(scene, playerId, avatar);
          });

          scene.physics.world.setBounds(0, 0, 1024, 600);

          if (scene.time.now % 30000 === 0) {
            scheduleGlitchEvent(scene);
          }
        },
        update: (scene) => {
          const sprites = spritesRef.current;

          sprites.forEach((sprite) => {
            if (sprite.body) {
              sprite.body.setDrag(0.95);
              if (sprite.body.touching.down) {
                sprite.body.setVelocityY(0);
              }
            }
            sprite.nickname.x = sprite.x;
            sprite.nickname.y = sprite.y - 40;
          });

          while (inputQueueRef.current.length > 0) {
            const input = inputQueueRef.current.shift();
            if (!input) continue;

            const sprite = sprites.get(input.playerId);
            if (!sprite || !sprite.body) continue;

            switch (input.action) {
              case "JUMP":
                if (sprite.body.touching.down) {
                  sprite.body.setVelocityY(-450);
                }
                break;
              case "DASH": {
                const dir = input.direction === "LEFT" ? -1 : 1;
                sprite.body.setVelocityX(dir * 600);
                break;
              }
              case "INTERACT":
                sprite.body.setVelocityY(-200);
                break;
            }
          }
        },
      },
      parent: "phaser-container",
    };

    gameRef.current = new Phaser.Game(config);

    const handleInputAction = (payload: AvatarInput) => {
      inputQueueRef.current.push(payload);
    };

    window.addEventListener("avatarInput", (e: Event) => {
      const event = e as CustomEvent;
      handleInputAction(event.detail);
    });

    return () => {
      window.removeEventListener("avatarInput", handleInputAction);
      gameRef.current?.destroy(true);
    };
  }, [state.avatars]);

  const createAvatarSprite = (
    scene: Phaser.Scene,
    playerId: string,
    avatar: AvatarState
  ) => {
    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(parseInt(avatar.color.slice(1), 16), 1);
    graphics.fillRect(0, 0, 40, 40);
    graphics.generateTexture(`avatar-${playerId}`, 40, 40);
    graphics.destroy();

    const sprite = scene.physics.add.sprite(
      avatar.x,
      avatar.y,
      `avatar-${playerId}`
    ) as PhaserAvatarSprite;

    sprite.setBounce(0.2);
    sprite.setCollideWorldBounds(true);

    const text = scene.add.text(avatar.x, avatar.y - 40, avatar.nickname, {
      fontSize: "12px",
      color: "#ffffff",
    });

    sprite.nickname = text;
    spritesRef.current.set(playerId, sprite);
  };

  const scheduleGlitchEvent = (scene: Phaser.Scene) => {
    scene.time.delayedCall(30000, () => {
      const playerIds = Object.keys(spritesRef.current);
      if (playerIds.length > 0) {
        const targetId = playerIds[Math.floor(Math.random() * playerIds.length)];
        dispatchGlitchEvent(targetId);
      }
      scheduleGlitchEvent(scene);
    });
  };

  const dispatchGlitchEvent = (playerId: string) => {
    const event = new CustomEvent("glitchEvent", {
      detail: { playerId },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <div
        id="phaser-container"
        className="border-4 border-yellow-500 shadow-lg"
      />
      <p className="mt-4 text-white text-sm">
        Host Screen • Game Code: {room.code}
      </p>
    </div>
  );
}
