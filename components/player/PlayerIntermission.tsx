import { PartyStandings } from "@/components/ui/PartyStandings";
import { rankByScore, lastCompletedGame, parseSessionState } from "@/lib/game-engine/session";
import type { RoomRow, PlayerRow } from "@/lib/types/database";

interface Props {
  room: RoomRow;
  players: PlayerRow[];
  currentPlayerId: string;
  /** true once the party has finished (room.status === "finished"). */
  final: boolean;
}

// Player-side counterpart of HostIntermission / HostFinalResults: your
// place in the party, and whether there's more to come.
export function PlayerIntermission({ room, players, currentPlayerId, final }: Props) {
  const ranks = rankByScore(
    Object.fromEntries(players.map((p) => [p.id, p.score]))
  );
  const myRank = ranks[currentPlayerId];
  const lastGame = lastCompletedGame(room);
  const gained = lastGame?.pointsAwarded[currentPlayerId] ?? 0;
  const isChampion = final && myRank === 1;
  const session = parseSessionState(room.session_state);

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">
          {final
            ? "Final results"
            : `Game ${session.gamesPlayed.length}${
                session.plannedGames ? ` of ${session.plannedGames}` : ""
              } complete`}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">
          {isChampion ? "You're the champion!" : `You're #${myRank}`}
        </h1>
        {!final && gained > 0 && (
          <p className="mt-2 font-bold text-primary">+{gained} points last game</p>
        )}
      </div>

      <PartyStandings players={players} highlightId={currentPlayerId} />

      <p className="text-muted">
        {final
          ? "Thanks for playing!"
          : "Waiting for the host to pick the next game..."}
      </p>
    </div>
  );
}
