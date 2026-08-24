import type { RoomRow, PlayerRow } from "@/lib/types/database";
import type { Room, Player } from "./types";

export function toEngineRoom(row: RoomRow): Room {
  return {
    id: row.id,
    code: row.code,
    hostId: row.host_id,
    status: row.status,
    gameId: row.game_id,
    gameState: row.game_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export function toEnginePlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    displayName: row.display_name,
    isHost: row.is_host,
    score: row.score,
    status: row.status,
    joinedAt: row.joined_at,
  };
}
