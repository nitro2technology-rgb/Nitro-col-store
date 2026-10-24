"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatCOP } from "@nitro/shared";
import { useCart, useHydrated } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog-client";
import { GAFAS_TIERS, gafasDiscountPct, type Recommendation } from "@/lib/gafas-promo";

/** Unidades de gafas que hay en el carrito (0 hasta que el navegador lea el carrito). */
export function useGafasUnits() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const { products } = useCatalog();
  if (!hydrated) return 0;
  const gafas = new Set(products.filter((p) => p.category === "gafas").flatMap((p) => p.variants.map((v) => v.sku)));
  return lines.reduce((n, l) => n + (gafas.has(l.sku) ? l.qty : 0), 0);
}

export function GafasUpsell({ items }: { items: Recommendation[] }) {
  const add = useCart((s) => s.add);
  const units = useGafasUnits();
  const [added, setAdded] = useState<string[]>([]);
  const active = gafasDiscountPct(units);
  const next = GAFAS_TIERS.find((t) => units < t.min);
  const last = GAFAS_TIERS[GAFAS_TIERS.length - 1]!;

  return (
    <section aria-labelledby="lleva-mas" className="mt-8 border-t border-ink/15 pt-6">
      <h2 id="lleva-mas" className="text-[21px]">Lleva más y ahorra dinero</h2>
      <ul className="mt-3 flex flex-wrap gap-2 text-[14px]">
        {GAFAS_TIERS.map((t) => (
          <li key={t.min} className={`px-3 py-1.5 ${active === t.pct ? "bg-ink text-canvas" : "bg-soft text-ink"}`}>
            {t.min === last.min ? `${t.min} o más` : `${t.min} gafas`}: <b>{t.pct}% menos</b>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[14px] text-muted" aria-live="polite">
        {units === 0
          ? "El descuento aplica sobre las gafas del carrito, de cualquier modelo y color."
          : !next
            ? `Llevas ${units} gafas: ya tienes ${active}% de descuento.`
            : `Llevas ${units} ${units === 1 ? "gafa" : "gafas"}${active > 0 ? ` (${active}% de descuento)` : ""}. Con ${next.min - units} más ahorras ${next.pct}%.`}
      </p>

      {items.length > 0 && (
        <ul className="mt-5 grid grid-cols-3 gap-3">
          {items.map((r) => {
            const done = added.includes(r.sku);
            return (
              <li key={r.sku} className="min-w-0">
                <Link href={`/p/${r.slug}`} className="block aspect-square overflow-hidden bg-soft" aria-label={`Ver ${r.model}`}>
                  {r.image && (
                    <Image src={r.image.src} alt={r.image.alt} width={240} height={240} sizes="160px" className="size-full object-cover" />
                  )}
                </Link>
                <p className="mt-2 truncate text-[14px] font-semibold">{r.model}</p>
                <p className="text-[13px] text-muted">{formatCOP(r.priceCents)}</p>
                <button
                  type="button"
                  onClick={() => {
                    add(r.sku);
                    setAdded((a) => [...a, r.sku]);
                  }}
                  disabled={done}
                  className="mt-2 w-full border border-ink/30 px-2 py-1.5 text-[13px] transition-colors hover:bg-ink hover:text-canvas disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-ink"
                >
                  {done ? "Agregada" : "Agregar"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
