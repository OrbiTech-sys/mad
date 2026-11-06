/** Decorative ticker under the hero. Pure CSS; paused for reduced-motion users (see globals.css). */
export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item} className="flex items-center font-display text-3xl uppercase tracking-[0.06em] md:text-4xl">
          <span className="px-5 md:px-7">{item}</span>
          <span aria-hidden className="size-2 rotate-45 bg-ink" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="overflow-hidden border-y border-ink/20 bg-ember py-3 text-ink" role="presentation">
      <div className="flex w-max animate-marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
