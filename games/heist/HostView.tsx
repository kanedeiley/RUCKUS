"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createClient } from "@/lib/supabase/client";
import type { GameHostViewProps } from "@/lib/game-engine/types";
import type { HeistState, AvatarState } from "./types";

type PhaserAvatarSprite = Phaser.Physics.Arcade.Sprite & {
  nickname: Phaser.GameObjects.Text;
};

class GameScene extends Phaser.Scene {
  private sprites: Map<string, PhaserAvatarSprite> = new Map();
  private avatarState: Record<string, AvatarState> = {};

  constructor() {
    super({ key: "HeistScene" });
  }

  create() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(0, 0, 1024, 600);
    graphics.generateTexture("background", 1024, 600);
    graphics.destroy();

    this.add.image(512, 300, "background");
    this.physics.world.setBounds(0, 0, 1024, 600);
  }

  update() {
    this.sprites.forEach((sprite) => {
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setDrag(0.95);
      }
      sprite.nickname.x = sprite.x;
      sprite.nickname.y = sprite.y - 40;
    });
  }

  updateAvatar(playerId: string, avatar: AvatarState) {
    let sprite = this.sprites.get(playerId);

    if (!sprite) {
      sprite = this.createAvatarSprite(playerId, avatar);
    }

    sprite.setPosition(avatar.x, avatar.y);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(avatar.vx, avatar.vy);
    }
  }

  private createAvatarSprite(
    playerId: string,
    avatar: AvatarState
  ): PhaserAvatarSprite {
    const textureKey = `avatar-${playerId}`;

    if (!this.textures.exists(textureKey)) {
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      graphics.fillStyle(parseInt(avatar.color.slice(1), 16), 1);
      graphics.fillRect(0, 0, 40, 40);
      graphics.generateTexture(textureKey, 40, 40);
      graphics.destroy();
    }

    const sprite = this.physics.add.sprite(
      avatar.x,
      avatar.y,
      textureKey
    ) as PhaserAvatarSprite;

    sprite.setBounce(0.2);
    sprite.setCollideWorldBounds(true);

    const text = this.add.text(avatar.x, avatar.y - 40, avatar.nickname, {
      fontSize: "12px",
      color: "#ffffff",
    }) as Phaser.GameObjects.Text;

    sprite.nickname = text;
    this.sprites.set(playerId, sprite);

    return sprite;
  }
}

export function HostView({
  room,
  players,
  state,
}: GameHostViewProps<HeistState>) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const glitchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
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
      scene: GameScene,
      parent: "phaser-container",
    };

    gameRef.current = new Phaser.Game(config);

    gameRef.current.events.once("ready", () => {
      sceneRef.current = gameRef.current?.scene.getScene("HeistScene") as GameScene;
      scheduleGlitch();
    });

    return () => {
      if (glitchTimerRef.current) {
        clearTimeout(glitchTimerRef.current);
      }
      gameRef.current?.destroy(true);
    };
  }, [room.code]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    Object.entries(state.avatars).forEach(([playerId, avatar]) => {
      scene.updateAvatar(playerId, avatar);
    });
  }, [state.avatars]);

  const scheduleGlitch = () => {
    glitchTimerRef.current = setTimeout(async () => {
      const playerIds = Object.keys(state.avatars);
      if (playerIds.length > 0) {
        const targetId = playerIds[Math.floor(Math.random() * playerIds.length)];
        await dispatchGlitchEvent(targetId);
      }
      scheduleGlitch();
    }, 30000);
  };

  const dispatchGlitchEvent = async (playerId: string) => {
    const supabase = createClient();
    const actions = ["JUMP", "DASH", "INTERACT"] as const;

    const mapping = {
      buttonA: actions[Math.floor(Math.random() * actions.length)],
      buttonB: actions[Math.floor(Math.random() * actions.length)],
      buttonC: actions[Math.floor(Math.random() * actions.length)],
    };

    await supabase.channel(`room-${room.code}`).send({
      type: "broadcast",
      event: "GLITCH_EVENT",
      payload: { playerId, mapping },
    });
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
