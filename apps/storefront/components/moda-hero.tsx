import Image from "next/image";

type Panel = { src: string; alt: string };

/**
 * Portada de Moda (diseño editorial de Para MOda): dos fotografías a todo el ancho, sin separación
 * y sin texto encima; cada foto se ve completa (proporción 4:5), sin recortar, aunque la portada sea más alta que la pantalla. Se sirven sin recomprimir (`unoptimized`): son las fotos de mayor calidad del sitio.
 * El título de la página queda solo para lectores de pantalla.
 */
export function ModaHero({ title, panels }: { title: string; panels: Panel[] }) {
  return (
    <section
      aria-labelledby="moda-title"
      className="relative -mx-6 -mt-16 md:-mt-24"
    >
      <h1 id="moda-title" className="sr-only">
        {title}
      </h1>
      <div className="grid grid-cols-2 gap-0">
        {panels.map((p) => (
          <div key={p.src} className="relative aspect-[4/5] overflow-hidden">
            <Image src={p.src} alt={p.alt} fill priority unoptimized sizes="50vw" className="object-cover" />
          </div>
        ))}
      </div>
      <a
        href="#coleccion"
        aria-label="Bajar a los productos"
        className="absolute inset-x-0 bottom-4 mx-auto grid size-10 place-items-center text-xl text-white [text-shadow:0_1px_12px_rgb(0_0_0/0.5)]"
      >
        ↓
      </a>
    </section>
  );
}
