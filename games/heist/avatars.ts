// Platform avatar assets live in public/avatars/ — plain static files, no
// API. Each player is assigned one by hashing their player id, so the host
// and their own phone independently agree on the same avatar with zero
// coordination, and it stays stable across reloads.
export const AVATAR_FILES = [
  "avatar-1.png",
  "avatar-2.png",
  "avatar-3.png",
  "avatar-4.png",
  "avatar-5.png",
  "avatar-6.png",
  "avatar-7.png",
  "avatar-8.png",
];

export function avatarIndexFor(playerId: string): number {
  let h = 0;
  for (let i = 0; i < playerId.length; i++) {
    h = (h * 31 + playerId.charCodeAt(i)) >>> 0;
  }
  return h % AVATAR_FILES.length;
}

export function avatarSrcFor(playerId: string): string {
  return `/avatars/${AVATAR_FILES[avatarIndexFor(playerId)]}`;
}
