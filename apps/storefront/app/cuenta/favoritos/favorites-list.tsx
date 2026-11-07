"use client";

import Link from "next/link";
import { formatPrice } from "@nitro/shared";
import { FavoriteButton } from "@/components/favorite-button";
import { useFavoriteRows } from "@/lib/favorite-rows";
import { variantImages } from "@/lib/products";

export function FavoritesList() {
  const rows = useFavoriteRows();
  if (rows.length === 0) {
    return (
      <p className="mt-8 text-[16px] text-muted">
        Aún no has guardado nada. Toca el corazón de un producto para verlo aquí.{" "}
        <Link href="/" className="text-link hover:underline">Ir a la tienda</Link>
      </p>
    );
  }
  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
      {rows.map(({ key, product, variant }) => {
        const photo = variantImages(product, variant.sku)[0];
        return (
          <li key={key} className="relative">
            <Link href={`/p/${product.slug}?color=${variant.sku}`} className="glass block rounded-card p-3 hover:opacity-90">
              <span className="relative block aspect-square overflow-hidden rounded-[14px] bg-white">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.src} alt={photo.alt || product.name} loading="lazy" className="size-full object-contain p-2" />
                ) : null}
              </span>
              <span className="mt-3 block text-[13px] font-semibold uppercase leading-tight tracking-[0.04em]">{product.name}</span>
              {product.variants.length > 1 && <span className="block text-[12px] text-muted">{variant.label}</span>}
              <span className="mt-1 block text-[14px] font-semibold">
                {variant.priceCents > 0 ? formatPrice(variant.priceCents) : "Precio por definir"}
                {variant.stock === 0 ? <span className="ml-2 text-[12px] font-normal text-muted">Agotado</span> : null}
              </span>
            </Link>
            <FavoriteButton sku={variant.sku} name={product.name} className="absolute right-5 top-5" />
          </li>
        );
      })}
    </ul>
  );
}
