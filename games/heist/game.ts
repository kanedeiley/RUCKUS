import type {
  GameActionResult,
  GameModule,
  Player,
} from "@/lib/game-engine/types";
import type { HeistAction, HeistState, AvatarState } from "./types";
import { HostView } from "./HostView";
import { PlayerView } from "./PlayerView";

const AVATAR_COLORS = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33F1",
  "#F1FF33",
  "#33FFF1",
];

function createInitialState(players: Player[]): HeistState {
  const avatars: Record<string, AvatarState> = {};

  players.forEach((player, index) => {
    avatars[player.id] = {
      id: player.id,
      x: 100 + index * 150,
      y: 300,
      vx: 0,
      vy: 0,
      color: AVATAR_COLORS[index % AVATAR_COLORS.length],
      nickname: player.displayName,
    };
  });

  return {
    startedAt: new Date().toISOString(),
    avatars,
  };
}

function reducer(
  state: HeistState,
  action: HeistAction,
  ctx: { playerId: string }
): GameActionResult<HeistState> {
  const avatar = state.avatars[ctx.playerId];
  if (!avatar) {
    return { state };
  }

  const avatars = { ...state.avatars };
  const updatedAvatar = { ...avatar };

  switch (action.type) {
    case "JUMP": {
      updatedAvatar.vy = -450;
      break;
    }
    case "DASH": {
      const direction = action.direction === "LEFT" ? -1 : 1;
      updatedAvatar.vx = direction * 600;
      break;
    }
    case "INTERACT": {
      updatedAvatar.vy = -200;
      break;
    }
  }

  avatars[ctx.playerId] = updatedAvatar;
  return { state: { ...state, avatars } };
}

export const heistGame: GameModule<HeistState, HeistAction> = {
  id: "heist",
  name: "High Score Heist",
  description:
    "A real-time multiplayer platform game with dynamic controller swaps and physics-based movement.",
  minPlayers: 1,
  maxPlayers: 6,
  createInitialState,
  reducer,
  HostView,
  PlayerView,
};
