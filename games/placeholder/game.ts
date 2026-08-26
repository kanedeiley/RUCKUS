import type {
  GameActionResult,
  GameModule,
  Player,
} from "@/lib/game-engine/types";
import { rankByScore } from "@/lib/game-engine/session";
import type { PlaceholderAction, PlaceholderState } from "./types";
import { HostView } from "./HostView";
import { PlayerView } from "./PlayerView";

const TARGET_TAPS = 50;

function createInitialState(players: Player[]): PlaceholderState {
  return {
    startedAt: new Date().toISOString(),
    targetTaps: TARGET_TAPS,
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
      if (state.winnerId) return { state };
      const count = Math.min(
        MAX_TAP_BATCH,
        Math.max(1, Math.floor(action.count ?? 1))
      );
      const taps = {
        ...state.taps,
        [ctx.playerId]: (state.taps[ctx.playerId] ?? 0) + count,
      };
      // First to the target ends the race. Everyone else places by tap
      // count at that moment — the session layer turns those ranks into
      // party points; taps themselves never touch players.score.
      if (taps[ctx.playerId] >= state.targetTaps) {
        return {
          state: { ...state, taps, winnerId: ctx.playerId },
          endGame: true,
          placements: rankByScore(taps),
        };
      }
      return { state: { ...state, taps } };
    }
    default:
      return { state };
  }
}

export const placeholderGame: GameModule<PlaceholderState, PlaceholderAction> = {
  id: "placeholder",
  name: "Ruckus Check",
  description:
    "A tap race — first to the target wins. Proves the platform's real-time action pipeline end to end.",
  minPlayers: 1,
  maxPlayers: 24,
  createInitialState,
  reducer,
  HostView,
  PlayerView,
};
