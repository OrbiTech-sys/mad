"use client";

import { m, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll-triggered reveal: fade + short rise, once. Children can be server components.
 * Reduced-motion users get a plain fade (MotionConfig reducedMotion="user" in providers).
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
} & Omit<HTMLMotionProps<"div">, "children" | "className" | "initial" | "whileInView" | "viewport" | "transition">) {
  const Tag = m[as] as typeof m.div;
  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.65, ease: EASE, delay }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
