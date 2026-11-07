"use client";

import { PriceTag } from "./price-tag";
import { useState } from "react";
import Link from "next/link";
import { formatPrice, type Product } from "@nitro/shared";
import { FavoriteButton } from "@/components/favorite-button";
import { ImageCarousel } from "@/components/image-carousel";
import { ProductArt } from "@/components/art/product-art";
import { findCategory, fromPrice, isEditorial, isSoldOut, variantImages } from "@/lib/products";

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function SoldOutBadge({ className }: { className: string }) {
  return <span className={`pointer-events-none absolute z-10 rounded-[6px] bg-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-white ${className}`}>Agotado</span>;
}

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
  // Agotado: la tarjeta se ve más opaca y lleva la etiqueta «Agotado» (por color en la lista por color).
  const soldOut = isSoldOut(product, showColor ? sku : undefined);
  const dim = soldOut ? "opacity-55 saturate-50" : "";
  const href = sku ? `/p/${product.slug}?color=${sku}` : `/p/${product.slug}`;

  // Lista por color (Moda y Tecnología): foto redondeada y rótulos pequeños en mayúsculas.
  if (showColor && isEditorial(product) && chosen) {
    return (
      <div className="relative w-full">
      <FavoriteButton sku={chosen.sku} name={product.name} className="absolute left-4 top-4 z-10" />
      {soldOut && <SoldOutBadge className="right-4 top-4" />}
      <Link
        href={href}
        data-theme={product.theme}
        className={`flex w-full flex-col rounded-card p-2.5 text-ink ${dim} ${dark ? "stage-dark border border-white/10" : "glass"}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Al pasar el mouse muestra la segunda foto; al salir de la tarjeta vuelve a la primera. */}
        <div className="relative">
          <ImageCarousel
            key={sku}
            images={images}
            cover={findCategory(product.category)?.parent?.slug === "moda"}
            jumpTo={hover ? 1 : 0}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
          {!soldOut && chosen.compareAtCents && chosen.compareAtCents > chosen.priceCents ? (
            <span className="pointer-events-none absolute right-3 top-3 rounded-[6px] bg-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-white">Oferta</span>
          ) : null}
        </div>
        <div className="min-w-0 px-2 pb-1 pt-3 text-[11px] uppercase leading-[1.3] tracking-[0.08em]">
          <p className="break-words">
            {product.name}
            {product.variants.length > 1 && <span className="block text-muted">{chosen.label}</span>}
          </p>
          {/* El precio va debajo del nombre y puede pasar a otra línea: así la oferta nunca se sale de la tarjeta. */}
          <PriceTag priceCents={chosen.priceCents} compareAtCents={chosen.compareAtCents} className="mt-1.5 max-w-full text-[13px] font-semibold" />
        </div>
      </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[420px]">
    <FavoriteButton sku={(chosen ?? first).sku} name={product.name} className="absolute left-6 top-6 z-10" />
    {soldOut && <SoldOutBadge className="right-6 top-6" />}
    <Link
      href={href}
      data-theme={product.theme}
      className={`flex w-full max-w-[420px] flex-col rounded-card p-4 text-ink ${dim} ${dark ? "stage-dark border border-white/10" : "glass"}`}
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
            ? <PriceTag priceCents={chosen.priceCents} compareAtCents={chosen.compareAtCents} />
            : fromPrice(product) > 0
              ? `Desde ${formatPrice(fromPrice(product))}`
              : formatPrice(0)}
        </p>
      </div>
    </Link>
    </div>
  );
}
