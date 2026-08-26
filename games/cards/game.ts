import type {
  GameActionResult,
  GameModule,
  Player,
} from "@/lib/game-engine/types";
import type { DeckAction, DeckState } from "./types";
import { freshDeck, shuffle } from "./deck";
import { HostView } from "./HostView";
import { PlayerView } from "./PlayerView";

const HAND_SIZE = 5;

// Each hand is its own fresh 52-card shuffle rather than dealt from one
// shared pile — nothing here depends on hands being mutually exclusive, and
// it keeps a redraw a one-line operation with no shared deck state to track.
function dealHand() {
  return shuffle(freshDeck()).slice(0, HAND_SIZE);
}

function createInitialState(players: Player[]): DeckState {
  return {
    hands: Object.fromEntries(players.map((p) => [p.id, dealHand()])),
  };
}

function reducer(
  state: DeckState,
  action: DeckAction,
  ctx: { playerId: string }
): GameActionResult<DeckState> {
  switch (action.type) {
    case "REDRAW":
      return {
        state: { ...state, hands: { ...state.hands, [ctx.playerId]: dealHand() } },
      };
    default:
      return { state };
  }
}

export const cardsGame: GameModule<DeckState, DeckAction> = {
  id: "cards",
  name: "Deal Me In",
  description: "Shuffle a deck and deal everyone a hand of cards.",
  minPlayers: 1,
  maxPlayers: 8,
  createInitialState,
  reducer,
  HostView,
  PlayerView,
};
