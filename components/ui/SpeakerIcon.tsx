interface Props {
  muted: boolean;
  className?: string;
}

// A small blocky speaker glyph — box + cone in rects/polygon, with either
// a couple of sound-wave bars or a crossed-out X layered on top depending
// on `muted`, so the SoundtrackPlayer toggle button doesn't need an icon
// library for one glyph.
export function SpeakerIcon({ muted, className }: Props) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <rect x="2" y="6" width="3" height="4" />
      <polygon points="5,6 9,3 9,13 5,10" />
      {muted ? (
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="11" y1="4" x2="15" y2="12" />
          <line x1="15" y1="4" x2="11" y2="12" />
        </g>
      ) : (
        <>
          <rect x="11" y="6" width="1.5" height="4" />
          <rect x="13.5" y="4" width="1.5" height="8" />
        </>
      )}
    </svg>
  );
}
