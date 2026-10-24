import { gafasDiscountPct } from "./gafas-promo";

/** Envío gratis desde $150.000 COP (centavos), ya descontado el descuento por cantidad. */
export const FREE_SHIPPING_FROM_CENTS = 15_000_000;
/** Costo de envío por debajo de ese monto. PROVISIONAL ($12.000): el dueño define las tarifas reales. */
export const SHIPPING_FLAT_CENTS = 1_200_000;

export type PriceRow = { category: string; priceCents: number; qty: number };

/**
 * Totales de un carrito. Lo usan el carrito, el checkout (para mostrar) y el servidor (para cobrar):
 * el servidor siempre lo recalcula con los precios de la base, nunca con lo que envía el navegador.
 */
export function priceCart(rows: PriceRow[]) {
  const subtotalCents = rows.reduce((s, r) => s + r.priceCents * r.qty, 0);
  const gafas = rows.filter((r) => r.category === "gafas");
  const gafasUnits = gafas.reduce((n, r) => n + r.qty, 0);
  const discountPct = gafasDiscountPct(gafasUnits);
  const gafasCents = gafas.reduce((s, r) => s + r.priceCents * r.qty, 0);
  const discountCents = Math.round((gafasCents * discountPct) / 100);
  const afterDiscount = subtotalCents - discountCents;
  const shippingFree = afterDiscount >= FREE_SHIPPING_FROM_CENTS;
  const shippingCents = rows.length === 0 || shippingFree ? 0 : SHIPPING_FLAT_CENTS;
  return {
    subtotalCents,
    gafasUnits,
    discountPct,
    discountCents,
    shippingCents,
    shippingFree,
    /** Cuánto falta para el envío gratis (0 si ya lo tiene o el carrito está vacío). */
    missingForFreeCents: rows.length === 0 || shippingFree ? 0 : FREE_SHIPPING_FROM_CENTS - afterDiscount,
    totalCents: afterDiscount + shippingCents,
  };
}
