"use client";

import type { Product, Variant } from "@nitro/shared";
import { useHydrated } from "@/lib/cart";
import { useCatalog, useVariantLookup } from "@/lib/catalog-client";
import { useFavorites } from "@/lib/favorites";

export type FavoriteRow = { key: string; product: Product; variant: Variant };

/** Favoritos ya resueltos contra el catálogo (producto + color). Ignora los que ya no existen. */
export function useFavoriteRows(): FavoriteRow[] {
  const hydrated = useHydrated();
  const items = useFavorites((s) => s.items);
  const { products } = useCatalog();
  const find = useVariantLookup();
  if (!hydrated) return [];
  return items.flatMap((key) => {
    const hit = find(key);
    if (hit) return [{ key, product: hit.product, variant: hit.variant }];
    // Valor antiguo: el slug del producto
    const p = products.find((x) => x.slug === key);
    const v = p && (p.variants.find((x) => x.stock > 0 && x.priceCents > 0) ?? p.variants[0]);
    return p && v ? [{ key, product: p, variant: v }] : [];
  });
}
