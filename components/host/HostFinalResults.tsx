import { PartyStandings } from "@/components/ui/PartyStandings";
import { lastCompletedGame, parseSessionState } from "@/lib/game-engine/session";
import type { RoomRow, PlayerRow } from "@/lib/types/database";

interface Props {
  room: RoomRow;
  players: PlayerRow[];
}

// Party-over screen on the host. Ties at the top are all champions.
export function HostFinalResults({ room, players }: Props) {
  const session = parseSessionState(room.session_state);
  const lastGame = lastCompletedGame(room);
  const topScore = Math.max(0, ...players.map((p) => p.score));
  const winners = players.filter((p) => p.score === topScore);

  return (
    <div className="flex flex-col items-center gap-10 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">
          Party over — {session.gamesPlayed.length} game
          {session.gamesPlayed.length === 1 ? "" : "s"} played
        </p>
        <h1 className="mt-2 text-5xl font-black tracking-tight">
          {winners.length === 1
            ? `${winners[0].display_name} wins!`
            : "It's a tie!"}
        </h1>
        {winners.length > 1 && (
          <p className="mt-3 text-muted">
            {winners.map((w) => w.display_name).join(" & ")} share the crown.
          </p>
        )}
      </div>

      <PartyStandings players={players} lastPoints={lastGame?.pointsAwarded} />

      <p className="text-muted">Thanks for playing! Start a new room to go again.</p>
    </div>
  );
}
