"use server";

// Acciones del panel. Cada una verifica de nuevo que quien la llama es administrador (un formulario se puede
// enviar a mano), valida los datos, cambia la base en una transacción y deja rastro en historial y auditoría.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OrderStatus, Prisma } from "@nitro/db";
import { requireAdmin } from "@/lib/admin";
import { sendShippedEmail } from "@/lib/mail";

const MAX_PRICE_PESOS = 50_000_000;
const MAX_STOCK = 100_000;

/** Desde qué estados se puede llegar a cada estado. Lo que no está aquí no se puede hacer desde el panel. */
const ALLOWED_FROM: Partial<Record<OrderStatus, OrderStatus[]>> = {
  processing: ["paid"],
  shipped: ["paid", "processing"],
  delivered: ["shipped"],
  cancelled: ["pending_payment"],
};

const back = (path: string, msg: { ok?: string; error?: string }): never =>
  redirect(`${path}?${new URLSearchParams(msg as Record<string, string>).toString()}`);

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Entero ≥ 0 a partir del texto del formulario ("65.000" o "65000"); null si no es válido. */
function int(value: string) {
  const clean = value.replace(/[.\s$]/g, "");
  if (!/^\d+$/.test(clean)) return null;
  const n = Number(clean);
  return Number.isSafeInteger(n) ? n : null;
}

async function db() {
  return (await import("@nitro/db")).db;
}

// ───────────── Pedidos ─────────────

async function moveOrder(
  number: number,
  to: OrderStatus,
  actorId: string,
  reason: string,
  extra?: (t: Prisma.TransactionClient, orderId: string) => Promise<void>,
) {
  const from = ALLOWED_FROM[to] ?? [];
  return (await db()).$transaction(async (t) => {
    const order = await t.order.findUnique({ where: { number }, select: { id: true, status: true } });
    if (!order || !from.includes(order.status)) return null;
    // updateMany con el estado esperado: si otra persona lo cambió al mismo tiempo, no se pisa.
    const moved = await t.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: to } });
    if (moved.count === 0) return null;
    await t.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: order.status, toStatus: to, reason, actorId } });
    await t.auditLog.create({
      data: { actorId, action: "order.status", entity: "order", entityId: order.id, changes: { number, from: order.status, to } },
    });
    if (extra) await extra(t, order.id);
    return order;
  });
}

export async function setOrderStatus(form: FormData) {
  const number = int(str(form, "number"));
  const to = str(form, "to") as OrderStatus;
  const path = `/admin/pedidos/${number}`;
  const user = await requireAdmin(path);
  if (number === null || !(to === "processing" || to === "delivered" || to === "cancelled")) back("/admin/pedidos", { error: "Solicitud inválida." });

  const reasons = { processing: "Preparando el pedido", delivered: "Entregado al cliente", cancelled: "Cancelado desde el panel" } as const;
  const done = await moveOrder(number!, to, user.id, reasons[to as keyof typeof reasons], async (t, orderId) => {
    if (to === "delivered") await t.shipment.updateMany({ where: { orderId, status: "in_transit" }, data: { status: "delivered" } });
  });
  revalidatePath("/admin", "layout");
  back(path, done ? { ok: "Estado actualizado." } : { error: "El pedido cambió de estado o ya no admite ese cambio. Revisa e intenta de nuevo." });
}

export async function shipOrder(form: FormData) {
  const number = int(str(form, "number"));
  const path = `/admin/pedidos/${number}`;
  const user = await requireAdmin(path);
  const carrier = str(form, "carrier").slice(0, 80);
  const trackingNumber = str(form, "trackingNumber").slice(0, 80);
  const trackingUrl = str(form, "trackingUrl").slice(0, 500);
  if (number === null) back("/admin/pedidos", { error: "Solicitud inválida." });
  if (carrier.length < 2 || trackingNumber.length < 3) back(path, { error: "Escribe la transportadora y el número de guía." });
  if (trackingUrl && !/^https:\/\/\S+$/i.test(trackingUrl)) back(path, { error: "El enlace de rastreo debe empezar por https://" });

  const done = await moveOrder(number!, "shipped", user.id, `Enviado con ${carrier}, guía ${trackingNumber}`, async (t, orderId) => {
    await t.shipment.create({ data: { orderId, carrier, trackingNumber, trackingUrl: trackingUrl || null, status: "in_transit" } });
  });
  revalidatePath("/admin", "layout");
  if (!done) back(path, { error: "El pedido ya no se puede marcar como enviado. Revisa su estado." });

  // El correo sale después de guardar: si falla, el envío queda registrado igual y se avisa en el panel.
  const order = await (await db()).order.findUnique({ where: { number: number! }, include: { items: true } });
  const sent = order ? await sendShippedEmail(order, { carrier, trackingNumber, trackingUrl }) : false;
  back(path, sent ? { ok: "Pedido enviado. Le avisamos al cliente por correo." } : { ok: "Pedido marcado como enviado.", error: "No se pudo enviar el correo al cliente: avísale por WhatsApp." });
}

// ───────────── Productos ─────────────

export async function updateVariant(form: FormData) {
  const user = await requireAdmin("/admin/productos");
  const sku = str(form, "sku");
  const price = int(str(form, "price"));
  const compareRaw = str(form, "compareAt");
  const compareAt = compareRaw ? int(compareRaw) : 0;
  const stock = int(str(form, "stock"));
  const path = "/admin/productos";

  if (!sku || price === null || compareAt === null || stock === null) back(path, { error: `${sku}: revisa los números (solo dígitos).` });
  if (price! > MAX_PRICE_PESOS || compareAt! > MAX_PRICE_PESOS || stock! > MAX_STOCK) back(path, { error: `${sku}: el valor es demasiado alto.` });
  if (compareAt! > 0 && compareAt! <= price!) back(path, { error: `${sku}: el precio anterior debe ser mayor que el precio actual (o déjalo vacío).` });

  const ok = await (await db()).$transaction(async (t) => {
    const v = await t.productVariant.findUnique({ where: { sku }, include: { inventory: true } });
    if (!v) return false;
    const before = { priceCents: v.priceCents, compareAtCents: v.compareAtCents, onHand: v.inventory?.onHand ?? 0 };
    const after = { priceCents: price! * 100, compareAtCents: compareAt! > 0 ? compareAt! * 100 : null, onHand: stock! };
    await t.productVariant.update({ where: { id: v.id }, data: { priceCents: after.priceCents, compareAtCents: after.compareAtCents } });
    const inv = await t.inventoryItem.upsert({
      where: { variantId: v.id },
      update: { onHand: after.onHand, version: { increment: 1 } },
      create: { variantId: v.id, onHand: after.onHand },
    });
    const delta = after.onHand - before.onHand;
    if (delta !== 0) await t.stockMovement.create({ data: { inventoryItemId: inv.id, delta, reason: "Ajuste manual en el panel", actorId: user.id } });
    await t.auditLog.create({ data: { actorId: user.id, action: "variant.update", entity: "product_variant", entityId: v.id, changes: { sku, before, after } } });
    return true;
  });
  if (!ok) back(path, { error: `No existe el producto ${sku}.` });
  // Las páginas de la tienda se regeneran con los datos nuevos (solo se nota con CATALOG_SOURCE=db).
  revalidatePath("/", "layout");
  back(path, { ok: `${sku} actualizado.` });
}

export async function updateFeatured(form: FormData) {
  const user = await requireAdmin("/admin/productos");
  const slug = str(form, "slug");
  const raw = str(form, "rank");
  const rank = raw ? int(raw) : null;
  const path = "/admin/productos";
  if (!slug || (raw && (rank === null || rank < 1 || rank > 99))) back(path, { error: "El orden de destacado va de 1 a 99 (vacío = no destacado)." });

  const found = await (await db()).$transaction(async (t) => {
    const p = await t.product.findUnique({ where: { slug }, select: { id: true, featuredRank: true } });
    if (!p) return false;
    await t.product.update({ where: { id: p.id }, data: { featuredRank: rank } });
    await t.auditLog.create({
      data: { actorId: user.id, action: "product.featured", entity: "product", entityId: p.id, changes: { slug, from: p.featuredRank, to: rank } },
    });
    return true;
  });
  if (!found) back(path, { error: "Producto no encontrado." });
  revalidatePath("/", "layout");
  back(path, { ok: rank ? `Destacado en la posición ${rank}.` : "Ya no está destacado." });
}
