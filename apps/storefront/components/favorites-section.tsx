"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavoriteRows } from "@/lib/favorite-rows";
import { variantImages } from "@/lib/products";
import { FavoriteButton } from "@/components/favorite-button";
import { PriceTag } from "@/components/price-tag";
import { Rail } from "@/components/rail";

/** «Tus favoritos»: al final de cada página, los productos que la persona guardó con el corazón. */
export function FavoritesSection() {
  const rows = useFavoriteRows();
  const path = usePathname();
  if (path.startsWith("/admin") || path.startsWith("/checkout") || path.startsWith("/pedido") || path.startsWith("/cuenta")) return null;
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="favoritos" className="mx-auto max-w-[1440px] px-4 py-14 md:px-8 md:py-16">
      <h2 id="favoritos" className="text-[clamp(24px,3vw,34px)] font-semibold">
        Tus favoritos
      </h2>
      <p className="mt-1 text-[15px] text-muted">Los productos que guardaste con el corazón. Quedan en este navegador.</p>
      <div className="mt-5">
        <Rail label="Tus favoritos">
          {rows.map(({ key, product: p, variant: v }) => {
            const photo = variantImages(p, v.sku)[0];
            return (
              <div key={key} className="relative w-[44vw] max-w-[240px] shrink-0 snap-start">
                <Link href={`/p/${p.slug}?color=${v.sku}`} className="block">
                  <span className="relative block aspect-square overflow-hidden rounded-[16px] bg-white">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.src} alt={photo.alt || p.name} loading="lazy" className="size-full object-contain p-2" />
                    ) : null}
                  </span>
                  <span className="mt-2 block text-[13px] font-semibold uppercase leading-tight tracking-[0.04em]">{p.name}{p.variants.length > 1 ? <span className="block font-normal normal-case text-muted">{v.label}</span> : null}</span>
                  <PriceTag priceCents={v.priceCents} compareAtCents={v.compareAtCents} className="mt-1 max-w-full text-[13px] font-semibold" />
                </Link>
                <FavoriteButton sku={v.sku} name={p.name} className="absolute right-2 top-2" />
              </div>
            );
          })}
        </Rail>
      </div>
    </section>
  );
}
