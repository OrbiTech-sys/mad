import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "demo" | "ember" | "dark" | "light" | "ok" | "ok-light" | "warn" | "outline";

const tones: Record<Tone, string> = {
  demo: "bg-gold text-ink",
  ember: "bg-ember text-ink",
  dark: "bg-paper/10 text-paper",
  light: "bg-ink/10 text-ink",
  ok: "bg-leaf/15 text-leaf",
  "ok-light": "bg-leaf-deep/10 text-leaf-deep",
  warn: "bg-danger/15 text-danger",
  outline: "border border-current text-current",
};

export function Badge({
  tone = "dark",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-2 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.12em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
