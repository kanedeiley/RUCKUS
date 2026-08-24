import type {
  GameActionResult,
  GameModule,
  Player,
} from "@/lib/game-engine/types";
import type { HeistAction, HeistState } from "./types";
import { HostView } from "./HostView";
import { PlayerView } from "./PlayerView";

// Movement never goes through this reducer — the host's Phaser world owns
// all physics, and inputs arrive there over Supabase Broadcast. The reducer
// only exists to satisfy the platform contract (and for future scoring).
function createInitialState(_players: Player[]): HeistState {
  return { startedAt: new Date().toISOString() };
}

function reducer(state: HeistState, _action: HeistAction): GameActionResult<HeistState> {
  return { state };
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
