"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice, type Product } from "@nitro/shared";
import { ImageCarousel } from "@/components/image-carousel";
import { ProductArt } from "@/components/art/product-art";
import { fromPrice, isEditorial, variantImages } from "@/lib/products";

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Tarjeta de producto: carrusel con las fotos principales, nombre, descripción y precio. */
export function ProductTile({ product, sku, showColor = false }: { product: Product; sku?: string; showColor?: boolean }) {
  const [hover, setHover] = useState(false);
  const first = product.variants[0]!;
  const chosen = product.variants.find((v) => v.sku === sku);
  const dark = product.theme === "dark";
  const base = variantImages(product, sku);
  // En la lista por color se suma una foto con modelo (al azar pero estable) si ese color la tiene.
  const extra = showColor && chosen?.gallery?.length ? chosen.gallery[hash(chosen.sku) % chosen.gallery.length] : undefined;
  const images = extra ? [...base, extra] : base;
  const href = sku ? `/p/${product.slug}?color=${sku}` : `/p/${product.slug}`;

  // Diseño editorial de Moda: la foto llena el recuadro, esquinas rectas, rótulos pequeños en mayúsculas.
  // La tarjeta sigue siendo de vidrio translúcido, como en el resto de la tienda.
  if (showColor && isEditorial(product) && chosen) {
    return (
      <Link
        href={href}
        data-theme={product.theme}
        className="glass flex w-full flex-col text-ink"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Al pasar el mouse muestra la segunda foto; al salir de la tarjeta vuelve a la primera. */}
        <ImageCarousel
          key={sku}
          images={images}
          editorial
          jumpTo={hover ? 1 : 0}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
        />
        <div className="flex items-start justify-between gap-3 px-3 py-3 text-[11px] uppercase leading-[1.3] tracking-[0.08em]">
          <p>
            {product.name}
            <span className="block text-muted">{chosen.label}</span>
          </p>
          <p className="shrink-0 text-right">{formatPrice(chosen.priceCents)}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      data-theme={product.theme}
      className={`flex w-full max-w-[420px] flex-col rounded-card p-4 text-ink ${dark ? "stage-dark border border-white/10" : "glass"}`}
    >
      {images.length > 0 ? (
        <ImageCarousel key={sku} images={images} />
      ) : (
        <div className="flex aspect-square items-center justify-center">
          <ProductArt product={product} swatch={first.swatch} className="h-full w-auto max-w-full" />
        </div>
      )}
      <div className="px-3 pb-3 pt-5">
        <h3 className="text-[26px]">{product.name}</h3>
        <p className="mt-1 text-[17px] text-muted">{showColor && chosen ? chosen.label : product.tagline}</p>
        {!showColor && <p className="mt-2 line-clamp-2 text-[15px] leading-[1.45] text-muted">{product.description}</p>}
        <p className="mt-4 text-[19px] font-semibold">
          {showColor && chosen
            ? formatPrice(chosen.priceCents)
            : fromPrice(product) > 0
              ? `Desde ${formatPrice(fromPrice(product))}`
              : formatPrice(0)}
        </p>
      </div>
    </Link>
  );
}
