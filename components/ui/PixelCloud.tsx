interface Props {
  className?: string;
}

// A small original blocky-cloud silhouette (hand-placed rects on a grid,
// not traced from any existing game's art) — the pixel-art shorthand for
// "sky" without borrowing anyone's actual sprite.
export function PixelCloud({ className }: Props) {
  return (
    <svg
      viewBox="0 0 64 28"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="8" y="16" width="8" height="8" />
      <rect x="16" y="8" width="8" height="8" />
      <rect x="24" y="8" width="16" height="8" />
      <rect x="40" y="16" width="8" height="8" />
      <rect x="16" y="16" width="24" height="8" />
    </svg>
  );
}
