"use client";

// «Agrega más a tu pedido»: en el carrito sugiere otros productos (con stock y precio) que no están ya en él, primero de
// la misma familia (Moda o Tecnología). Cada uno se suma con un toque; el descuento por cantidad y el envío gratis se
// recalculan solos en el resumen. Misma idea que «Agrega X por solo $…» de «Completa tu pedido».
import Link from "next/link";
import { useMemo } from "react";
import { formatCOP, type Product, type Variant } from "@nitro/shared";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog-client";
import { gafasDiscountPct } from "@/lib/gafas-promo";
import { findCategory } from "@/lib/products";
import { track } from "@/lib/track";

const MAX_SUGGESTIONS = 4;
const firstAvailable = (p: Product): Variant | undefined => p.variants.find((v) => v.stock > 0 && v.priceCents > 0);
const familyOf = (p: Product) => findCategory(p.category)?.parent?.slug ?? p.category;

export function CartUpsell({ inCart, units }: { inCart: Product[]; units: number }) {
  const { products } = useCatalog();
  const { add } = useCart();

  const suggestions = useMemo(() => {
    const slugs = new Set(inCart.map((p) => p.slug));
    const families = new Set(inCart.map(familyOf));
    const pool = products.filter((p) => !slugs.has(p.slug) && firstAvailable(p));
    // Misma familia primero; dentro de cada grupo, los de más stock.
    const stock = (p: Product) => p.variants.reduce((n, v) => n + Math.max(0, v.stock), 0);
    const rank = (p: Product) => Number(families.has(familyOf(p)));
    return [...pool]
      .sort((a, b) => rank(b) - rank(a) || stock(b) - stock(a))
      .slice(0, MAX_SUGGESTIONS)
      .flatMap((p) => {
        const v = firstAvailable(p);
        return v ? [{ product: p, variant: v }] : [];
      });
  }, [products, inCart]);

  if (suggestions.length === 0) return null;

  const nextPct = gafasDiscountPct(units + 1);
  const hint =
    nextPct > gafasDiscountPct(units)
      ? `Agrega 1 producto más y ahorra ${nextPct}% en todo tu pedido.`
      : "Suma más productos y aprovecha el envío gratis desde $150.000.";

  return (
    <section aria-label="Agrega más a tu pedido" className="mt-8">
      <div className="plate inline-block max-w-full">
        <h2 className="text-[20px] font-semibold md:text-[24px]">Agrega más a tu pedido</h2>
        <p className="mt-0.5 text-[14px] text-muted">{hint}</p>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {suggestions.map(({ product, variant }) => {
          const src = variant.images?.[0]?.src;
          return (
            <li key={product.slug} className="glass flex flex-col rounded-card p-3">
              <Link href={`/p/${product.slug}?color=${variant.sku}`} className="block aspect-square overflow-hidden rounded-[14px] bg-soft/40" aria-label={product.name}>
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={product.name} loading="lazy" className="size-full object-contain" />
                )}
              </Link>
              <p className="mt-2 line-clamp-2 text-[14px] font-semibold leading-snug">{product.name}</p>
              {product.variants.length > 1 && <p className="text-[12px] text-muted">{variant.label}</p>}
              <p className="mt-1 text-[14px]">{formatCOP(variant.priceCents)}</p>
              <button
                type="button"
                onClick={() => {
                  const added = add(variant.sku);
                  if (added > 0)
                    track("add_to_cart", { value: variant.priceCents / 100, items: [{ sku: variant.sku, name: `${product.name} ${variant.label}`, price: variant.priceCents / 100, qty: 1 }] });
                }}
                className="mt-auto w-full rounded-button border border-ink/40 px-3 py-2 text-[13px] font-medium hover:bg-ink hover:text-canvas"
              >
                + Agregar
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
