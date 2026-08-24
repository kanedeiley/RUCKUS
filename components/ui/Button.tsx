import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "rounded-xl border-2 border-surface-border font-black uppercase transition-[transform,box-shadow] active:translate-y-[4px] active:shadow-none disabled:opacity-40 disabled:active:translate-y-0",
        variant === "primary" &&
          "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--primary-shadow)]",
        variant === "secondary" &&
          "bg-surface text-foreground shadow-[0_4px_0_0_var(--surface-border)]",
        size === "md" && "px-6 py-3 text-sm",
        size === "lg" && "px-10 py-5 text-lg",
        className
      )}
      {...props}
    />
  );
}
