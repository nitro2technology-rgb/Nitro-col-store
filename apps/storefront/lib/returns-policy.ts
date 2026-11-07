// Reglas que ve el cliente en «Mi cuenta». La devolución se puede pedir hasta RETURN_DAYS días después de entregado.
export const RETURN_DAYS = 5;
const DAY = 24 * 60 * 60 * 1000;

/** Cuándo se entregó: el último cambio a «entregado» del historial; si no hay (ventas por fuera), la última actualización. */
export function deliveredAt(history: { toStatus: string; createdAt: Date }[], fallback: Date) {
  const hit = history.filter((h) => h.toStatus === "delivered").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  return hit?.createdAt ?? fallback;
}

export const returnDeadline = (delivered: Date) => new Date(delivered.getTime() + RETURN_DAYS * DAY);
export const canRequestReturn = (delivered: Date, now = new Date()) => now.getTime() <= returnDeadline(delivered).getTime();

/** Pedidos que el cliente puede cancelar él mismo: solo si todavía no salieron. */
export const CANCELLABLE = ["pending_payment", "paid", "processing"] as const;
