// Wompi (servidor). Las llaves salen de variables de entorno; nunca se envían al navegador, salvo la pública
// (que Wompi diseñó para ser pública). WOMPI_ENV=production usa el entorno real; cualquier otro valor, el sandbox.
import { createHash, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@nitro/db";

export const wompiApi = () =>
  process.env.WOMPI_ENV === "production" ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1";

const required = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name}`);
  return v;
};

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Referencia que Wompi devuelve en todo: NC-<número de pedido>. */
export const orderReference = (number: number) => `NC-${number}`;
export const parseReference = (ref: string) => {
  const m = /^NC-(\d+)$/.exec(ref);
  return m ? Number(m[1]) : null;
};

/** Firma de integridad que Wompi exige para aceptar el monto: sha256(referencia + monto + moneda + secreto). */
export function checkoutUrl({ reference, amountCents, redirectUrl }: { reference: string; amountCents: number; redirectUrl?: string }) {
  const signature = sha256(`${reference}${amountCents}COP${required("WOMPI_INTEGRITY_SECRET")}`);
  const q = new URLSearchParams({
    "public-key": required("WOMPI_PUBLIC_KEY"),
    currency: "COP",
    "amount-in-cents": String(amountCents),
    reference,
    "signature:integrity": signature,
  });
  // El WAF de Wompi bloquea (403) un redirect-url hacia localhost: en local se omite y Wompi muestra su propia página final.
  if (redirectUrl) q.set("redirect-url", redirectUrl);
  return `https://checkout.wompi.co/p/?${q}`;
}

export type WompiTransaction = {
  id: string;
  status: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string;
};

export type WompiEvent = {
  event: string;
  data: { transaction?: WompiTransaction } & Record<string, unknown>;
  timestamp: number;
  signature: { properties: string[]; checksum: string };
};

/** Verifica la firma del evento: sha256(valores de las propiedades indicadas + timestamp + secreto de eventos). */
export function verifyEvent(e: WompiEvent): boolean {
  try {
    const values = e.signature.properties.map((path) =>
      path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], e.data),
    );
    const expected = sha256(`${values.join("")}${e.timestamp}${required("WOMPI_EVENTS_SECRET")}`);
    const given = e.signature.checksum.toLowerCase();
    return expected.length === given.length && timingSafeEqual(Buffer.from(expected), Buffer.from(given));
  } catch {
    return false;
  }
}

/** Consulta una transacción directamente a Wompi (no se confía en lo que diga el navegador). */
export async function fetchTransaction(id: string): Promise<WompiTransaction | null> {
  const res = await fetch(`${wompiApi()}/transactions/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return ((await res.json()) as { data?: WompiTransaction }).data ?? null;
}

const paymentStatus = { APPROVED: "approved", DECLINED: "declined", ERROR: "declined", VOIDED: "voided", PENDING: "pending" } as const;

/**
 * Aplica el resultado de una transacción al pedido. Idempotente: el webhook y la página del pedido pueden
 * llamarlo varias veces. Al aprobarse, el pedido pasa a "paid" una sola vez y se descuenta el inventario.
 */
export async function applyTransaction(tx: WompiTransaction) {
  const number = parseReference(tx.reference);
  if (number === null) return null;
  const { db } = await import("@nitro/db");

  const order = await db.order.findUnique({ where: { number }, include: { items: true, payments: true } });
  if (!order) return null;
  if (tx.currency !== "COP" || BigInt(tx.amount_in_cents) !== order.totalCents) {
    console.error(`[wompi] Monto distinto en ${tx.reference}: Wompi ${tx.amount_in_cents}, pedido ${order.totalCents}`);
    return null;
  }

  const status = paymentStatus[tx.status as keyof typeof paymentStatus] ?? "pending";
  await db.$transaction(async (t) => {
    const payment = order.payments[0];
    if (payment && payment.status !== "approved") {
      await t.payment.update({
        where: { id: payment.id },
        data: { providerRef: tx.id, method: tx.payment_method_type ?? payment.method, status, raw: tx as unknown as Prisma.InputJsonValue },
      });
    }
    if (status !== "approved") return;

    // Solo una llamada logra pasar el pedido de pendiente a pagado; así el inventario se descuenta una vez.
    const moved = await t.order.updateMany({ where: { id: order.id, status: "pending_payment" }, data: { status: "paid" } });
    if (moved.count === 0) return;
    await t.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: "pending_payment", toStatus: "paid", reason: "Pago aprobado en Wompi" } });
    for (const item of order.items) {
      const dec = await t.inventoryItem.updateMany({
        where: { variantId: item.variantId, onHand: { gte: item.quantity } },
        data: { onHand: { decrement: item.quantity } },
      });
      if (dec.count === 0) console.error(`[wompi] Sin inventario suficiente para ${item.sku} en el pedido NC-${order.number}: revisar a mano`);
    }
  });
  return { number, status };
}
