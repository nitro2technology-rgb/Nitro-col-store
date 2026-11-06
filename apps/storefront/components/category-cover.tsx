import Link from "next/link";
import type { Cover, CoverMedia } from "@/lib/covers";

function Media({ m, className }: { m: CoverMedia; className: string }) {
  return m.type === "video" ? (
    <video src={m.url} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" className={className} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m.url} alt="" fetchPriority="high" className={className} />
  );
}

/**
 * Portada de una página de categoría, como la de inicio de la referencia: un medio (imagen, GIF o video) a todo el ancho
 * de la página pero de altura moderada, sin textos añadidos (si los hay, van dentro del propio medio). Si se subió un
 * medio para celular, ese se usa en pantallas pequeñas.
 */
export function CategoryCover({ cover, title }: { cover: Cover; title: string }) {
  const body = (
    <div className="relative overflow-hidden bg-[#111827]">
      {cover.mobile ? (
        <>
          <div className="aspect-[4/5] md:hidden">
            <Media m={cover.mobile} className="size-full object-cover" />
          </div>
          <div className="hidden aspect-[2.6/1] md:block">
            <Media m={cover.media} className="size-full object-cover" />
          </div>
        </>
      ) : (
        <div className="aspect-[16/9] sm:aspect-[2/1] md:aspect-[2.6/1]">
          <Media m={cover.media} className="size-full object-cover" />
        </div>
      )}
    </div>
  );
  return (
    <section aria-label={title} className="relative -mx-6 -mt-16 md:-mt-24">
      <h1 className="sr-only">{title}</h1>
      {cover.href ? (
        <Link href={cover.href} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
    </section>
  );
}
