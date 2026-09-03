import type {
  GameActionContext,
  GameActionResult,
  GameModule,
  Player,
} from "@/lib/game-engine/types";
import { rankByScore } from "@/lib/game-engine/session";
import { SUITS } from "./horses";
import { runRace } from "./track";
import type { HorseRacingAction, HorseRacingState } from "./types";
import { HostView } from "./HostView";
import { PlayerView } from "./PlayerView";

function createInitialState(_players: Player[]): HorseRacingState {
  return { phase: "betting", picks: {}, events: [] };
}

function reducer(
  state: HorseRacingState,
  action: HorseRacingAction,
  ctx: GameActionContext
): GameActionResult<HorseRacingState> {
  switch (action.type) {
    case "PICK_HORSE": {
      if (state.phase !== "betting" || !SUITS.includes(action.suit)) return { state };
      return {
        state: { ...state, picks: { ...state.picks, [ctx.playerId]: action.suit } },
      };
    }
    case "START_RACE": {
      if (state.phase !== "betting") return { state };
      const { events, winner, finalPositions } = runRace();

      // Score 1 for backing the winning horse, 0 otherwise — including
      // anyone who never placed a pick. rankByScore turns that into a tie
      // for first among every correct bettor and a tie for last among
      // everyone else, matching "ties count towards the leaderboard".
      const scores = Object.fromEntries(
        ctx.players.map((p) => [p.id, state.picks[p.id] === winner ? 1 : 0])
      );

      return {
        state: { ...state, phase: "finished", events, winner, finalPositions },
        endGame: true,
        placements: rankByScore(scores),
      };
    }
    default:
      return { state };
  }
}

export const horseRacingGame: GameModule<HorseRacingState, HorseRacingAction> = {
  id: "horse_racing",
  name: "Horse Race",
  description:
    "Pick a suit, watch four horses race for the finish line, and hope the checkpoints don't send yours packing.",
  minPlayers: 1,
  maxPlayers: 12,
  createInitialState,
  reducer,
  HostView,
  PlayerView,
};
