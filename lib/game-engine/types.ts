import type { ComponentType } from "react";

export type RoomStatus =
  | "waiting"
  | "starting"
  | "playing"
  | "intermission"
  | "finished";
export type RoomMode = "single" | "party";
export type PlayerConnectionStatus = "connected" | "disconnected";

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  mode: RoomMode;
  gameId: string | null;
  gameState: unknown;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface Player {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  isHost: boolean;
  score: number;
  status: PlayerConnectionStatus;
  joinedAt: string;
}

/**
 * Named platform events. The engine doesn't persist an event log — each
 * event corresponds to a specific API route / state transition below — but
 * naming them keeps the request flow (client action -> validated mutation
 * -> broadcast) explicit and consistent across every game.
 *
 * PLAYER_JOINED / PLAYER_LEFT / PLAYER_RECONNECTED -> players table writes
 *   from POST /api/rooms/[code]/join.
 * GAME_STARTED -> POST /api/rooms/[code]/start.
 * PLAYER_ACTION / PLAYER_SUBMITTED -> POST /api/rooms/[code]/action,
 *   dispatched into a game's reducer.
 * ROUND_STARTED / ROUND_ENDED / GAME_ENDED -> transitions a game's own
 *   reducer encodes in the state it returns (e.g. a `phase` field).
 * TIMER_EXPIRED -> there is no server-side clock. A game that needs a
 *   deadline puts an ISO timestamp in its own state (e.g. `roundEndsAt`);
 *   HostView/PlayerView render a countdown from it client-side, and the
 *   reducer rejects actions submitted after it has passed.
 */
export type PlatformEvent =
  | "PLAYER_JOINED"
  | "PLAYER_LEFT"
  | "PLAYER_RECONNECTED"
  | "GAME_STARTED"
  | "ROUND_STARTED"
  | "PLAYER_ACTION"
  | "PLAYER_SUBMITTED"
  | "TIMER_EXPIRED"
  | "ROUND_ENDED"
  | "GAME_ENDED";

export interface GameActionContext {
  room: Room;
  players: Player[];
  playerId: string;
}

export interface GameActionResult<TState> {
  state: TState;
  /**
   * Set true to end the game after this action. Where the room goes next is
   * the session layer's call, not the game's: quick-play rooms move to
   * `finished`, party rooms to `intermission`.
   */
  endGame?: boolean;
  /**
   * Final standings, meaningful only alongside endGame: playerId -> rank
   * (1-based, competition ranking — ties share a rank, e.g. a whole winning
   * team at rank 1). The session layer converts ranks to party points and is
   * the only writer of players.score; a game's own live scoreboard belongs
   * in its game_state. Omit for games that end without a ranked result —
   * they simply award no points.
   */
  placements?: Record<string, number>;
}

export interface GameHostViewProps<TState> {
  room: Room;
  players: Player[];
  state: TState;
}

export interface GamePlayerViewProps<TState> {
  room: Room;
  player: Player;
  state: TState;
  sendAction: (action: { type: string } & Record<string, unknown>) => Promise<void>;
}

/**
 * The contract every game plugs into the platform through. The platform
 * only ever calls these five members generically — it has no game-specific
 * logic anywhere else.
 */
export interface GameModule<
  TState = unknown,
  TAction extends { type: string } = { type: string },
> {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  createInitialState(players: Player[]): TState;
  reducer(
    state: TState,
    action: TAction,
    ctx: GameActionContext
  ): GameActionResult<TState>;
  HostView: ComponentType<GameHostViewProps<TState>>;
  PlayerView: ComponentType<GamePlayerViewProps<TState>>;
}

// TState appears in both covariant (return) and contravariant (parameter)
// positions on GameModule, so it's invariant — a registry holding many
// differently-typed games has nowhere to go but a type-erased entry point.
// Every real call site narrows back to a concrete GameModule via its id.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameModule = GameModule<any, any>;
