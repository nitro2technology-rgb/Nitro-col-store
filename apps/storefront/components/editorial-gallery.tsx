"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ProductImage } from "@nitro/shared";

// Alto de cada foto: casi toda la pantalla. El ancho sale de la proporción 4:5 de las fotos, así se ven completas.
const photoHeight = "min(92svh, 1000px)";

/**
 * Galería editorial de Moda: fotos grandes y completas (sin recortar), dos a la vez en pantalla grande.
 * Se avanza y se vuelve con las flechas laterales.
 */
export function EditorialGallery({ images }: { images: ProductImage[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(1);

  // En pantalla grande caben dos fotos a la vez; en celular, una.
  useEffect(() => {
    const update = () => setVisible(window.innerWidth >= 768 ? 2 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const photoWidth = () => (track.current?.firstElementChild as HTMLElement | null)?.clientWidth ?? 0;
  const step = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * photoWidth(), behavior: "smooth" });
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const w = photoWidth();
    if (w) setIndex(Math.round(e.currentTarget.scrollLeft / w));
  };

  const atStart = index <= 0;
  const atEnd = index >= images.length - visible;

  const arrow = (dir: "prev" | "next") =>
    `absolute top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center bg-white/85 text-2xl text-black backdrop-blur transition-colors hover:bg-white ${
      dir === "prev" ? "left-0" : "right-0"
    }`;

  // El carril mide exactamente dos fotos (una en celular) y queda centrado.
  const cell = `min(88vw, calc(${photoHeight} * 0.8))`;
  return (
    <div
      className="relative mx-auto"
      style={{ width: `min(100%, calc(${visible} * ${cell}))` }}
      role="region"
      aria-label="Galería de imágenes"
    >
      <div ref={track} onScroll={onScroll} className="snap-row flex overflow-x-auto">
        {images.map((img, i) => (
          <div
            key={img.src}
            className="relative aspect-[4/5] shrink-0 bg-[#f8f8f6]"
            style={{ width: cell, scrollSnapAlign: "start" }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              quality={90}
              sizes="(min-width: 768px) 800px, 88vw"
              className="object-contain"
              priority={i < 2}
            />
          </div>
        ))}
      </div>
      {!atStart && (
        <button type="button" aria-label="Fotos anteriores" onClick={() => step(-1)} className={arrow("prev")}>
          ‹
        </button>
      )}
      {!atEnd && (
        <button type="button" aria-label="Fotos siguientes" onClick={() => step(1)} className={arrow("next")}>
          ›
        </button>
      )}
    </div>
  );
}
