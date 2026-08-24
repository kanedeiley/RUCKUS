import { PixelCloud } from "./PixelCloud";

// Fixed, decorative, behind everything — a few drifting pixel clouds and a
// grass-textured ground strip. Mounted once in the root layout so every
// screen shares it without each page having to opt in. Never competes with
// content: it sits at z-index 0 under the page (which stacks above via its
// own background), stays out of the vertical center where UI lives, and
// ignores pointer events entirely.
export function RetroBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <PixelCloud className="absolute left-[8%] top-[10%] h-8 w-20 text-white/80 sm:h-10 sm:w-24" />
      <PixelCloud className="absolute right-[12%] top-[18%] h-6 w-16 text-white/70 sm:h-8 sm:w-20" />
      <PixelCloud className="absolute left-[65%] top-[8%] h-5 w-14 text-white/60 sm:h-6 sm:w-16" />

      <div
        className="absolute inset-x-0 bottom-0 h-6"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--success) 0 16px, var(--success-shadow) 16px 32px)",
        }}
      />
    </div>
  );
}
