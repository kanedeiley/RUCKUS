import { PlayerList } from "@/components/ui/PlayerList";
import type { RoomRow, PlayerRow } from "@/lib/types/database";

interface Props {
  room: RoomRow;
  players: PlayerRow[];
  onlinePlayerIds: Set<string>;
  currentPlayerId: string;
}

export function PlayerLobby({ room, players, onlinePlayerIds, currentPlayerId }: Props) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted">Connected to</p>
        <p className="text-4xl font-black tracking-[0.3em] text-primary">{room.code}</p>
      </div>

      <div className="w-full">
        <p className="mb-4 text-sm uppercase tracking-widest text-muted">
          Players in room ({players.length})
        </p>
        <PlayerList
          players={players}
          onlinePlayerIds={onlinePlayerIds}
          variant="player"
          highlightId={currentPlayerId}
        />
      </div>

      <p className="animate-pulse text-muted">Waiting for host...</p>
    </div>
  );
}
