import { cn } from "@/lib/utils/cn";

export function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "h-2.5 w-2.5 shrink-0 rounded-full",
        online ? "bg-success" : "bg-muted/40"
      )}
      role="status"
      aria-label={online ? "Connected" : "Disconnected"}
    />
  );
}
