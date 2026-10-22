import { BrandMark } from "@/components/brand-mark";
import { Branches } from "@/components/foliage";

/**
 * Portada de inicio, como tarjeta de vidrio: el banner sin textos y con el fondo blanco transparente
 * (public/brand/portada-tarjeta.webp, sacado de imagenes/portada/portada.png) deja ver el follaje de la
 * página a través del vidrio. El logo y los textos van encima como HTML, así se ven nítidos y se animan.
 * Las medidas van en `cqw` (porcentaje del ancho del banner) para que todo escale junto con la imagen.
 * Las posiciones replican las del banner original (2048×768).
 */
export function HomeHero() {
  return (
    <section className="hero hero-card relative mx-auto mt-3 w-[calc(100%-1.5rem)] max-w-[2048px] overflow-hidden rounded-card [container-type:inline-size] md:mt-4 md:w-[calc(100%-2rem)]">
      <h1 className="sr-only">Nitro Col Store: todo lo que necesitas, en un solo lugar.</h1>
      <div className="aspect-[2048/768]" />
      {/* Ramas detrás del vidrio, en el espacio blanco entre las fotos y los textos */}
      <Branches
        seed={5}
        viewBox="0 0 2048 768"
        className="hero-branches pointer-events-none absolute inset-0 h-full w-full"
        items={[
          { x: 640, y: -30, angle: 72, length: 300, bend: 26, leaf: 62 },
          { x: 560, y: 800, angle: -62, length: 320, bend: -22, leaf: 58 },
          { x: 1360, y: -30, angle: 104, length: 250, bend: -24, leaf: 56 },
          { x: 1460, y: 800, angle: -116, length: 330, bend: 24, leaf: 60 },
        ]}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/portada-tarjeta.webp"
        alt="Tecnología, hogar y estilo de vida, en blanco y negro."
        width={2048}
        height={768}
        fetchPriority="high"
        className="hero-bg absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden="true" className="hero-sheen pointer-events-none absolute inset-0" />

      <div className="absolute left-1/2 top-[6.45cqw] flex w-[25cqw] -translate-x-1/2 flex-col items-center text-ink">
        {/* Destino del acople de la intro: el logo de la intro termina exactamente aquí. */}
        <div data-intro-dock="" className="w-full">
          <BrandMark write className="hero-logo w-full" />
        </div>
        <p className="hero-in mt-[-0.4cqw] whitespace-nowrap font-serif [font-variant-numeric:lining-nums] text-[1.45cqw] font-semibold tracking-[0.32em] [--d:1.1s]">
          SINCE 2020
        </p>
        <span className="hero-line mt-[1.2cqw] block h-[0.12cqw] min-h-px w-[4.4cqw] bg-ink" />
        <p className="hero-in mt-[1.3cqw] whitespace-nowrap text-center text-[2.05cqw] font-light leading-[1.15] tracking-[-0.01em] [--d:1.55s]">
          Todo lo que necesitas,
          <br />
          <strong className="font-bold">en un solo lugar.</strong>
        </p>
      </div>
    </section>
  );
}
