"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PartyStandings } from "@/components/ui/PartyStandings";
import { GamePicker } from "./GamePicker";
import { getGame, gameRegistry } from "@/games/registry";
import { lastCompletedGame, parseSessionState } from "@/lib/game-engine/session";
import type { RoomRow, PlayerRow } from "@/lib/types/database";

interface Props {
  room: RoomRow;
  players: PlayerRow[];
  onStart: (gameId: string) => void;
  onFinishParty: () => void;
  starting: boolean;
  error: string | null;
}

// The between-games screen in party mode: what just happened (last game's
// points), where the party stands (cumulative scoreboard), and what's next
// (game picker). All session-layer UI — no game code renders here.
export function HostIntermission({
  room,
  players,
  onStart,
  onFinishParty,
  starting,
  error,
}: Props) {
  const [selectedGame, setSelectedGame] = useState("placeholder");
  const session = parseSessionState(room.session_state);
  const lastGame = lastCompletedGame(room);
  const lastGameName = lastGame ? getGame(lastGame.gameId)?.name ?? lastGame.gameId : null;
  const selectedGameObj = gameRegistry[selectedGame];

  const canStart =
    !starting && selectedGameObj && players.length >= selectedGameObj.minPlayers;

  return (
    <div className="flex flex-col items-center gap-10 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">
          Game {session.gamesPlayed.length}
          {session.plannedGames ? ` of ${session.plannedGames}` : ""} complete
        </p>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Standings</h1>
        {lastGameName && (
          <p className="mt-3 text-muted">
            {Object.keys(lastGame?.pointsAwarded ?? {}).length > 0
              ? `Points from ${lastGameName} are in.`
              : `${lastGameName} ended without a result — no points awarded.`}
          </p>
        )}
      </div>

      <PartyStandings players={players} lastPoints={lastGame?.pointsAwarded} />

      <div className="w-full max-w-md">
        <p className="mb-4 text-sm uppercase tracking-widest text-muted">
          {session.plannedGames
            ? `Next game (${session.plannedGames - session.gamesPlayed.length} to go)`
            : "Next game"}
        </p>
        <GamePicker
          selectedGameId={selectedGame}
          onSelect={setSelectedGame}
          playerCount={players.length}
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button size="lg" onClick={() => onStart(selectedGame)} disabled={!canStart}>
          {starting ? "Starting..." : "Next Game"}
        </Button>
        <button
          onClick={onFinishParty}
          className="text-sm text-muted underline-offset-4 hover:underline"
        >
          Finish the party &amp; crown a winner
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
