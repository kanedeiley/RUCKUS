const isBrowser = typeof window !== "undefined";

// SSR-safe localStorage helpers. Reads fall back silently (no window on
// the server, no key yet, corrupt JSON) instead of throwing, so callers
// never need their own try/catch just to read a persisted preference.
export function getLocalStorageItem<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function setLocalStorageItem<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled (e.g. private browsing) — the value just
    // won't persist this time.
  }
}
