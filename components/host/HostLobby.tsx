import { RoomCodeBadge } from "@/components/ui/RoomCodeBadge";
import { PlayerList } from "@/components/ui/PlayerList";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import type { RoomRow, PlayerRow } from "@/lib/types/database";

interface Props {
  room: RoomRow;
  players: PlayerRow[];
  onlinePlayerIds: Set<string>;
  onStart: () => void;
  starting: boolean;
  error: string | null;
}

export function HostLobby({
  room,
  players,
  onlinePlayerIds,
  onStart,
  starting,
  error,
}: Props) {
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

      <div className="flex flex-col items-center gap-3">
        <Button size="lg" onClick={onStart} disabled={starting || players.length === 0}>
          {starting ? "Starting..." : "Start Game"}
        </Button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
