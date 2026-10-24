"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCOP } from "@nitro/shared";
import { Button, buttonClasses } from "@nitro/ui";
import { useCart, useHydrated } from "@/lib/cart";
import { useVariantLookup } from "@/lib/catalog-client";
import { priceCart } from "@/lib/pricing";

const field = "mt-2 w-full rounded-button border border-ink/30 bg-transparent px-4 py-3 text-[17px] text-ink backdrop-blur-md";
const label = "block text-sm text-muted";

export function CheckoutForm() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const findVariant = useVariantLookup();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!hydrated) return <div className="mt-12 h-48" aria-hidden="true" />;

  const rows = lines.flatMap((l) => {
    const found = findVariant(l.sku);
    return found ? [{ ...found, qty: Math.min(l.qty, found.variant.stock) }] : [];
  });
  if (rows.length === 0) {
    return (
      <div className="mt-12 max-w-xl">
        <p className="text-[20px] text-muted">Tu carrito está vacío.</p>
        <Link href="/c/tecnologia" className={buttonClasses("ghost", "mt-8")}>
          Ver productos
        </Link>
      </div>
    );
  }

  const totals = priceCart(rows.map((r) => ({ category: r.product.category, priceCents: r.variant.priceCents, qty: r.qty })));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: rows.map((r) => ({ sku: r.variant.sku, qty: r.qty })),
          customer: { name: get("name"), email: get("email"), phone: get("phone") },
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
    <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <form onSubmit={submit} className="glass rounded-card p-8">
        <h2 className="text-[28px]">Datos de envío</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className={`${label} sm:col-span-2`}>
            Nombre completo
            <input name="name" required minLength={2} maxLength={120} autoComplete="name" className={field} />
          </label>
          <label className={label}>
            Correo
            <input name="email" type="email" required maxLength={160} autoComplete="email" className={field} />
          </label>
          <label className={label}>
            Teléfono / WhatsApp
            <input name="phone" type="tel" required minLength={7} maxLength={20} autoComplete="tel" className={field} />
          </label>
          <label className={label}>
            Departamento
            <input name="department" required minLength={2} maxLength={80} autoComplete="address-level1" className={field} />
          </label>
          <label className={label}>
            Ciudad
            <input name="city" required minLength={2} maxLength={80} autoComplete="address-level2" className={field} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Dirección
            <input name="line" required minLength={5} maxLength={200} autoComplete="street-address" className={field} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Indicaciones (opcional)
            <input name="notes" maxLength={300} className={field} />
          </label>
        </div>

        <label className="mt-6 flex items-start gap-3 text-[15px]">
          <input type="checkbox" required className="mt-1 size-4 accent-current" />
          <span>
            Acepto los{" "}
            <Link href="/terminos" className="text-link hover:underline">
              términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" className="text-link hover:underline">
              política de privacidad
            </Link>
            .
          </span>
        </label>

        {error && (
          <p role="alert" className="mt-5 text-[15px] text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="mt-6 w-full">
          {busy ? "Preparando el pago…" : `Pagar ${formatCOP(totals.totalCents)} con Wompi`}
        </Button>
        <p className="mt-3 text-[13px] text-muted">Pagas en el sitio seguro de Wompi: tarjeta, PSE, Nequi y más.</p>
      </form>

      <aside className="glass rounded-card p-8 lg:sticky lg:top-24">
        <h2 className="text-[28px]">Tu pedido</h2>
        <ul className="mt-6 space-y-3 text-[15px]">
          {rows.map(({ product, variant, qty }) => (
            <li key={variant.sku} className="flex justify-between gap-4">
              <span>
                {qty} × {product.name}
                {product.variants.length > 1 && <span className="text-muted"> · {variant.label}</span>}
              </span>
              <span className="shrink-0">{formatCOP(variant.priceCents * qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-3 border-t border-ink/15 pt-5 text-[17px]">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatCOP(totals.subtotalCents)}</dd>
          </div>
          {totals.discountCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Descuento ({totals.discountPct}%)</dt>
              <dd>−{formatCOP(totals.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Envío</dt>
            <dd>{totals.shippingFree ? "Gratis" : formatCOP(totals.shippingCents)}</dd>
          </div>
          <div className="flex justify-between pt-2 text-[21px] font-semibold">
            <dt>Total</dt>
            <dd>{formatCOP(totals.totalCents)}</dd>
          </div>
        </dl>
        {totals.missingForFreeCents > 0 && (
          <p className="mt-3 text-[13px] text-muted">Te faltan {formatCOP(totals.missingForFreeCents)} para el envío gratis.</p>
        )}
        <Link href="/carrito" className="mt-6 inline-block text-[15px] text-link hover:underline">
          Volver al carrito
        </Link>
      </aside>
    </div>
  );
}
