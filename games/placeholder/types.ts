export interface PlaceholderState {
  startedAt: string;
  /** playerId -> tap count */
  taps: Record<string, number>;
}

// `count` lets the player view batch several rapid taps into one request
// instead of firing a round trip per tap — see PlayerView.tsx.
export type PlaceholderAction = { type: "TAP"; count?: number };
