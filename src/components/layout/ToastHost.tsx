"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check, Info, TriangleAlert } from "lucide-react";
import { ui, useUi } from "@/hooks/useUi";
import { cn } from "@/lib/cn";

/** One calm toast at a time, above the mobile order bar. */
export function ToastHost() {
  const toasts = useUi((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex justify-center px-4 md:bottom-8"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <m.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "pointer-events-auto flex max-w-md items-center gap-3 rounded-sm border bg-paper py-2 pl-3 pr-2 text-ink shadow-lift",
              toast.tone === "warning" ? "border-gold" : "border-ink/10",
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full",
                toast.tone === "success" && "bg-leaf-deep text-bone",
                toast.tone === "info" && "bg-ink text-cream",
                toast.tone === "warning" && "bg-gold text-ink",
              )}
            >
              {toast.tone === "success" ? (
                <Check aria-hidden className="size-4" />
              ) : toast.tone === "warning" ? (
                <TriangleAlert aria-hidden className="size-4" />
              ) : (
                <Info aria-hidden className="size-4" />
              )}
            </span>
            <p className="min-w-0 py-1 text-sm font-semibold leading-snug">{toast.message}</p>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  ui.dismissToast(toast.id);
                }}
                className="min-h-10 shrink-0 rounded-sm bg-ink px-3 text-sm font-bold uppercase tracking-wide text-cream transition-colors hover:bg-ember hover:text-ink"
              >
                {toast.action.label}
              </button>
            )}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
