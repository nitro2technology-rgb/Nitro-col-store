"use client";

import Link from "next/link";
import { formatCOP } from "@nitro/shared";
import { buttonClasses } from "@nitro/ui";
import { ProductArt } from "@/components/art/product-art";
import { useCart, useHydrated } from "@/lib/cart";
import { useVariantLookup } from "@/lib/catalog-client";
import { priceCart } from "@/lib/pricing";
import { categories } from "@/lib/products";

export function CartView() {
  const hydrated = useHydrated();
  const { lines, setQty, remove, clear } = useCart();
  const findVariant = useVariantLookup();

  if (!hydrated) return <div className="mt-12 h-48" aria-hidden="true" />;

  // Se ignoran SKU que ya no existen en el catálogo.
  const rows = lines.flatMap((l) => {
    const found = findVariant(l.sku);
    return found ? [{ ...found, qty: Math.min(l.qty, found.variant.stock) }] : [];
  });

  if (rows.length === 0) {
    return (
      <div className="mt-12 max-w-xl">
        <p className="text-[20px] text-muted">Tu carrito está vacío. Elige una categoría para empezar.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className={buttonClasses("ghost")}>
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const t = priceCart(rows.map((r) => ({ category: r.product.category, priceCents: r.variant.priceCents, qty: r.qty })));
  const units = rows.reduce((n, r) => n + r.qty, 0);

  return (
    <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <ul className="space-y-4">
        {rows.map(({ product, variant, qty }) => (
          <li
            key={variant.sku}
            className="grid grid-cols-[96px_1fr] glass gap-5 rounded-card p-5 sm:grid-cols-[120px_1fr_auto] sm:items-center"
          >
            <Link
              href={`/p/${product.slug}`}
              data-theme={product.theme}
              className={`flex h-24 items-center justify-center rounded-[20px] sm:h-[120px] ${
                "bg-canvas"
              }`}
              aria-label={product.name}
            >
              <ProductArt product={product} swatch={variant.swatch} sku={variant.sku} className="h-[80%] w-auto" />
            </Link>

            <div className="min-w-0">
              <Link href={`/p/${product.slug}`} className="text-[19px] font-semibold hover:underline">
                {product.name}
              </Link>
              <p className="text-[15px] text-muted">
                {product.variants.length > 1 ? variant.label : ""}
              </p>
              <p className="mt-1 text-[17px]">{formatCOP(variant.priceCents)}</p>

              <div className="mt-3 flex items-center gap-4">
                <div className="inline-flex items-center rounded-chip bg-soft" role="group" aria-label={`Cantidad de ${product.name}`}>
                  <button
                    type="button"
                    onClick={() => setQty(variant.sku, qty - 1)}
                    aria-label="Quitar una unidad"
                    className="size-9 rounded-chip text-[19px] hover:brightness-110"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-[17px]" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(variant.sku, qty + 1)}
                    disabled={qty >= variant.stock}
                    aria-label="Agregar una unidad"
                    className="size-9 rounded-chip text-[19px] hover:brightness-110 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(variant.sku)}
                  className="text-[15px] text-link hover:underline"
                >
                  Quitar
                </button>
              </div>
              {qty >= variant.stock && (
                <p className="mt-2 text-[13px] text-muted">Es el máximo disponible.</p>
              )}
            </div>

            <p className="col-span-2 text-right text-[19px] font-semibold sm:col-span-1">
              {formatCOP(variant.priceCents * qty)}
            </p>
          </li>
        ))}
      </ul>

      <aside className="glass rounded-card p-8 lg:sticky lg:top-24">
        <h2 className="text-[28px]">Resumen</h2>
        <dl className="mt-6 space-y-3 text-[17px]">
          <div className="flex justify-between">
            <dt className="text-muted">
              Subtotal ({units} {units === 1 ? "unidad" : "unidades"})
            </dt>
            <dd>{formatCOP(t.subtotalCents)}</dd>
          </div>
          {t.discountCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Descuento por {t.gafasUnits} gafas ({t.discountPct}%)</dt>
              <dd>−{formatCOP(t.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Envío</dt>
            <dd>{t.shippingFree ? "Gratis" : formatCOP(t.shippingCents)}</dd>
          </div>
          <div className="flex justify-between pt-3 text-[21px] font-semibold">
            <dt>Total</dt>
            <dd>{formatCOP(t.totalCents)}</dd>
          </div>
        </dl>
        {t.missingForFreeCents > 0 && (
          <p className="mt-3 text-[14px]">Te faltan {formatCOP(t.missingForFreeCents)} para el envío gratis.</p>
        )}
        <p className="mt-2 text-[13px] text-muted">Precios en COP, IVA incluido. Envío gratis desde $150.000.</p>

        <Link href="/checkout" className={buttonClasses("buy", "mt-6 w-full")}>
          Ir a pagar
        </Link>

        <button type="button" onClick={clear} className="mt-6 text-[15px] text-link hover:underline">
          Vaciar carrito
        </button>
      </aside>
    </div>
  );
}
