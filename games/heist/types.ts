// Physics state lives entirely in the host's Phaser world — nothing about
// avatar position/velocity is persisted or synced through the reducer.
// Inputs travel phone -> host over Supabase Broadcast, not the API.
export interface HeistState {
  startedAt: string;
}

export type HeistAction = { type: "NOOP" };

export type HeistInput = "LEFT" | "RIGHT" | "JUMP";

export interface InputActionPayload {
  playerId: string;
  action: HeistInput;
  type: "PRESS" | "RELEASE";
}

export interface ButtonMapping {
  buttonA: HeistInput;
  buttonB: HeistInput;
  buttonC: HeistInput;
}

export interface GlitchEventPayload {
  playerId: string;
  mapping: ButtonMapping;
}
