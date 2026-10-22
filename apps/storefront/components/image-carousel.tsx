"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductImage } from "@nitro/shared";

/** Carrusel cuadrado: cada foto se ve completa. Con flechas y puntos; funciona dentro de un enlace. */
export function ImageCarousel({
  images,
  className = "",
  priority = false,
}: {
  images: ProductImage[];
  className?: string;
  priority?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // Al cambiar de fotos (ej. otro color) se vuelve a la primera.
  const key = images.map((i) => i.src).join("|");
  useEffect(() => {
    track.current?.scrollTo({ left: 0 });
    setIndex(0);
  }, [key]);

  const go = (e: React.MouseEvent, to: number) => {
    e.preventDefault();
    e.stopPropagation();
    const el = track.current;
    if (el) el.scrollTo({ left: to * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={`group/car relative ${className}`}>
      <div
        ref={track}
        className="snap-row flex aspect-square w-full overflow-x-auto rounded-[20px]"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        aria-label="Fotos del producto"
      >
        {images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            draggable={false}
            loading={priority && i === 0 ? "eager" : "lazy"}
            className="aspect-square w-full shrink-0 object-contain"
          />
        ))}
      </div>
      {images.length > 1 && (
        <>
          {(["prev", "next"] as const).map((dir) => {
            const to = dir === "prev" ? index - 1 : index + 1;
            if (to < 0 || to >= images.length) return null;
            return (
              <button
                key={dir}
                type="button"
                aria-label={dir === "prev" ? "Foto anterior" : "Foto siguiente"}
                onClick={(e) => go(e, to)}
                className={`absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-lg text-white opacity-0 backdrop-blur transition-opacity focus-visible:opacity-100 group-hover/car:opacity-100 max-md:opacity-100 ${
                  dir === "prev" ? "left-2" : "right-2"
                }`}
              >
                {dir === "prev" ? "‹" : "›"}
              </button>
            );
          })}
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
           <div className="flex gap-1.5 rounded-full bg-black/35 px-2 py-1 backdrop-blur">
            {images.map((img, i) => (
              <span
                key={img.src}
                className={`size-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"} shadow`}
              />
            ))}
           </div>
          </div>
        </>
      )}
    </div>
  );
}
