"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@nitro/shared";

/**
 * Foto principal con las demás en una columna vertical a su izquierda (en celular, en fila debajo).
 * Al elegir una miniatura, esa pasa a ser la foto principal.
 */
export function ProductPhotos({ images, cover = false }: { images: ProductImage[]; cover?: boolean }) {
  const [index, setIndex] = useState(0);
  const current = images[Math.min(index, images.length - 1)]!;
  const fit = cover ? "object-cover object-[50%_25%]" : "object-contain";

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3 md:mx-0 md:flex-row-reverse md:items-start md:gap-4">
      <div className="relative aspect-square w-full min-w-0 overflow-hidden rounded-[20px] md:flex-1">
        <Image key={current.src} src={current.src} alt={current.alt} fill priority sizes="(min-width: 768px) 560px, 90vw" className={fit} />
      </div>

      {images.length > 1 && (
        <div role="group" aria-label="Fotos del producto" className="flex gap-2 overflow-x-auto md:max-h-[580px] md:w-[76px] md:shrink-0 md:flex-col md:overflow-y-auto md:overflow-x-visible md:p-1">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={`relative size-16 shrink-0 overflow-hidden rounded-[12px] transition-shadow md:size-[68px] ${
                i === index ? "ring-2 ring-ink" : "ring-1 ring-ink/20 hover:ring-ink/60"
              }`}
            >
              <Image src={img.src} alt="" fill sizes="68px" className={fit} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
