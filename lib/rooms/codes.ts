import { randomInt } from "crypto";

// Excludes 0/O and 1/I so codes are easy to read aloud and off a TV.
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 4): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[randomInt(CHARSET.length)];
  }
  return code;
}
