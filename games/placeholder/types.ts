export interface PlaceholderState {
  startedAt: string;
  /** First player to this many taps ends the game. */
  targetTaps: number;
  /** playerId -> tap count — the game's own live scoreboard. */
  taps: Record<string, number>;
  /** Set when someone reaches targetTaps; the race is over. */
  winnerId?: string;
}

// `count` lets the player view batch several rapid taps into one request
// instead of firing a round trip per tap — see PlayerView.tsx.
export type PlaceholderAction = { type: "TAP"; count?: number };
