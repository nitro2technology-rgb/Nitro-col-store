// Reservas de stock. Al crear el pedido se APARTAN las unidades (inventory_items.reserved + una fila en stock_reservations)
// por un tiempo; al aprobarse el pago se descuentan de verdad (onHand) y se liberan si el pedido se cancela o vence.
// Así dos clientes no pueden pagar la última unidad. Todo está pensado para correr dentro de una transacción de Prisma.
import type { Prisma } from "@nitro/db";

type Tx = Prisma.TransactionClient;

/** Cuánto se aparta el stock mientras la persona paga. */
export const RESERVATION_MINUTES = 45;
/** Un pedido con un pago «en proceso» (PSE, Nequi…) se respeta más tiempo antes de soltarlo. */
const IN_PROGRESS_HOURS = 24;
/** Prefijo del motivo de cancelación por vencimiento (permite reactivar el pedido si el pago llega tarde). */
export const EXPIRED_REASON = "Vencido: no se pagó a tiempo";

export class OutOfStockError extends Error {
  constructor(public variantId: string) {
    super("Sin stock suficiente");
  }
}

/** Aparta unidades de una variante si hay disponibles (onHand - reserved ≥ qty). Una sola sentencia: sin carreras. */
export async function reserveItem(t: Tx, p: { orderId: string; variantId: string; inventoryItemId: string; quantity: number; expiresAt: Date }) {
  const n = await t.$executeRaw`
    UPDATE inventory_items SET reserved = reserved + ${p.quantity}, updated_at = now()
    WHERE id = ${p.inventoryItemId}::uuid AND on_hand - reserved >= ${p.quantity}`;
  if (n === 0) throw new OutOfStockError(p.variantId);
  await t.stockReservation.create({
    data: { inventoryItemId: p.inventoryItemId, orderId: p.orderId, quantity: p.quantity, expiresAt: p.expiresAt, status: "active" },
  });
}

/** Suelta las reservas activas de un pedido (cancelado, vencido o eliminado). */
export async function releaseOrder(t: Tx, orderId: string) {
  const active = await t.stockReservation.findMany({ where: { orderId, status: "active" } });
  for (const r of active) {
    await t.$executeRaw`UPDATE inventory_items SET reserved = GREATEST(reserved - ${r.quantity}, 0), updated_at = now() WHERE id = ${r.inventoryItemId}::uuid`;
    await t.stockReservation.update({ where: { id: r.id }, data: { status: "released" } });
  }
  return active.length;
}

/**
 * Pago aprobado: las reservas activas pasan a «committed» y esas unidades salen del inventario (onHand).
 * Devuelve false si el pedido no tenía reservas activas (pedido antiguo o ya vencido): el llamador decide qué hacer.
 */
export async function commitOrder(t: Tx, orderId: string) {
  const active = await t.stockReservation.findMany({ where: { orderId, status: "active" } });
  if (active.length === 0) return false;
  for (const r of active) {
    await t.$executeRaw`UPDATE inventory_items SET on_hand = on_hand - ${r.quantity}, reserved = GREATEST(reserved - ${r.quantity}, 0), updated_at = now() WHERE id = ${r.inventoryItemId}::uuid`;
    await t.stockReservation.update({ where: { id: r.id }, data: { status: "committed" } });
  }
  return true;
}

/**
 * Cancela los pedidos sin pagar que ya vencieron y suelta su stock. Se llama al crear un pedido y desde /api/health
 * (que el monitor visita cada 5 min). Es seguro correrlo varias veces y a la vez: cada pedido se cancela con el estado esperado.
 */
export async function expireStaleOrders() {
  const { db } = await import("@nitro/db");
  const now = new Date();
  const candidates = await db.order.findMany({
    where: {
      status: "pending_payment",
      OR: [
        { reservations: { some: { status: "active", expiresAt: { lt: now } } } },
        // Pedidos de antes de las reservas (sin ninguna): se limpian pasado un día.
        { reservations: { none: {} }, createdAt: { lt: new Date(now.getTime() - IN_PROGRESS_HOURS * 3600_000) } },
      ],
    },
    select: { id: true, number: true, createdAt: true, payments: { select: { providerRef: true, status: true } } },
    take: 100,
  });
  let expired = 0;
  for (const o of candidates) {
    // Con un pago en proceso en Wompi (tiene transacción y sigue pendiente) se espera más.
    const inProgress = o.payments.some((p) => p.providerRef && p.status === "pending");
    if (inProgress && now.getTime() - o.createdAt.getTime() < IN_PROGRESS_HOURS * 3600_000) continue;
    const done = await db.$transaction(async (t) => {
      const moved = await t.order.updateMany({ where: { id: o.id, status: "pending_payment" }, data: { status: "cancelled" } });
      if (moved.count === 0) return false;
      await releaseOrder(t, o.id);
      await t.orderStatusHistory.create({ data: { orderId: o.id, fromStatus: "pending_payment", toStatus: "cancelled", reason: EXPIRED_REASON } });
      return true;
    }, { timeout: 20000, maxWait: 10000 });
    if (done) expired++;
  }
  return expired;
}
