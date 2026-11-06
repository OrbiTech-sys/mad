import type { ReactNode } from "react";

/** Dark title band used at the top of inner pages (offsets the fixed navbar). */
export function PageHeader({
  title,
  children,
  id = "page-title",
}: {
  title: ReactNode;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <header className="grain relative isolate bg-ink pb-10 pt-28 md:pb-14 md:pt-36">
      <span aria-hidden className="grain-layer" />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h1 id={id} className="display-xl max-w-4xl">
          {title}
        </h1>
        {children && <div className="mt-4 max-w-2xl text-lg text-smoke md:text-xl">{children}</div>}
      </div>
    </header>
  );
}
