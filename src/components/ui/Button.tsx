import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "gold" | "outline" | "outline-dark" | "dark" | "ghost" | "ghost-dark";
export type ButtonSize = "sm" | "md" | "lg";

interface StyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm font-display uppercase leading-none tracking-[0.06em] " +
  "transition-[transform,background-color,color,border-color,box-shadow,filter] duration-200 ease-out " +
  "motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 " +
  "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-lg",
  md: "min-h-12 px-6 text-xl",
  lg: "min-h-14 px-8 text-2xl",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ember text-ink hover:brightness-110 hover:shadow-lift",
  gold: "bg-gold text-ink hover:brightness-105 hover:shadow-lift",
  outline: "border border-paper/40 text-paper hover:border-paper hover:bg-paper hover:text-ink",
  "outline-dark": "border border-ink/45 text-ink hover:border-ink hover:bg-ink hover:text-cream",
  dark: "bg-ink text-cream hover:bg-coal hover:shadow-lift",
  ghost: "text-paper hover:bg-paper/10",
  "ghost-dark": "text-ink hover:bg-ink/10",
};

export function buttonStyles({ variant = "primary", size = "md", block = false, className }: StyleOptions = {}) {
  return cn(base, sizes[size], variants[variant], block && "w-full", className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  StyleOptions & { loading?: boolean; children?: ReactNode };

export function Button({ variant, size, block, className, loading, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, block, className })}
      {...rest}
    >
      {loading && <Loader2 aria-hidden className="size-5 animate-spin" />}
      {children}
    </button>
  );
}

type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  StyleOptions & { href: string; children?: ReactNode };

/** Link that looks like a button. External URLs open in a new tab safely. */
export function ButtonLink({ href, variant, size, block, className, children, ...rest }: ButtonLinkProps) {
  const classes = buttonStyles({ variant, size, block, className });
  const external = /^https?:\/\//.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
