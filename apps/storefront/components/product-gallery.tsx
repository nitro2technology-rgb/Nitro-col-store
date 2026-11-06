"use client";

import Image from "next/image";
import type { Product, ProductImage } from "@nitro/shared";
import { BuyCta } from "@/components/buy-cta";
import { useVariant } from "@/components/variant-context";

/**
 * Galería del color elegido: todas las fotos que se suben en el panel (principales y galería), grandes y a dos
 * columnas, con un botón de compra en medio para no perder al que ya se convenció. Cambia al elegir otro color.
 */
export function ProductGallery({ product, titleClass }: { product: Product; titleClass: string }) {
  const { sku } = useVariant();
  const variant = product.variants.find((v) => v.sku === sku) ?? product.variants[0]!;
  const seen = new Set<string>();
  const photos: ProductImage[] = [...(variant.images ?? []), ...(variant.gallery ?? [])].filter((p) => !seen.has(p.src) && seen.add(p.src));
  if (photos.length < 2) return null;
  const cut = Math.min(4, photos.length);
  const first = photos.slice(0, cut);
  const rest = photos.slice(cut);
  const grid = (list: ProductImage[]) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {list.map((p) => (
        <div key={`${variant.sku}-${p.src}`} className="relative aspect-square overflow-hidden rounded-[28px] bg-soft/20">
          <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 500px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        </div>
      ))}
    </div>
  );
  return (
    <section id="galeria" className="mx-auto max-w-[1024px] scroll-mt-28 px-6 py-20">
      <h2 className={titleClass}>Galería.</h2>
      <div className="mt-10">{grid(first)}</div>
      {rest.length > 0 && (
        <>
          <div className="py-6 text-center">
            <BuyCta product={product} className="w-full max-w-[560px]" />
          </div>
          {grid(rest)}
        </>
      )}
    </section>
  );
}
