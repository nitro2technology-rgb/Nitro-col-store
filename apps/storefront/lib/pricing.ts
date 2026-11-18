import { gafasDiscountPct } from "./gafas-promo";

/** Envío gratis desde $150.000 COP (centavos), ya descontado el descuento por cantidad. */
export const FREE_SHIPPING_FROM_CENTS = 15_000_000;
/** Costo de envío por debajo de ese monto: $15.000 fijo para todo el país (definido por el dueño). */
export const SHIPPING_FLAT_CENTS = 1_500_000;

export type PriceRow = { category: string; priceCents: number; qty: number };

/**
 * Totales de un carrito. Lo usan el carrito, el checkout (para mostrar) y el servidor (para cobrar):
 * el servidor siempre lo recalcula con los precios de la base, nunca con lo que envía el navegador.
 */
export type CouponInput = { type: "percentage" | "fixed" | "free_shipping"; value: number };

export function priceCart(rows: PriceRow[], coupon?: CouponInput | null) {
  const subtotalCents = rows.reduce((s, r) => s + r.priceCents * r.qty, 0);
  // Descuento por cantidad para todos los productos: cuenta las unidades de todo el carrito y se aplica al total.
  const units = rows.reduce((n, r) => n + r.qty, 0);
  const discountPct = gafasDiscountPct(units);
  const qtyDiscount = Math.round((subtotalCents * discountPct) / 100);
  // Cupón (se valida en el servidor): porcentaje o valor fijo sobre lo que queda; «envío gratis» solo quita el envío.
  let couponCents = 0;
  if (coupon?.type === "percentage") couponCents = Math.round(((subtotalCents - qtyDiscount) * Math.min(coupon.value, 100)) / 100);
  if (coupon?.type === "fixed") couponCents = Math.min(coupon.value, subtotalCents - qtyDiscount);
  const discountCents = qtyDiscount + couponCents;
  const afterDiscount = subtotalCents - discountCents;
  const shippingFree = coupon?.type === "free_shipping" || afterDiscount >= FREE_SHIPPING_FROM_CENTS;
  const shippingCents = rows.length === 0 || shippingFree ? 0 : SHIPPING_FLAT_CENTS;
  return {
    subtotalCents,
    units,
    discountPct,
    couponCents,
    discountCents,
    shippingCents,
    shippingFree,
    /** Cuánto falta para el envío gratis (0 si ya lo tiene o el carrito está vacío). */
    missingForFreeCents: rows.length === 0 || shippingFree ? 0 : FREE_SHIPPING_FROM_CENTS - afterDiscount,
    totalCents: afterDiscount + shippingCents,
  };
}
