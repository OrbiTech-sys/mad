"use client";

import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { SITE } from "@/data/site";
import { ButtonLink } from "../ui/Button";
import { OrderNowButton } from "../layout/OrderNowButton";

const EASE = [0.22, 1, 0.36, 1] as const;

const line = {
  hidden: { y: "108%" },
  show: (i: number) => ({ y: 0, transition: { duration: 0.75, ease: EASE, delay: 0.08 + i * 0.12 } }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: 0.45 + i * 0.1 } }),
};

/**
 * Hero: oversized editorial headline, photo bleeding off the right edge, a brand seal.
 * Entrance is a short stagger (~1 s total). Parallax is a single transform on the photo and is
 * switched off for reduced-motion users.
 */
export function Hero({ branchCount }: { branchCount: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);

  return (
    <section ref={ref} aria-labelledby="hero-title" className="grain relative isolate overflow-hidden bg-ink pt-24 md:pt-28">
      <span aria-hidden className="grain-layer" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 md:px-6 lg:min-h-[min(48rem,calc(100svh-4.5rem))] lg:grid-cols-12 lg:items-center lg:gap-6 lg:pb-20">
        <div className="relative z-10 lg:col-span-7">
          <m.p
            variants={fadeUp}
            custom={-2}
            initial="hidden"
            animate="show"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-gold"
          >
            <span aria-hidden className="h-px w-8 bg-gold" />
            Fast food · Lahore
          </m.p>

          <h1 id="hero-title" className="display-hero text-paper">
            <span className="block overflow-hidden pb-[0.07em] pt-[0.03em]">
              <m.span className="block" custom={0} variants={line} initial="hidden" animate="show">
                Big cravings.
              </m.span>
            </span>
            <span className="block overflow-hidden pb-[0.07em] pt-[0.03em]">
              <m.span className="block text-ember" custom={1} variants={line} initial="hidden" animate="show">
                Bigger bites.
              </m.span>
            </span>
          </h1>

          <m.p
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-md text-lg leading-relaxed text-smoke md:text-xl"
          >
            Your next favourite bite is closer than you think.
          </m.p>

          <m.div variants={fadeUp} custom={1} initial="hidden" animate="show" className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <OrderNowButton size="lg" arrow className="w-full sm:w-auto">
              Order now
            </OrderNowButton>
            <ButtonLink href="/menu" variant="outline" size="lg" className="w-full sm:w-auto">
              Explore menu
            </ButtonLink>
          </m.div>

          <m.p
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="show"
            className="mt-7 flex items-start gap-2 text-sm text-smoke"
          >
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-ember" />
            <span>
              Delivery within {SITE.delivery.defaultRadiusKm} km of our {branchCount} Lahore branches. Further away?
              Pick up from the one nearest you.
            </span>
          </m.p>
        </div>

        <div className="relative lg:col-span-5">
          {/* flat offset block behind the photo */}
          <m.div
            aria-hidden
            className="absolute inset-0 translate-x-3 translate-y-3 bg-ember sm:translate-x-4 sm:translate-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          />
          <m.div
            className="relative aspect-[5/4] overflow-hidden bg-coal sm:aspect-[4/3] lg:aspect-[4/5]"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 0.95, ease: EASE, delay: 0.15 }}
          >
            <m.div className="absolute -inset-y-[8%] inset-x-0" style={{ y: photoY }}>
              <Image
                src="/images/hero-burger.jpg"
                alt="A double-patty burger with melted cheese and sauce on a dark background (representative photo)"
                fill
                priority
                sizes="(min-width:1024px) 40vw, 100vw"
                className="object-cover"
                style={{ objectPosition: "50% 55%" }}
              />
            </m.div>
          </m.div>

          <Seal />
        </div>
      </div>
    </section>
  );
}

/** Rotating circular brand seal. Decorative only. */
function Seal() {
  return (
    <div
      aria-hidden
      className="absolute -left-5 top-8 z-10 hidden size-28 place-items-center rounded-full bg-gold text-ink sm:grid lg:-left-12 lg:size-32"
    >
      <svg viewBox="0 0 120 120" className="absolute inset-0 animate-spin-slow">
        <defs>
          <path id="seal-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text fontFamily="var(--font-bebas), Impact, sans-serif" fontSize="14" fill="currentColor">
          <textPath href="#seal-circle" textLength="284" lengthAdjust="spacing">MIGHTY &amp; DELICIOUS • LAHORE •</textPath>
        </text>
      </svg>
      <span className="font-display text-4xl leading-none">MAD</span>
    </div>
  );
}
