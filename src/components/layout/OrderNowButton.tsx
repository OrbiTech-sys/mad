"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { useOrderNow } from "@/hooks/useOrderNow";
import { Button, type ButtonSize, type ButtonVariant } from "../ui/Button";

/** The site-wide ORDER NOW call-to-action (opens the location modal the first time). */
export function OrderNowButton({
  variant = "primary",
  size = "md",
  block,
  className,
  children = "Order now",
  arrow = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  children?: ReactNode;
  arrow?: boolean;
}) {
  const orderNow = useOrderNow();
  return (
    <Button variant={variant} size={size} block={block} className={className} onClick={orderNow}>
      {children}
      {arrow && <ArrowRight aria-hidden className="size-5 transition-transform duration-200 group-hover/btn:translate-x-1" />}
    </Button>
  );
}
