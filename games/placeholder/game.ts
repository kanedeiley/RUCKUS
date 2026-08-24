import type {
  GameActionResult,
  GameModule,
  Player,
} from "@/lib/game-engine/types";
import type { PlaceholderAction, PlaceholderState } from "./types";
import { HostView } from "./HostView";
import { PlayerView } from "./PlayerView";

function createInitialState(players: Player[]): PlaceholderState {
  return {
    startedAt: new Date().toISOString(),
    taps: Object.fromEntries(players.map((p) => [p.id, 0])),
  };
}

// Clients are never trusted with raw counts — a batched request could claim
// any number, so clamp to what's plausible for one flush interval.
const MAX_TAP_BATCH = 50;

function reducer(
  state: PlaceholderState,
  action: PlaceholderAction,
  ctx: { playerId: string }
): GameActionResult<PlaceholderState> {
  switch (action.type) {
    case "TAP": {
      const count = Math.min(
        MAX_TAP_BATCH,
        Math.max(1, Math.floor(action.count ?? 1))
      );
      const taps = {
        ...state.taps,
        [ctx.playerId]: (state.taps[ctx.playerId] ?? 0) + count,
      };
      return { state: { ...state, taps }, scoreDeltas: { [ctx.playerId]: count } };
    }
    default:
      return { state };
  }
}

export const placeholderGame: GameModule<PlaceholderState, PlaceholderAction> = {
  id: "placeholder",
  name: "Ruckus Check",
  description:
    "A minimal placeholder game that proves the platform's real-time action pipeline end to end.",
  minPlayers: 1,
  maxPlayers: 24,
  createInitialState,
  reducer,
  HostView,
  PlayerView,
};
