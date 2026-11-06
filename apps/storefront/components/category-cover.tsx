import type { Cover } from "@/lib/covers";

/**
 * Portada de una página de categoría, como la de inicio de la referencia: foto a todo el ancho con el título grande,
 * una frase y un botón que baja a los productos. La foto de celular es opcional.
 */
export function CategoryCover({ cover }: { cover: Cover }) {
  return (
    <section aria-labelledby="cover-title" className="relative -mx-6 -mt-16 md:-mt-24">
      <div data-theme="dark" className="relative isolate flex min-h-[460px] items-center justify-center overflow-hidden bg-[#111827] text-ink md:min-h-[600px]">
        {cover.image && (
          <picture>
            {cover.mobileImage && <source media="(max-width: 767px)" srcSet={cover.mobileImage} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover.image} alt="" fetchPriority="high" className="absolute inset-0 -z-10 size-full object-cover" />
          </picture>
        )}
        <span className="absolute inset-0 -z-10 bg-gradient-to-b from-black/25 via-black/30 to-black/55" />
        <div className="px-6 py-24 text-center text-white">
          <h1 id="cover-title" className="text-[clamp(44px,9vw,120px)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
            {cover.title}
          </h1>
          {cover.subtitle && <p className="mx-auto mt-5 max-w-[36ch] text-[clamp(18px,2.4vw,30px)] font-light">{cover.subtitle}</p>}
          <a
            href="#coleccion"
            className="cta-pulse mt-8 inline-flex rounded-button bg-white px-8 py-3.5 text-[15px] font-bold uppercase tracking-[0.06em] text-black hover:opacity-90"
          >
            {cover.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
