"use client";

// «Completa tu pedido»: ventana de compra rápida que abre «Quiero el mío ahora». Con 2 o 3 unidades se elige, unidad por
// unidad, el modelo y el color (de la misma categoría); ofrece sumar otro producto, pide los datos de envío y lleva al
// pago seguro de Wompi. Precios, descuento por cantidad, envío y stock se muestran con los mismos cálculos que la tienda
// y el servidor los vuelve a calcular al crear el pedido.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCOP, type Product, type Variant } from "@nitro/shared";
import { useCatalog, useVariantLookup } from "@/lib/catalog-client";
import { gafasDiscountPct } from "@/lib/gafas-promo";
import { useOrderModal } from "@/lib/order-modal";
import { priceCart } from "@/lib/pricing";
import { findCategory } from "@/lib/products";
import { SavedFill } from "@/components/saved-fill";
import { track, trackingContext } from "@/lib/track";

const input = "mt-1 w-full rounded-[12px] border border-ink/25 bg-canvas px-3 py-2.5 text-[16px] text-ink outline-none focus:border-ink";
const lbl = "block text-[13px] font-semibold text-ink";
const MAX_UNITS = 3;

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[15px]">
      <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-ink/40 text-[11px]">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

function Thumb({ product, variant }: { product: Product; variant: Variant }) {
  const src = variant.images?.[0]?.src;
  return (
    <div className="size-14 shrink-0 overflow-hidden rounded-[10px] bg-soft/40">
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={product.name} className="size-full object-contain" />
      )}
    </div>
  );
}

const firstAvailable = (p: Product) => p.variants.find((v) => v.stock > 0 && v.priceCents > 0);

function Dialog({ initialSku, onClose }: { initialSku: string; onClose: () => void }) {
  const { products } = useCatalog();
  const findVariant = useVariantLookup();
  const [qty, setQty] = useState(1);
  // Un SKU por unidad: las nuevas unidades empiezan con el mismo color que la primera y se pueden cambiar.
  const [picks, setPicks] = useState<string[]>(() => Array.from({ length: MAX_UNITS }, () => initialSku));
  const [upsell, setUpsell] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const first = findVariant(initialSku);
  const category = first?.product.category;

  // Modelos entre los que se puede elegir: los de la misma categoría con algo disponible.
  const models = useMemo(
    () => (category ? products.filter((p) => p.category === category && firstAvailable(p)) : []),
    [products, category],
  );

  // Otro producto para sumar: de la misma familia (Moda o Tecnología) si hay, de otra categoría.
  const extra = useMemo(() => {
    if (!first) return null;
    const parent = findCategory(first.product.category)?.parent?.slug;
    const pool = products.filter((p) => p.category !== first.product.category && firstAvailable(p));
    const pick = pool.find((p) => findCategory(p.category)?.parent?.slug === parent) ?? pool[0];
    const v = pick && firstAvailable(pick);
    return pick && v ? { product: pick, variant: v } : null;
  }, [products, first]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!first) return null;

  const units = picks.slice(0, qty).flatMap((sku) => {
    const f = findVariant(sku);
    return f ? [f] : [];
  });
  const rowOf = (p: Product, v: Variant) => ({ category: p.category, priceCents: v.priceCents, qty: 1 });
  const rows = [...units.map((u) => rowOf(u.product, u.variant)), ...(upsell && extra ? [rowOf(extra.product, extra.variant)] : [])];
  const totals = priceCart(rows);
  const packTotals = (n: number) => priceCart(picks.slice(0, n).flatMap((sku) => (findVariant(sku) ? [rowOf(findVariant(sku)!.product, findVariant(sku)!.variant)] : [])));

  // Unidades pedidas por SKU (la misma gafa dos veces cuenta 2) contra el stock.
  const wanted = new Map<string, number>();
  for (const u of units) wanted.set(u.variant.sku, (wanted.get(u.variant.sku) ?? 0) + 1);
  if (upsell && extra) wanted.set(extra.variant.sku, (wanted.get(extra.variant.sku) ?? 0) + 1);
  const short = [...wanted].flatMap(([sku, n]) => {
    const f = findVariant(sku);
    return f && n > f.variant.stock ? [`${f.product.name}${f.product.variants.length > 1 ? ` (${f.variant.label})` : ""}: solo quedan ${f.variant.stock}`] : [];
  });

  const setPick = (i: number, sku: string) => setPicks((cur) => cur.map((s, j) => (j === i ? sku : s)));
  const pct2 = gafasDiscountPct(2);
  const pct3 = gafasDiscountPct(3);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (short.length > 0) return;
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    setBusy(true);
    setError("");
    track("begin_checkout", {
      value: totals.totalCents / 100,
      items: [...wanted].flatMap(([sku, n]) => {
        const f = findVariant(sku);
        return f ? [{ sku, name: `${f.product.name} ${f.variant.label}`, price: f.variant.priceCents / 100, qty: n }] : [];
      }),
    });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [...wanted].map(([sku, n]) => ({ sku, qty: n })),
          customer: { name: `${get("name")} ${get("lastname")}`.trim(), email: get("email"), phone: get("phone") },
          address: { department: get("department"), city: get("city"), line: get("line"), notes: get("notes") },
          saveData: f.get("saveData") === "on",
          tracking: trackingContext(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "No se pudo crear el pedido.");
      window.location.href = data.url; // Wompi
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
        data-theme="light"
        className="max-h-[94dvh] w-full max-w-[540px] overflow-y-auto rounded-t-[28px] bg-canvas p-5 text-ink shadow-2xl sm:rounded-[28px] sm:p-7"
      >
        <div className="flex items-center justify-between">
          <h2 id="order-title" className="text-[22px] font-extrabold uppercase tracking-[0.04em]">
            Completa tu pedido
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full text-[22px] hover:bg-ink/10">
            ×
          </button>
        </div>

        {/* Cantidad */}
        <fieldset className="mt-4">
          <legend className="text-[13px] font-semibold">¿Cuántas unidades?</legend>
          <div className="mt-2 space-y-2">
            {Array.from({ length: MAX_UNITS }, (_, i) => i + 1).map((n) => {
              const t = packTotals(n);
              const active = qty === n;
              return (
                <label
                  key={n}
                  className={`flex cursor-pointer items-center gap-3 rounded-[14px] border p-3 transition-colors ${active ? "border-ink bg-ink/[0.04]" : "border-ink/20 hover:border-ink/50"}`}
                >
                  <input type="radio" name="pack" checked={active} onChange={() => setQty(n)} className="size-4 accent-current" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-tight">
                      {n} {n === 1 ? "unidad" : "unidades"}
                    </span>
                    {t.discountCents > 0 && (
                      <span className="mt-1 inline-block rounded-full bg-ink px-2.5 py-0.5 text-[12px] font-bold text-canvas">AHORRA {formatCOP(t.discountCents)}</span>
                    )}
                  </span>
                  <span className="text-right">
                    {t.discountCents > 0 && <s className="block text-[13px] text-muted">{formatCOP(t.subtotalCents)}</s>}
                    <span className="font-bold">{formatCOP(t.subtotalCents - t.discountCents)}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {pct2 > 0 && (
            <p className="mt-2 text-[13px] text-muted">
              Lleva 2 y ahorra {pct2} %, lleva 3 o más y ahorra {pct3} %. Puedes mezclar modelos y colores.
            </p>
          )}
        </fieldset>

        {/* Una fila por unidad: modelo y color */}
        <div className="mt-4 space-y-3">
          {units.map((u, i) => (
            <div key={i} className="rounded-[14px] border-2 border-ink p-3">
              <div className="flex items-center gap-3">
                <Thumb product={u.product} variant={u.variant} />
                <div className="min-w-0 flex-1">
                  {qty > 1 && <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted">Unidad {i + 1}</p>}
                  <p className="font-semibold leading-tight">{u.product.name}</p>
                  <p className="text-[14px] text-muted">{u.product.variants.length > 1 ? u.variant.label : u.product.tagline}</p>
                </div>
                <p className="shrink-0 font-bold">{formatCOP(u.variant.priceCents)}</p>
              </div>
              <div className={`mt-3 grid gap-3 ${models.length > 1 && u.product.variants.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {models.length > 1 && (
                  <label className={lbl}>
                    Modelo
                    <select
                      value={u.product.slug}
                      onChange={(e) => {
                        const p = models.find((m) => m.slug === e.target.value);
                        const v = p && firstAvailable(p);
                        if (v) setPick(i, v.sku);
                      }}
                      className={input}
                    >
                      {models.map((m) => (
                        <option key={m.slug} value={m.slug}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {u.product.variants.length > 1 && (
                  <label className={lbl}>
                    Color
                    <select value={u.variant.sku} onChange={(e) => setPick(i, e.target.value)} className={input}>
                      {u.product.variants.map((v) => (
                        <option key={v.sku} value={v.sku} disabled={v.stock <= 0 || v.priceCents <= 0}>
                          {v.label}
                          {v.stock <= 0 ? " (agotado)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
          ))}
          {short.length > 0 && (
            <p role="alert" className="text-[14px] text-red-600">
              No alcanzan las unidades: {short.join("; ")}. Cambia el color o el modelo de alguna unidad.
            </p>
          )}
        </div>

        <ul className="mt-4 space-y-2 rounded-[14px] bg-soft/30 p-4">
          <Check>
            <b>Pago seguro</b> con Wompi: tarjeta, PSE, Nequi y más
          </Check>
          <Check>
            Envío a toda Colombia, <b>gratis</b> desde $150.000
          </Check>
          <Check>
            <b>Garantía</b> y cinco días hábiles de retracto
          </Check>
          <Check>Entrega en 2 a 5 días hábiles</Check>
        </ul>

        <form onSubmit={submit} className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <SavedFill />
            <label className={lbl}>
              Nombre *
              <input name="name" required minLength={2} maxLength={60} autoComplete="given-name" className={input} />
            </label>
            <label className={lbl}>
              Apellido *
              <input name="lastname" required minLength={2} maxLength={60} autoComplete="family-name" className={input} />
            </label>
            <label className={lbl}>
              Correo *
              <input name="email" type="email" required maxLength={160} autoComplete="email" className={input} />
            </label>
            <label className={lbl}>
              Teléfono / WhatsApp *
              <input name="phone" type="tel" required minLength={7} maxLength={20} autoComplete="tel" className={input} />
            </label>
            <label className={lbl}>
              Departamento *
              <input name="department" required minLength={2} maxLength={80} autoComplete="address-level1" className={input} />
            </label>
            <label className={lbl}>
              Ciudad *
              <input name="city" required minLength={2} maxLength={80} autoComplete="address-level2" className={input} />
            </label>
            <label className={`${lbl} sm:col-span-2`}>
              Dirección (ej. Calle 4 #15-20) *
              <input name="line" required minLength={5} maxLength={200} autoComplete="street-address" className={input} />
            </label>
            <label className={`${lbl} sm:col-span-2`}>
              Punto de referencia (opcional)
              <input name="notes" maxLength={300} placeholder="Barrio, conjunto…" className={input} />
            </label>
          </div>

          <dl className="mt-5 space-y-1.5 rounded-[14px] bg-ink/[0.06] p-4 text-[15px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatCOP(totals.subtotalCents)}</dd>
            </div>
            {totals.discountCents > 0 && (
              <div className="flex justify-between">
                <dt>Descuento ({totals.discountPct}%)</dt>
                <dd>−{formatCOP(totals.discountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Envío</dt>
              <dd>{totals.shippingFree ? "Gratis" : formatCOP(totals.shippingCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink/15 pt-2 text-[18px] font-bold">
              <dt>Total</dt>
              <dd>{formatCOP(totals.totalCents)}</dd>
            </div>
            {totals.missingForFreeCents > 0 && <p className="pt-1 text-[13px] text-muted">Te faltan {formatCOP(totals.missingForFreeCents)} para el envío gratis.</p>}
          </dl>

          {extra && (
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-[14px] border-2 border-dashed border-ink/40 bg-soft/20 p-3">
              <input type="checkbox" checked={upsell} onChange={(e) => setUpsell(e.target.checked)} className="size-5 shrink-0 accent-current" />
              <span className="min-w-0 flex-1 text-[15px] leading-snug">
                Agrega <b>{extra.product.name}</b>
                {extra.product.variants.length > 1 ? ` (${extra.variant.label})` : ""} por solo <b>{formatCOP(extra.variant.priceCents)}</b>
              </span>
              <Thumb product={extra.product} variant={extra.variant} />
            </label>
          )}

          <label className="mt-4 flex items-start gap-3 text-[14px]">
            <input type="checkbox" required className="mt-1 size-4 accent-current" />
            <span>
              Acepto los{" "}
              <Link href="/terminos" target="_blank" className="underline">
                términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" target="_blank" className="underline">
                política de privacidad
              </Link>
              .
            </span>
          </label>

          {error && (
            <p role="alert" className="mt-4 text-[14px] text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || short.length > 0}
            className="mt-5 w-full rounded-button bg-action px-6 py-4 text-[16px] font-bold uppercase tracking-[0.05em] text-on-action hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Preparando el pago…" : `Pagar ${formatCOP(totals.totalCents)} con Wompi`}
          </button>
          <p className="mt-3 text-center text-[12px] text-muted">🔒 Pagas en el sitio seguro de Wompi. Te confirmamos el pedido por correo.</p>
        </form>
      </div>
    </div>
  );
}

/** Se monta una sola vez en el layout; solo dibuja algo cuando un botón abrió el pedido. */
export function OrderModal() {
  const sku = useOrderModal((s) => s.sku);
  const close = useOrderModal((s) => s.close);
  return sku ? <Dialog key={sku} initialSku={sku} onClose={close} /> : null;
}
