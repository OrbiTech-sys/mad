import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="grid min-h-[70dvh] place-items-center bg-ink px-4 pb-16 pt-32 text-center">
      <div>
        <p className="font-display text-[clamp(7rem,28vw,16rem)] leading-[0.8] text-ember">404</p>
        <h1 className="display-lg mt-4">That page went MAD</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-smoke">We couldn&apos;t find what you were looking for.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" size="lg">
            Back home
          </ButtonLink>
          <ButtonLink href="/menu" size="lg" variant="outline">
            See the menu
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
