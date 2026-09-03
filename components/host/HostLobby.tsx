"use client";

import { useState } from "react";
import { RoomCodeBadge } from "@/components/ui/RoomCodeBadge";
import { PlayerList } from "@/components/ui/PlayerList";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { GamePicker } from "./GamePicker";
import { gameRegistry } from "@/games/registry";
import { parseSessionState } from "@/lib/game-engine/session";
import type { RoomRow, PlayerRow, RoomMode } from "@/lib/types/database";

interface Props {
  room: RoomRow;
  players: PlayerRow[];
  onlinePlayerIds: Set<string>;
  onStart: (gameId: string, mode: RoomMode, plannedGames?: number) => void;
  starting: boolean;
  error: string | null;
}

const MODES: { id: RoomMode; name: string; blurb: string }[] = [
  {
    id: "party",
    name: "Party",
    blurb: "Play a lineup of games — placements earn points toward a final score.",
  },
  {
    id: "single",
    name: "Quick Play",
    blurb: "One game and done.",
  },
];

// undefined = "host's choice" — no fixed target, the host taps Finish
// whenever they're ready to crown a winner.
const GAME_COUNT_OPTIONS: (number | undefined)[] = [3, 5, 7, undefined];

// Purely a UI split, not a server-side one: the room stays "waiting" and
// realtime keeps updating `players` the whole time, so someone joining with
// the code mid-selection needs nothing special from us.
type Step = "code" | "select";

export function HostLobby({
  room,
  players,
  onlinePlayerIds,
  onStart,
  starting,
  error,
}: Props) {
  const [step, setStep] = useState<Step>("code");
  const [selectedGame, setSelectedGame] = useState("placeholder");
  // A room with history is a reopened quick-play lobby ("Back to Game
  // Selection") — keep its mode instead of defaulting back to Party.
  const [mode, setMode] = useState<RoomMode>(
    parseSessionState(room.session_state).gamesPlayed.length > 0 ? room.mode : "party"
  );
  const [plannedGames, setPlannedGames] = useState<number | undefined>(5);
  const selectedGameObj = gameRegistry[selectedGame];

  const canStart =
    !starting &&
    players.length > 0 &&
    selectedGameObj &&
    players.length >= selectedGameObj.minPlayers;

  if (step === "code") {
    return (
      <div className="flex flex-col items-center gap-10 text-center">
        <div>
          <h1>
            <Logo className="mx-auto h-8 w-auto" />
          </h1>
          <p className="mt-6 text-sm uppercase tracking-widest text-muted">Room code</p>
          <RoomCodeBadge code={room.code} />
          <p className="mt-4 text-muted">Join from your phone using this code</p>
        </div>

        <div className="w-full">
          <p className="mb-4 text-sm uppercase tracking-widest text-muted">
            Players ({players.length})
          </p>
          {players.length > 0 ? (
            <PlayerList players={players} onlinePlayerIds={onlinePlayerIds} variant="host" />
          ) : (
            <p className="text-muted">Waiting for players to join...</p>
          )}
        </div>

        <Button size="lg" onClick={() => setStep("select")}>
          Choose a Game
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={() => setStep("code")}
          className="text-sm text-muted underline-offset-4 hover:underline"
        >
          &larr; Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted">
            {players.length} player{players.length === 1 ? "" : "s"}
          </span>
          <RoomCodeBadge code={room.code} compact />
        </div>
      </div>

      <div className="w-full max-w-md">
        <p className="mb-4 text-sm uppercase tracking-widest text-muted">Mode</p>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-lg border-2 p-4 text-left transition-colors ${
                mode === m.id
                  ? "border-primary bg-primary/10"
                  : "border-surface-border bg-surface hover:border-primary/50"
              }`}
            >
              <p className="font-bold">{m.name}</p>
              <p className="text-xs text-muted">{m.blurb}</p>
            </button>
          ))}
        </div>
      </div>

      {mode === "party" && (
        <div className="w-full max-w-md">
          <p className="mb-4 text-sm uppercase tracking-widest text-muted">
            How many games?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {GAME_COUNT_OPTIONS.map((count) => (
              <button
                key={count ?? "choice"}
                onClick={() => setPlannedGames(count)}
                className={`rounded-lg border-2 p-3 text-center transition-colors ${
                  plannedGames === count
                    ? "border-primary bg-primary/10"
                    : "border-surface-border bg-surface hover:border-primary/50"
                }`}
              >
                <p className="font-bold">{count ?? "Host's choice"}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl">
        <p className="mb-4 text-sm uppercase tracking-widest text-muted">
          {mode === "party" ? "First game" : "Select a game"}
        </p>
        <GamePicker
          selectedGameId={selectedGame}
          onSelect={setSelectedGame}
          playerCount={players.length}
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={() => onStart(selectedGame, mode, mode === "party" ? plannedGames : undefined)}
          disabled={!canStart}
        >
          {starting ? "Starting..." : mode === "party" ? "Start the Party" : "Start Game"}
        </Button>
        {!canStart && selectedGameObj && players.length < selectedGameObj.minPlayers && (
          <p className="text-sm text-danger">
            Need {selectedGameObj.minPlayers - players.length} more player(s)
          </p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
