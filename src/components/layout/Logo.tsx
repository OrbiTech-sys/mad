import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Text-based wordmark. This is a stand-in, NOT MAD's official logo — swap this component
 * for the real asset when the brand files are supplied.
 */
export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="MAD — Mighty & Delicious, home"
      className={cn("group/logo inline-flex min-h-11 shrink-0 items-center gap-2.5 whitespace-nowrap", className)}
    >
      <span className="grid -rotate-2 place-items-center bg-ember px-2 pb-0.5 pt-1 font-display text-[2.15rem] leading-[0.85] tracking-wide text-ink transition-transform duration-300 group-hover/logo:rotate-0">
        MAD
      </span>
      <span aria-hidden className="hidden flex-col font-display text-[1.15rem] leading-[0.92] tracking-[0.16em] text-paper min-[23rem]:flex">
        <span>MIGHTY</span>
        <span className="text-gold">&amp; DELICIOUS</span>
      </span>
    </Link>
  );
}
