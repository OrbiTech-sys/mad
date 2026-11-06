import type { InputHTMLAttributes, ReactNode, Ref, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "dark" | "light";

const fieldBase =
  "block w-full rounded-sm border px-4 text-base leading-snug transition-colors duration-150 " +
  "placeholder:opacity-60 focus:outline-none disabled:opacity-50";

const fieldTones: Record<Tone, string> = {
  dark: "border-paper/20 bg-coal text-paper placeholder:text-smoke hover:border-paper/40 focus:border-gold",
  light: "border-ink/25 bg-bone text-ink placeholder:text-ash hover:border-ink/50 focus:border-ink",
};
const invalidTones: Record<Tone, string> = {
  dark: "border-danger hover:border-danger focus:border-danger",
  light: "border-danger-deep hover:border-danger-deep focus:border-danger-deep",
};

interface FieldChrome {
  tone?: Tone;
  invalid?: boolean;
}

/** font-size 16px on every field prevents iOS Safari from zooming the page on focus. */
export function Input({
  tone = "dark",
  invalid,
  className,
  ref,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & FieldChrome & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, "min-h-12 py-3", invalid ? invalidTones[tone] : fieldTones[tone], className)}
      {...rest}
    />
  );
}

export function Textarea({
  tone = "dark",
  invalid,
  className,
  ref,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldChrome & { ref?: Ref<HTMLTextAreaElement> }) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, "min-h-28 resize-y py-3", invalid ? invalidTones[tone] : fieldTones[tone], className)}
      {...rest}
    />
  );
}

/** Label + control + hint + accessible error, wired together with ids. */
export function Field({
  id,
  label,
  optional,
  hint,
  error,
  tone = "dark",
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className={cn("mb-2 flex items-baseline justify-between gap-3 text-sm font-semibold", tone === "dark" ? "text-paper" : "text-ink")}
      >
        <span>{label}</span>
        {optional && (
          <span className={cn("text-xs font-normal", tone === "dark" ? "text-smoke" : "text-ash")}>Optional</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className={cn("mt-2 text-sm", tone === "dark" ? "text-smoke" : "text-ash")}>
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={cn("mt-2 text-sm font-medium", tone === "dark" ? "text-danger" : "text-danger-deep")}
        >
          {error}
        </p>
      )}
    </div>
  );
}
