import Image from "next/image";
import { Reveal } from "../ui/Reveal";

/**
 * Brand story. Deliberately free of unsupported claims: no founding year, founders, awards,
 * sourcing or preparation statements. The only facts used are the verified ones (name, food
 * categories, three Lahore branches). Replace with MAD's own story when supplied.
 */
export function BrandStory({ branchCount }: { branchCount: number }) {
  return (
    <section id="story" aria-labelledby="story-title" data-surface="light" className="overflow-hidden bg-cream-deep py-16 text-ink md:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-6 lg:grid-cols-12 lg:items-center lg:gap-8">
        <Reveal className="relative lg:col-span-6">
          <div className="relative aspect-[4/3] overflow-hidden bg-ink lg:aspect-[5/4]">
            <Image
              src="/images/story-burger.jpg"
              alt="A burger with a golden bun, shot against a dark background (representative photo)"
              fill
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 40%" }}
            />
          </div>
          <div className="absolute -bottom-6 right-4 w-[46%] overflow-hidden border-[6px] border-cream-deep bg-ink shadow-lift sm:-bottom-8 sm:right-8 lg:-right-8">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/story-sides.jpg"
                alt="A burger beside fries in a steel cup (representative photo)"
                fill
                sizes="(min-width:1024px) 22vw, 46vw"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-8 lg:col-span-5 lg:col-start-8 lg:mt-0">
          <h2 id="story-title" className="display-xl">
            Mighty. Delicious. <span className="text-ember-deep">A little mad.</span>
          </h2>

          <div className="mt-8 grid max-w-xl gap-5 text-lg leading-relaxed text-ash">
            <p>
              MAD is short for <strong className="font-semibold text-ink">Mighty &amp; Delicious</strong> — and that
              is the whole idea. Big, bold flavour in burgers, wraps, pizza and loaded fries.
            </p>
            <p>
              Fast food should feel like an event, not an afterthought. That&apos;s the spirit behind the name: a big
              appetite, big flavour, and a little bit of madness.
            </p>
            <p>
              Find us at {branchCount} branches across Lahore, and order for delivery or pickup from the one that&apos;s
              closest to you.
            </p>
          </div>

          <ul className="mt-10 grid max-w-xl grid-cols-3 border-t border-ink/20">
            {[
              ["Mighty", "Big flavour first"],
              ["Delicious", "Every bite counts"],
              ["Mad", "Never boring"],
            ].map(([title, text]) => (
              <li key={title} className="border-r border-ink/20 py-4 pr-3 last:border-r-0 [&:not(:first-child)]:pl-3 sm:[&:not(:first-child)]:pl-5">
                <p className="font-display text-3xl uppercase leading-none sm:text-4xl">{title}</p>
                <p className="mt-1.5 text-sm text-ash">{text}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
