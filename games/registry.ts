import type { AnyGameModule } from "@/lib/game-engine/types";
import { placeholderGame } from "@/games/placeholder";
import { heistGame } from "@/games/heist";

// Adding a game means adding a folder under games/ and one entry here —
// nothing in lib/ or app/api/ needs to change.
export const gameRegistry: Record<string, AnyGameModule> = {
  [placeholderGame.id]: placeholderGame,
  [heistGame.id]: heistGame,
};

export function getGame(gameId: string): AnyGameModule | undefined {
  return gameRegistry[gameId];
}
