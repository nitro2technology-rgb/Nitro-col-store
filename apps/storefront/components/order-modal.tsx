"use client";

// «Completa tu pedido»: ventana de compra rápida que abre «Quiero el mío ahora». Elige color y cantidad, ofrece
// sumar otro producto, pide los datos de envío y lleva al pago seguro de Wompi. Los precios, el descuento por
// cantidad, el envío y el stock se muestran con los mismos cálculos que la tienda y el servidor los vuelve a calcular.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCOP, type Product, type Variant } from "@nitro/shared";
import { useCatalog, useVariantLookup } from "@/lib/catalog-client";
import { useOrderModal } from "@/lib/order-modal";
import { priceCart } from "@/lib/pricing";
import { findCategory } from "@/lib/products";

const input = "mt-1 w-full rounded-[12px] border border-ink/25 bg-canvas px-3 py-2.5 text-[16px] text-ink outline-none focus:border-ink";
const lbl = "block text-[13px] font-semibold text-ink";

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

function Dialog({ initialSku, onClose }: { initialSku: string; onClose: () => void }) {
  const { products } = useCatalog();
  const findVariant = useVariantLookup();
  const [sku, setSku] = useState(initialSku);
  const [qty, setQty] = useState(1);
  const [upsell, setUpsell] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const found = findVariant(sku);
  const product = found?.product;
  const variant = found?.variant;

  // Otro producto para sumar: de la misma familia (Moda o Tecnología) si hay, y con stock.
  const extra = useMemo(() => {
    if (!product) return null;
    const parent = findCategory(product.category)?.parent?.slug;
    const pool = products.filter((p) => p.slug !== product.slug && p.variants.some((v) => v.stock > 0 && v.priceCents > 0));
    const pick = pool.find((p) => findCategory(p.category)?.parent?.slug === parent) ?? pool[0];
    const v = pick?.variants.find((x) => x.stock > 0 && x.priceCents > 0);
    return pick && v ? { product: pick, variant: v } : null;
  }, [products, product]);

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

  if (!product || !variant) return null;
  const maxQty = Math.min(3, variant.stock);
  const q = Math.min(qty, Math.max(maxQty, 1));
  const rowOf = (p: Product, v: Variant, n: number) => ({ category: p.category, priceCents: v.priceCents, qty: n });
  const rows = [rowOf(product, variant, q), ...(upsell && extra ? [rowOf(extra.product, extra.variant, 1)] : [])];
  const totals = priceCart(rows);
  const pack = (n: number) => priceCart([rowOf(product, variant, n)]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ sku: variant!.sku, qty: q }, ...(upsell && extra ? [{ sku: extra.variant.sku, qty: 1 }] : [])],
          customer: { name: `${get("name")} ${get("lastname")}`.trim(), email: get("email"), phone: get("phone") },
          address: { department: get("department"), city: get("city"), line: get("line"), notes: get("notes") },
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
        className="max-h-[94dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[28px] bg-canvas p-5 text-ink shadow-2xl sm:rounded-[28px] sm:p-7"
      >
        <div className="flex items-center justify-between">
          <h2 id="order-title" className="text-[22px] font-extrabold uppercase tracking-[0.04em]">
            Completa tu pedido
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full text-[22px] hover:bg-ink/10">
            ×
          </button>
        </div>

        {/* Producto elegido */}
        <div className="mt-4 rounded-[14px] border-2 border-ink p-3">
          <div className="flex items-center gap-3">
            <Thumb product={product} variant={variant} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{product.name}</p>
              <p className="text-[14px] text-muted">{product.variants.length > 1 ? variant.label : product.tagline}</p>
            </div>
            <p className="shrink-0 font-bold">{formatCOP(variant.priceCents)}</p>
          </div>
          {product.variants.length > 1 && (
            <label className={`${lbl} mt-3`}>
              Color
              <select value={sku} onChange={(e) => setSku(e.target.value)} className={input}>
                {product.variants.map((v) => (
                  <option key={v.sku} value={v.sku} disabled={v.stock <= 0}>
                    {v.label}
                    {v.stock <= 0 ? " (agotado)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Cantidad: llevar más cuesta menos solo cuando hay descuento real por cantidad */}
        {maxQty > 1 && (
          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">Cantidad</legend>
            {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => {
              const t = pack(n);
              const active = q === n;
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
          </fieldset>
        )}

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
            disabled={busy}
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
