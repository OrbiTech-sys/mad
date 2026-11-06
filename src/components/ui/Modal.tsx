"use client";

import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/hooks/useStore";
import { cn } from "@/lib/cn";

/* Scroll lock is reference-counted so stacked dialogs don't fight each other. */
let scrollLocks = 0;
function lockScroll() {
  if (scrollLocks++ === 0) document.documentElement.style.overflow = "hidden";
}
function unlockScroll() {
  if (--scrollLocks <= 0) {
    scrollLocks = 0;
    document.documentElement.style.overflow = "";
  }
}

/* Only the top-most dialog reacts to Escape. */
const stack: string[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden",
  );
}

export type ModalVariant = "dialog" | "drawer" | "fullscreen";
type Size = "md" | "lg" | "xl";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  variant?: ModalVariant;
  surface?: "dark" | "light";
  size?: Size;
  hideClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}

const sizeClass: Record<Size, string> = {
  md: "md:max-w-lg",
  lg: "md:max-w-2xl",
  xl: "md:max-w-5xl",
};

/**
 * Accessible dialog: portal, focus trap, Escape, backdrop click, scroll lock, focus restore.
 * `dialog` is a bottom sheet on phones and a centred card from md up; `drawer` slides in from
 * the right (cart); `fullscreen` covers the viewport (mobile menu).
 */
export function Modal({
  open,
  onClose,
  label,
  variant = "dialog",
  surface = "dark",
  size = "lg",
  hideClose,
  initialFocusRef,
  className,
  children,
}: ModalProps) {
  const hydrated = useHydrated();
  if (!hydrated) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalPanel
          key="modal"
          onClose={onClose}
          label={label}
          variant={variant}
          surface={surface}
          size={size}
          hideClose={hideClose}
          initialFocusRef={initialFocusRef}
          className={className}
        >
          {children}
        </ModalPanel>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ModalPanel({
  onClose,
  label,
  variant,
  surface,
  size,
  hideClose,
  initialFocusRef,
  className,
  children,
}: Omit<ModalProps, "open"> & { variant: ModalVariant; surface: "dark" | "light"; size: Size }) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockScroll();
    stack.push(id);

    // Resolve the dialog from a plain container (robust against motion-ref timing), focus now and again next frame.
    const focusPanel = () => {
      const target = initialFocusRef?.current ?? rootRef.current?.querySelector<HTMLElement>('[role="dialog"]');
      target?.focus({ preventScroll: true });
    };
    focusPanel();
    const frame = requestAnimationFrame(focusPanel);

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && stack[stack.length - 1] === id) {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      const index = stack.lastIndexOf(id);
      if (index >= 0) stack.splice(index, 1);
      unlockScroll();
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [id, initialFocusRef]);

  function trapTab(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const panel = event.currentTarget;
    const items = getFocusable(panel);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const isDrawer = variant === "drawer";
  const isFull = variant === "fullscreen";

  const container = cn(
    "fixed inset-0 z-[100]",
    variant === "dialog" && "flex items-end justify-center md:items-center md:p-6",
    isDrawer && "flex justify-end",
  );

  const panelClass = cn(
    "relative outline-none",
    surface === "dark" ? (isFull ? "bg-ink text-paper" : "bg-coal text-paper") : "bg-cream text-ink",
    variant === "dialog" &&
      cn(
        "max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-md shadow-lift md:max-h-[90dvh] md:rounded-md",
        sizeClass[size],
      ),
    isDrawer && "flex h-dvh w-full max-w-[28rem] flex-col overflow-hidden shadow-lift sm:border-l sm:border-paper/10",
    isFull && "h-dvh w-full overflow-y-auto overscroll-contain",
    className,
  );

  const motionProps = isDrawer
    ? {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] as const },
      }
    : isFull
      ? {
          initial: { opacity: 0, y: -16 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -16 },
          transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
        }
      : {
          initial: { opacity: 0, y: 36 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 28 },
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div ref={rootRef} className={container}>
      {!isFull && (
        <m.div
          aria-hidden
          className="absolute inset-0 bg-ink/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        />
      )}
      <m.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        data-surface={surface}
        className={panelClass}
        onKeyDown={trapTab}
        {...motionProps}
      >
        {!hideClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${label}`}
            className={cn(
              "absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-sm transition-colors",
              surface === "dark" ? "text-paper hover:bg-paper/10" : "bg-cream/90 text-ink hover:bg-ink/10",
            )}
          >
            <X aria-hidden className="size-6" />
          </button>
        )}
        {children}
      </m.div>
    </div>
  );
}
