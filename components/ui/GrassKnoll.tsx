interface Props {
  className?: string;
}

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 50;
const BLADE_COUNT = 130;

// Two overlapping waves — a duller, taller "back" hump behind a brighter
// "front" hump at a different frequency/phase, so their peaks don't line
// up and each pokes above the other in different places. That overlap
// (plus painting back before front) is what reads as rolling hills
// instead of one flat curve.
function backY(x: number) {
  return 22 + 9 * Math.sin((x / VIEW_WIDTH) * Math.PI * 2 * 1.3);
}
function frontY(x: number) {
  return 30 + 8 * Math.sin((x / VIEW_WIDTH) * Math.PI * 2 * 1.8 + 1.1);
}
// Whichever hump is actually on top at a given x — blades root here so
// they always sit on the visible silhouette, never floating above an
// occluding hump or sinking below one that's peeking over it.
function visibleTopY(x: number) {
  return Math.min(backY(x), frontY(x));
}

// Deterministic PRNG (mulberry32) — the scatter is fixed across renders
// instead of reshuffling on every reload, with no client-side JS needed
// to produce it.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(1337);

// Jitter within an even bucket per blade so positions scatter without
// clumping or leaving bare gaps.
const bucketWidth = VIEW_WIDTH / BLADE_COUNT;
const blades = Array.from({ length: BLADE_COUNT }, (_, i) => {
  const x = i * bucketWidth + random() * bucketWidth;
  const height = 7 + random() * 7;
  const baseWidth = 0.6 + random() * 0.7;
  const lean = (random() - 0.5) * 2.5;
  return { x, y: visibleTopY(x), height, baseWidth, lean };
});

function humpPath(curve: (x: number) => number) {
  const samples = 40;
  const points: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = (VIEW_WIDTH / samples) * i;
    points.push(`${x},${curve(x).toFixed(2)}`);
  }
  return `M0,${VIEW_HEIGHT} L${points.join(" L")} L${VIEW_WIDTH},${VIEW_HEIGHT} Z`;
}

const backPath = humpPath(backY);
const frontPath = humpPath(frontY);

// A full-width grassy knoll: two overlapping hump fills for depth, with
// blades scattered at random x positions, heights, and widths (rooted to
// whichever hump is visible at that x). Blades are painted after both
// humps so grass always sits above the terrain rather than getting
// swallowed by an overlapping hump. Every blade shares the same
// animate-sway timeline (see globals.css) so the field sways as one gust
// rather than blades moving out of sync.
export function GrassKnoll({ className }: Props) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path d={backPath} fill="var(--success-shadow)" />
      <path d={frontPath} fill="var(--success)" />
      {blades.map((blade, i) => {
        const baseY = blade.y;
        const tipY = baseY - blade.height;
        const tipX = blade.x + blade.lean;
        return (
          <polygon
            key={i}
            className="origin-bottom animate-sway [transform-box:fill-box]"
            points={`${blade.x - blade.baseWidth / 2},${baseY} ${blade.x + blade.baseWidth / 2},${baseY} ${tipX},${tipY}`}
            fill="var(--success-shadow)"
          />
        );
      })}
    </svg>
  );
}
