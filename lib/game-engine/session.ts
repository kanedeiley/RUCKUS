import type { RoomRow } from "@/lib/types/database";

/**
 * The session layer: everything about a room that outlives a single game.
 * It sits above the game contract the way the lobby does — games never see
 * it, and it never reaches into a game's state. Its whole job is what
 * happens when a game reports endGame: convert the game's placements into
 * party points (the only writes players.score ever receives), record the
 * game in the room's history, and decide where the room goes next
 * (`finished` for quick-play, `intermission` for a party).
 */

/** One finished game in a party's history, stored in rooms.session_state. */
export interface CompletedGame {
  gameId: string;
  endedAt: string;
  /**
   * playerId -> rank the game reported (1-based, ties share a rank).
   * Absent when the game ended without a ranked result — e.g. the host
   * ended it early, or the game doesn't produce standings.
   */
  placements?: Record<string, number>;
  /** playerId -> party points those ranks converted to. */
  pointsAwarded: Record<string, number>;
}

export interface SessionState {
  gamesPlayed: CompletedGame[];
  /**
   * How many games the host committed to when starting the party (chosen in
   * the lobby, fixed for the room's lifetime). Absent means "host's
   * choice" — the party only ends when the host taps Finish.
   */
  plannedGames?: number;
}

/**
 * Rank -> party points, Mario Party style. Platform-level and identical for
 * every game — that's the point: raw in-game scores from different games
 * aren't comparable, so only placement ever converts to party points.
 * Ranks past the table (and rank ties sharing a listed rank) get its value;
 * everyone 5th or worse gets 0.
 */
const PLACEMENT_POINTS = [5, 3, 2, 1];

export function pointsForRank(rank: number): number {
  return PLACEMENT_POINTS[rank - 1] ?? 0;
}

export function pointsFromPlacements(
  placements: Record<string, number>
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(placements).map(([playerId, rank]) => [
      playerId,
      pointsForRank(rank),
    ])
  );
}

/**
 * Competition-rank a score map (higher score = better): playerId -> rank,
 * ties share a rank and the next rank skips (10, 10, 7 -> 1, 1, 3). A
 * convenience for score-based games building their `placements`; team games
 * can just assign ranks directly (whole winning team at 1).
 */
export function rankByScore(scores: Record<string, number>): Record<string, number> {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const placements: Record<string, number> = {};
  let rank = 0;
  let previousScore = Number.POSITIVE_INFINITY;
  entries.forEach(([playerId, score], index) => {
    if (score !== previousScore) {
      rank = index + 1;
      previousScore = score;
    }
    placements[playerId] = rank;
  });
  return placements;
}

/**
 * session_state is jsonb and rooms predating the party migration hold `{}`,
 * so reads go through this tolerant parse rather than a cast.
 */
export function parseSessionState(raw: unknown): SessionState {
  if (raw && typeof raw === "object" && Array.isArray((raw as SessionState).gamesPlayed)) {
    const { gamesPlayed, plannedGames } = raw as SessionState;
    return typeof plannedGames === "number"
      ? { gamesPlayed, plannedGames }
      : { gamesPlayed };
  }
  return { gamesPlayed: [] };
}

export function lastCompletedGame(room: RoomRow): CompletedGame | undefined {
  const { gamesPlayed } = parseSessionState(room.session_state);
  return gamesPlayed[gamesPlayed.length - 1];
}

/** True once a party has played as many games as the host planned for. */
export function isPartyComplete(session: SessionState): boolean {
  return session.plannedGames != null && session.gamesPlayed.length >= session.plannedGames;
}
