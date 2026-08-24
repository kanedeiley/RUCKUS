export function RoomCodeBadge({ code }: { code: string }) {
  return (
    <p className="rounded-2xl border-2 border-surface-border bg-accent px-8 py-4 text-6xl font-black tracking-[0.3em] text-accent-foreground sm:text-7xl">
      {code}
    </p>
  );
}
