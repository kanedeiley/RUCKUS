export interface AvatarState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  nickname: string;
}

export interface HeistState {
  startedAt: string;
  avatars: Record<string, AvatarState>;
}

export type HeistAction =
  | { type: "JUMP" }
  | { type: "DASH"; direction: "LEFT" | "RIGHT" }
  | { type: "INTERACT" };
