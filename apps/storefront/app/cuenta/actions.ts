"use server";

// Acciones del cliente en «Mi cuenta». Cada una verifica la sesión y que el pedido sea de esa persona (un formulario
// se puede enviar a mano), valida y cambia la base en una transacción con el estado esperado.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatCOP } from "@nitro/shared";
import { sendCancelledEmail, sendOwnerNotice } from "@/lib/mail";
import { ensureProfile } from "@/lib/profile";
import { canRequestReturn, CANCELLABLE, deliveredAt, RETURN_DAYS } from "@/lib/returns-policy";
import { currentUser } from "@/lib/supabase/server";

const back = (path: string, msg: { ok?: string; error?: string }): never =>
  redirect(`${path}?${new URLSearchParams({ ...(msg as Record<string, string>), v: Date.now().toString(36) }).toString()}`);
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function me(path: string) {
  const user = await currentUser().catch(() => null);
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(path)}`);
  const profile = await ensureProfile(user!);
  if (!profile) back(path, { error: "No pudimos cargar tu cuenta. Intenta de nuevo." });
  const { db } = await import("@nitro/db");
  return { user: user!, profile: profile!, db };
}

// ───────────── Datos y direcciones ─────────────

export async function saveProfileData(form: FormData) {
  const path = "/cuenta";
  const { profile, db } = await me(path);
  const fullName = str(form, "fullName").slice(0, 120);
  const phone = str(form, "phone").slice(0, 20);
  if (fullName.length < 2) back(path, { error: "Escribe tu nombre completo." });
  if (phone && !/^[0-9+() -]{7,20}$/.test(phone)) back(path, { error: "Revisa tu teléfono." });
  await db.profile.update({ where: { id: profile.id }, data: { fullName, phone: phone || null } });
  revalidatePath("/cuenta");
  back(path, { ok: "Datos guardados. Los usaremos para llenar tus próximos pedidos." });
}

export async function saveAddress(form: FormData) {
  const path = "/cuenta";
  const { profile, db } = await me(path);
  const id = str(form, "id");
  const data = {
    fullName: str(form, "fullName").slice(0, 120),
    phone: str(form, "phone").slice(0, 20),
    department: str(form, "department").slice(0, 80),
    city: str(form, "city").slice(0, 80),
    line1: str(form, "line1").slice(0, 200),
    notes: str(form, "notes").slice(0, 300) || null,
  };
  if (data.fullName.length < 2 || data.department.length < 2 || data.city.length < 2 || data.line1.length < 5) back(path, { error: "Completa nombre, departamento, ciudad y dirección." });
  if (!/^[0-9+() -]{7,20}$/.test(data.phone)) back(path, { error: "Revisa el teléfono de la dirección." });
  const count = await db.address.count({ where: { profileId: profile.id } });
  if (id) {
    const done = await db.address.updateMany({ where: { id, profileId: profile.id }, data });
    if (done.count === 0) back(path, { error: "Esa dirección ya no existe." });
  } else {
    if (count >= 10) back(path, { error: "Puedes guardar hasta 10 direcciones. Borra alguna primero." });
    // documentId es obligatorio en la tabla; hoy no se pide el documento, queda vacío.
    await db.address.create({ data: { ...data, documentId: "", profileId: profile.id, isDefault: count === 0 } });
  }
  revalidatePath("/cuenta");
  back(path, { ok: "Dirección guardada." });
}

export async function deleteAddress(form: FormData) {
  const { profile, db } = await me("/cuenta");
  const a = await db.address.findFirst({ where: { id: str(form, "id"), profileId: profile.id } });
  if (a) {
    await db.address.delete({ where: { id: a.id } });
    if (a.isDefault) {
      const next = await db.address.findFirst({ where: { profileId: profile.id }, orderBy: { createdAt: "desc" } });
      if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
  revalidatePath("/cuenta");
  back("/cuenta", { ok: "Dirección borrada." });
}

export async function setDefaultAddress(form: FormData) {
  const { profile, db } = await me("/cuenta");
  const id = str(form, "id");
  const a = await db.address.findFirst({ where: { id, profileId: profile.id }, select: { id: true } });
  if (a) {
    await db.$transaction([
      db.address.updateMany({ where: { profileId: profile.id }, data: { isDefault: false } }),
      db.address.update({ where: { id }, data: { isDefault: true } }),
    ]);
  }
  revalidatePath("/cuenta");
  back("/cuenta", { ok: "Dirección principal cambiada." });
}

// ───────────── Cancelar un pedido (solo si no ha sido enviado) ─────────────

export async function cancelMyOrder(form: FormData) {
  const number = Number(str(form, "number"));
  const path = `/cuenta/pedidos/${number}`;
  const { profile, db } = await me(path);
  if (!Number.isInteger(number)) back("/cuenta", { error: "Solicitud inválida." });

  const result = await db.$transaction(async (t) => {
    const order = await t.order.findFirst({ where: { number, profileId: profile.id }, include: { items: true, payments: true } });
    if (!order || !(CANCELLABLE as readonly string[]).includes(order.status)) return null;
    // Con el estado esperado: si el pedido salió (enviado) en este instante, no se cancela.
    const moved = await t.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: "cancelled" } });
    if (moved.count === 0) return null;
    const paid = order.status !== "pending_payment"; // ya se cobró y se descontó el inventario
    await t.orderStatusHistory.create({
      data: { orderId: order.id, fromStatus: order.status, toStatus: "cancelled", reason: paid ? "Cancelado por el cliente · REEMBOLSO PENDIENTE" : "Cancelado por el cliente", actorId: profile.id },
    });
    await t.auditLog.create({ data: { actorId: profile.id, action: "order.cancel_by_customer", entity: "order", entityId: order.id, changes: { number, from: order.status, refundDue: paid } } });
    if (paid) {
      for (const i of order.items) {
        const inv = await t.inventoryItem.findUnique({ where: { variantId: i.variantId }, select: { id: true } });
        if (!inv) continue;
        await t.inventoryItem.update({ where: { id: inv.id }, data: { onHand: { increment: i.quantity } } });
        await t.stockMovement.create({ data: { inventoryItemId: inv.id, delta: i.quantity, reason: `Pedido NC-${number} cancelado por el cliente`, actorId: profile.id } });
      }
    }
    return { order, paid, method: order.payments[0]?.method ?? "" };
  });
  if (!result) back(path, { error: "Este pedido ya no se puede cancelar (puede que ya haya sido enviado). Escríbenos por WhatsApp." });

  const { order, paid, method } = result!;
  await sendCancelledEmail(order, paid);
  if (paid) {
    await sendOwnerNotice(
      `REEMBOLSO PENDIENTE · NC-${number} cancelado · ${formatCOP(Number(order.totalCents))}`,
      `El cliente canceló NC-${number}: devolver ${formatCOP(Number(order.totalCents))}`,
      `<p style="line-height:1.5">El pedido ya estaba pagado (medio: ${esc(method)}). Las unidades volvieron al inventario. Devuelve el dinero desde Wompi o por transferencia y luego marca el pedido como «Reembolsado» en el panel.</p><p>Cliente: ${esc(order.email)} · ${esc(order.phone)}</p>`,
      order.email,
    );
  }
  revalidatePath("/", "layout");
  back(path, { ok: paid ? "Pedido cancelado. Te devolveremos el dinero y te avisaremos por correo o WhatsApp." : "Pedido cancelado. No se cobró nada." });
}

// ───────────── Pedir una devolución (hasta 5 días después de entregado) ─────────────

export async function requestMyReturn(form: FormData) {
  const number = Number(str(form, "number"));
  const path = `/cuenta/pedidos/${number}`;
  const { profile, db } = await me(path);
  const itemId = str(form, "itemId");
  const kind = str(form, "kind");
  const reason = str(form, "reason").slice(0, 1000);
  const qty = Number(str(form, "qty"));
  if (!Number.isInteger(number)) back("/cuenta", { error: "Solicitud inválida." });
  if (!["retracto", "garantia", "otro"].includes(kind)) back(path, { error: "Elige el motivo de la devolución." });
  if (reason.length < 5) back(path, { error: "Cuéntanos qué pasó (mínimo 5 letras)." });
  if (!Number.isInteger(qty) || qty < 1) back(path, { error: "Indica cuántas unidades devuelves." });

  const result = await db.$transaction(async (t) => {
    const order = await t.order.findFirst({ where: { number, profileId: profile.id }, include: { items: true, history: true, returns: true } });
    if (!order || order.status !== "delivered") return { error: "Solo se pide devolución de pedidos entregados y sin otra devolución abierta." };
    if (!canRequestReturn(deliveredAt(order.history, order.updatedAt))) return { error: `Pasaron más de ${RETURN_DAYS} días desde la entrega: ya no se puede pedir devolución por aquí. Escríbenos por WhatsApp.` };
    const item = order.items.find((i) => i.id === itemId);
    if (!item) return { error: "Ese producto no es de este pedido." };
    const already = order.returns
      .filter((r) => r.status !== "rejected")
      .flatMap((r) => r.items as { variantId: string; quantity: number }[])
      .filter((i) => i.variantId === item.variantId)
      .reduce((s, i) => s + i.quantity, 0);
    if (qty > item.quantity - already) return { error: "Ya pediste la devolución de esas unidades." };

    const moved = await t.order.updateMany({ where: { id: order.id, status: "delivered" }, data: { status: "return_requested" } });
    if (moved.count === 0) return { error: "Este pedido cambió de estado. Recarga la página." };
    const items = [{ variantId: item.variantId, sku: item.sku, name: item.name, quantity: qty }];
    const r = await t.orderReturn.create({ data: { orderId: order.id, kind, reason, items, actorId: profile.id } });
    await t.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: "delivered", toStatus: "return_requested", reason: `Devolución pedida por el cliente (${kind}): ${reason}`, actorId: profile.id } });
    await t.auditLog.create({ data: { actorId: profile.id, action: "return.create_by_customer", entity: "order_return", entityId: r.id, changes: { number, kind, items } } });
    return { ok: true as const, email: order.email, phone: order.phone, itemName: item.name };
  });
  if ("error" in result) back(path, { error: result.error });

  const done = result as { ok: true; email: string; phone: string; itemName: string };
  await sendOwnerNotice(
    `Devolución pedida · NC-${number}`,
    `El cliente pidió devolver ${qty} × ${done.itemName} (NC-${number})`,
    `<p style="line-height:1.5"><b>Tipo:</b> ${esc(kind)}<br><b>Motivo:</b> ${esc(reason)}</p><p>Cliente: ${esc(done.email)} · ${esc(done.phone)}</p><p>Contáctalo para coordinar la entrega del producto y luego sigue el trámite en el panel → Devoluciones.</p>`,
    done.email,
  );
  revalidatePath("/", "layout");
  back(path, { ok: "Pedimos la devolución. Te escribiremos pronto para coordinar cómo nos llega el producto." });
}
