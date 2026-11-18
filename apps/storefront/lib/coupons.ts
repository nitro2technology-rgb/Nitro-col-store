// Cupones: se validan siempre en el servidor (el navegador solo manda el código).
import type { CouponType } from "@nitro/db";

export const normalizeCode = (v: unknown) => (typeof v === "string" ? v.trim().toUpperCase().replace(/\s+/g, "") : "");

export type ValidCoupon = { id: string; code: string; type: CouponType; value: number };

/** Devuelve el cupón si se puede usar con este carrito, o un mensaje de por qué no. */
export async function validateCoupon(opts: { code: string; subtotalCents: number; profileId?: string | null; email?: string | null }): Promise<{ coupon: ValidCoupon } | { error: string }> {
  const code = normalizeCode(opts.code);
  if (!code) return { error: "Escribe un código." };
  const { db } = await import("@nitro/db");
  const c = await db.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!c || !c.active) return { error: "Ese código no existe o ya no está activo." };
  if (c.startsAt && c.startsAt > now) return { error: "Ese código todavía no está vigente." };
  if (c.endsAt && c.endsAt < now) return { error: "Ese código ya venció." };
  if (c.minSubtotalCents && opts.subtotalCents < c.minSubtotalCents) return { error: "Tu compra no llega al mínimo para usar este código." };
  const live = { order: { status: { notIn: ["cancelled" as const, "refunded" as const] } } };
  if (c.maxRedemptions != null) {
    const used = await db.couponRedemption.count({ where: { couponId: c.id, ...live } });
    if (used >= c.maxRedemptions) return { error: "Este código ya alcanzó su límite de usos." };
  }
  if (c.perCustomerLimit != null) {
    const mine = await db.couponRedemption.count({
      where: { couponId: c.id, ...live, ...(opts.profileId ? { profileId: opts.profileId } : { order: { ...live.order, email: opts.email ?? "" } }) },
    });
    if (mine >= c.perCustomerLimit) return { error: "Ya usaste este código el máximo de veces." };
  }
  return { coupon: { id: c.id, code: c.code, type: c.type, value: c.value } };
}
