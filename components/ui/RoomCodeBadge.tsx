interface Props {
  code: string;
  // Small inline chip for screens where the code is a reference, not the
  // focus (e.g. the game-select step, once the host has moved past it).
  compact?: boolean;
}

export function RoomCodeBadge({ code, compact }: Props) {
  if (compact) {
    return (
      <p className="rounded-lg border-2 border-surface-border bg-accent px-3 py-1 text-lg font-black tracking-[0.2em] text-accent-foreground">
        {code}
      </p>
    );
  }

  return (
    <p className="rounded-2xl border-2 border-surface-border bg-accent px-8 py-4 text-6xl font-black tracking-[0.3em] text-accent-foreground sm:text-7xl">
      {code}
    </p>
  );
}
