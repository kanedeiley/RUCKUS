"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/storage/localStorage";
import { SpeakerIcon } from "./SpeakerIcon";

const BUCKET = "soundtrack";
const FOLDER = "soothing";
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;
const PLAYING_KEY = "ruckus:soundtrack-playing";

// Ambient background music for the landing page, pulled from whatever's
// in the soundtrack/soothing folder in Supabase Storage. Starts paused —
// browsers block autoplay-with-sound before any user gesture on the page,
// and an unrequested audio blast on load is bad UX besides — so playback
// only begins once the listener clicks the toggle. From there it loops
// through the folder's tracks in order, wrapping back to the first after
// the last. The on/off choice persists to localStorage, so a returning
// visitor who muted it stays muted (and vice versa — though a restored
// "on" still has to clear the browser's autoplay gate, so it can silently
// fall back to paused until they click again).
export function SoundtrackPlayer() {
  const [tracks, setTracks] = useState<string[]>([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setPlaying(getLocalStorageItem(PLAYING_KEY, false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.storage
      .from(BUCKET)
      .list(FOLDER, { sortBy: { column: "name", order: "asc" } })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const urls = data
          .filter((file) => AUDIO_EXT.test(file.name))
          .map(
            (file) =>
              supabase.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${file.name}`).data.publicUrl
          );
        setTracks(urls);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (playing) audioRef.current?.play().catch(() => setPlaying(false));
  }, [trackIndex, playing, tracks.length]);

  if (tracks.length === 0) return null;

  const toggle = () => {
    const next = !playing;
    if (!next) audioRef.current?.pause();
    setPlaying(next);
    setLocalStorageItem(PLAYING_KEY, next);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={tracks[trackIndex]}
        onEnded={() => setTrackIndex((i) => (i + 1) % tracks.length)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Mute soundtrack" : "Play soundtrack"}
        className="fixed right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-surface-border bg-surface text-foreground shadow-[0_4px_0_0_var(--surface-border)] transition-[transform,box-shadow] active:translate-y-[4px] active:shadow-none"
      >
        <SpeakerIcon muted={!playing} className="h-5 w-5" />
      </button>
    </>
  );
}
