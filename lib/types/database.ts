// Hand-written to match supabase/migrations/0001_init.sql.
// Once the project is linked to a real Supabase instance, this can be
// regenerated with `supabase gen types typescript --linked`.

export type RoomStatus =
  | "waiting"
  | "starting"
  | "playing"
  | "intermission"
  | "finished";
export type RoomMode = "single" | "party";
export type PlayerConnectionStatus = "connected" | "disconnected";

// `type`, not `interface` — GenericTable requires Row/Insert/Update to
// extend Record<string, unknown>, which an `interface` structurally does
// not satisfy even when every member is compatible.
export type RoomRow = {
  id: string;
  code: string;
  host_id: string;
  status: RoomStatus;
  mode: RoomMode;
  game_id: string | null;
  game_state: Record<string, unknown>;
  game_state_version: number;
  session_state: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type PlayerRow = {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  is_host: boolean;
  score: number;
  status: PlayerConnectionStatus;
  joined_at: string;
  last_seen_at: string;
};

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: RoomRow;
        Insert: Partial<RoomRow> & { code: string; host_id: string };
        Update: Partial<RoomRow>;
        Relationships: [];
      };
      players: {
        Row: PlayerRow;
        Insert: Partial<PlayerRow> & {
          room_id: string;
          user_id: string;
          display_name: string;
        };
        Update: Partial<PlayerRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Enums: {
      room_status: RoomStatus;
      room_mode: RoomMode;
      player_connection_status: PlayerConnectionStatus;
    };
    Functions: {
      increment_player_score: {
        Args: { p_player_id: string; p_delta: number };
        Returns: void;
      };
    };
    CompositeTypes: Record<string, never>;
  };
}
