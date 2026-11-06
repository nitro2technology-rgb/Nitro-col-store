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
  from: OrderStatus[] = ALLOWED_FROM[to] ?? [],
) {
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

/** Una entrada por línea, separada por `sep` ("Clave: valor"); conserva el orden. null si alguna línea no cumple. */
function parsePairs(text: string, sep: RegExp) {
  const out: [string, string][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = sep.exec(line);
    if (!m) return null;
    const k = line.slice(0, m.index).trim();
    const v = line.slice(m.index + m[0].length).trim();
    if (!k || !v) return null;
    out.push([k.slice(0, 120), v.slice(0, 600)]);
  }
  return out;
}

const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

export async function updateProduct(form: FormData) {
  const slug = str(form, "slug");
  const path = `/admin/productos/${slug}`;
  const user = await requireAdmin(path);
  const name = str(form, "name").slice(0, 120);
  const tagline = str(form, "tagline").slice(0, 200);
  const description = str(form, "description").slice(0, 5000);
  const status = str(form, "status");
  const rankRaw = str(form, "rank");
  const rank = rankRaw ? int(rankRaw) : null;
  const tags = [...new Set(str(form, "tags").split(",").map((t) => t.trim().slice(0, 40)).filter(Boolean))].slice(0, 20);
  const videoUrl = str(form, "videoUrl").slice(0, 500);
  const specs = parsePairs(str(form, "specs"), /:\s*/);
  const highlights = parsePairs(str(form, "highlights"), /\s*\|\s*/);
  const inBox = lines(str(form, "inBox")).map((l) => l.slice(0, 200)).slice(0, 30);

  if (name.length < 2 || description.length < 10) back(path, { error: "El nombre y la descripción son obligatorios (descripción de 10 letras o más)." });
  if (status !== "published" && status !== "draft") back(path, { error: "Disponibilidad inválida." });
  if (rankRaw && (rank === null || rank < 1 || rank > 99)) back(path, { error: "El orden de destacado va de 1 a 99 (vacío = no destacado)." });
  if (videoUrl && !/^(https:\/\/|\/)\S+$/i.test(videoUrl)) back(path, { error: "El video debe ser un enlace https:// o una ruta que empiece por /." });
  if (!specs) back(path, { error: "Especificaciones: una por línea con el formato «Nombre: valor»." });
  if (!highlights) back(path, { error: "Lo principal: una por línea con el formato «Título | texto»." });

  const after = {
    name,
    tagline: tagline || null,
    description,
    status: status as "published" | "draft",
    featuredRank: rank,
    tags,
    videoUrl: videoUrl || null,
    specs: Object.fromEntries(specs!),
    highlights: highlights!.map(([title, body]) => ({ title, body })),
    inBox,
  };
  const found = await (await db()).$transaction(async (t) => {
    const p = await t.product.findUnique({ where: { slug } });
    if (!p) return false;
    await t.product.update({ where: { id: p.id }, data: after });
    const before = Object.fromEntries(Object.keys(after).map((k) => [k, p[k as keyof typeof p]]));
    await t.auditLog.create({
      data: { actorId: user.id, action: "product.update", entity: "product", entityId: p.id, changes: JSON.parse(JSON.stringify({ slug, before, after })) },
    });
    return true;
  });
  if (!found) back("/admin/productos", { error: "Producto no encontrado." });
  revalidatePath("/", "layout");
  back(path, { ok: after.status === "published" ? "Producto guardado." : "Producto guardado. Está oculto: no aparece en la tienda." });
}

export async function updateVariant(form: FormData) {
  const slug = str(form, "slug");
  const path = `/admin/productos/${slug}`;
  const user = await requireAdmin(path);
  const sku = str(form, "sku");
  const label = str(form, "label").slice(0, 60);
  const regular = int(str(form, "price"));
  const offerRaw = str(form, "offer");
  const offer = offerRaw ? int(offerRaw) : 0;
  const costRaw = str(form, "cost");
  const cost = costRaw ? int(costRaw) : null;
  const stock = int(str(form, "stock"));
  const lowAt = int(str(form, "lowAt") || "3");
  const swatchRaw = str(form, "swatch");
  const swatch = swatchRaw ? swatchRaw.toLowerCase() : null;

  if (swatch !== null && !/^#[0-9a-f]{6}$/.test(swatch)) back(path, { error: `${sku}: el color del círculo no es válido.` });
  if (!sku || label.length < 1) back(path, { error: "Falta el nombre del color o versión." });
  if (regular === null || offer === null || stock === null || lowAt === null || (costRaw && cost === null))
    back(path, { error: `${sku}: revisa los números (solo dígitos, sin decimales).` });
  if (regular! < 1000 || regular! > MAX_PRICE_PESOS || offer! > MAX_PRICE_PESOS || (cost ?? 0) > MAX_PRICE_PESOS || stock! > MAX_STOCK || lowAt! > 1000)
    back(path, { error: `${sku}: algún valor está fuera de rango.` });
  if (offer! > 0 && offer! >= regular!) back(path, { error: `${sku}: el precio de oferta debe ser menor que el precio normal (o déjalo vacío).` });

  // En la tienda, priceCents es lo que se cobra y compareAtCents el precio tachado.
  const charged = offer! > 0 ? offer! : regular!;
  const ok = await (await db()).$transaction(async (t) => {
    const v = await t.productVariant.findUnique({ where: { sku }, include: { inventory: true, product: { select: { slug: true } } } });
    if (!v || v.product.slug !== slug) return false;
    const before = {
      label: v.label,
      swatch: v.swatch,
      priceCents: v.priceCents,
      compareAtCents: v.compareAtCents,
      unitCostCents: v.inventory?.unitCostCents ?? null,
      onHand: v.inventory?.onHand ?? 0,
      lowStockAt: v.inventory?.lowStockAt ?? null,
    };
    const after = {
      label,
      swatch,
      priceCents: charged * 100,
      compareAtCents: offer! > 0 ? regular! * 100 : null,
      unitCostCents: cost === null ? null : cost * 100,
      onHand: stock!,
      lowStockAt: lowAt!,
    };
    await t.productVariant.update({ where: { id: v.id }, data: { label, swatch, priceCents: after.priceCents, compareAtCents: after.compareAtCents } });
    const inv = await t.inventoryItem.upsert({
      where: { variantId: v.id },
      update: { onHand: after.onHand, unitCostCents: after.unitCostCents, lowStockAt: after.lowStockAt, version: { increment: 1 } },
      create: { variantId: v.id, onHand: after.onHand, unitCostCents: after.unitCostCents, lowStockAt: after.lowStockAt },
    });
    const delta = after.onHand - before.onHand;
    if (delta !== 0) await t.stockMovement.create({ data: { inventoryItemId: inv.id, delta, reason: "Ajuste manual en el panel", actorId: user.id } });
    await t.auditLog.create({ data: { actorId: user.id, action: "variant.update", entity: "product_variant", entityId: v.id, changes: { sku, before, after } } });
    return true;
  });
  if (!ok) back(path, { error: `No existe ${sku} en este producto.` });
  // Las páginas de la tienda se regeneran con los datos nuevos (solo se nota con CATALOG_SOURCE=db).
  revalidatePath("/", "layout");
  back(path, { ok: `${label} (${sku}) guardado.` });
}

// ───────────── Devoluciones ─────────────

const RETURN_KINDS = ["retracto", "garantia", "otro"];

export async function createReturn(form: FormData) {
  const number = int(str(form, "number"));
  const path = `/admin/pedidos/${number}`;
  const user = await requireAdmin(path);
  const kind = str(form, "kind");
  const reason = str(form, "reason").slice(0, 1000);
  if (number === null) back("/admin/pedidos", { error: "Solicitud inválida." });
  if (!RETURN_KINDS.includes(kind)) back(path, { error: "Elige el tipo de devolución." });
  if (reason.length < 3) back(path, { error: "Escribe el motivo de la devolución." });

  const order = await (await db()).order.findUnique({ where: { number: number! }, include: { items: true } });
  if (!order) back("/admin/pedidos", { error: "Pedido no encontrado." });
  const items = order!.items
    .map((i) => ({ variantId: i.variantId, sku: i.sku, name: i.name, quantity: Math.min(int(str(form, `qty-${i.id}`)) ?? 0, i.quantity) }))
    .filter((i) => i.quantity > 0);
  if (items.length === 0) back(path, { error: "Indica cuántas unidades devuelve de al menos un producto." });

  const done = await moveOrder(
    number!,
    "return_requested",
    user.id,
    `Devolución (${kind}): ${reason}`,
    async (t, orderId) => {
      const r = await t.orderReturn.create({ data: { orderId, kind, reason, items, actorId: user.id } });
      await t.auditLog.create({ data: { actorId: user.id, action: "return.create", entity: "order_return", entityId: r.id, changes: { number, kind, items } } });
    },
    ["delivered", "shipped"],
  );
  revalidatePath("/admin", "layout");
  if (!done) back(path, { error: "Solo se registran devoluciones de pedidos enviados o entregados (y sin otra devolución abierta)." });
  back("/admin/devoluciones", { ok: `Devolución de NC-${number} registrada. Cuando recibas el producto, márcalo aquí.` });
}

type ReturnLine = { variantId: string; sku: string; name: string; quantity: number };

/** Cambia una devolución de estado solo si sigue en el estado esperado, y mueve el pedido en la misma transacción. */
async function moveReturn(
  id: string,
  from: "requested" | "received",
  to: "received" | "refunded" | "rejected",
  actorId: string,
  orderTo: OrderStatus,
  orderFrom: OrderStatus[],
  data: Prisma.OrderReturnUpdateManyMutationInput,
  extra?: (t: Prisma.TransactionClient, items: ReturnLine[]) => Promise<void>,
) {
  try {
    return await (await db()).$transaction(async (t) => {
      const r = await t.orderReturn.findUnique({ where: { id }, include: { order: { select: { id: true, number: true, status: true } } } });
      if (!r || r.status !== from || !orderFrom.includes(r.order.status)) return null;
      const moved = await t.orderReturn.updateMany({ where: { id, status: from }, data: { ...data, status: to } });
      const orderMoved = await t.order.updateMany({ where: { id: r.order.id, status: r.order.status }, data: { status: orderTo } });
      // Alguien la cambió al mismo tiempo: se deshace todo.
      if (moved.count === 0 || orderMoved.count === 0) throw new Error("conflicto");
      const reason = { received: "Devolución recibida", refunded: "Devolución cerrada", rejected: "Devolución rechazada" }[to];
      await t.orderStatusHistory.create({ data: { orderId: r.order.id, fromStatus: r.order.status, toStatus: orderTo, reason, actorId } });
      await t.auditLog.create({
        data: { actorId, action: `return.${to}`, entity: "order_return", entityId: id, changes: JSON.parse(JSON.stringify({ number: r.order.number, ...data }, (_k, v) => (typeof v === "bigint" ? Number(v) : v))) },
      });
      if (extra) await extra(t, r.items as ReturnLine[]);
      return r;
    });
  } catch {
    return null;
  }
}

export async function receiveReturn(form: FormData) {
  const user = await requireAdmin("/admin/devoluciones");
  const id = str(form, "id");
  const restock = form.get("restock") === "on";
  const notes = str(form, "notes").slice(0, 1000);
  const done = await moveReturn(id, "requested", "received", user.id, "returned", ["return_requested"], { restocked: restock, ...(notes ? { notes } : {}) }, async (t, items) => {
    if (!restock) return;
    for (const i of items) {
      const inv = await t.inventoryItem.upsert({
        where: { variantId: i.variantId },
        update: { onHand: { increment: i.quantity }, version: { increment: 1 } },
        create: { variantId: i.variantId, onHand: i.quantity },
      });
      await t.stockMovement.create({ data: { inventoryItemId: inv.id, delta: i.quantity, reason: "Devolución recibida en buen estado", actorId: user.id } });
    }
  });
  revalidatePath(restock ? "/" : "/admin", "layout");
  back("/admin/devoluciones", done ? { ok: restock ? "Recibida. Las unidades volvieron al inventario." : "Recibida (sin volver al inventario)." } : { error: "La devolución ya cambió de estado." });
}

export async function closeReturn(form: FormData) {
  const user = await requireAdmin("/admin/devoluciones");
  const id = str(form, "id");
  const amount = int(str(form, "refund") || "0");
  const notes = str(form, "notes").slice(0, 1000);
  if (amount === null || amount > MAX_PRICE_PESOS) back("/admin/devoluciones", { error: "Escribe el valor reembolsado en pesos (0 si fue cambio o reparación)." });
  const r = await (await db()).orderReturn.findUnique({ where: { id }, include: { order: { select: { totalCents: true } } } });
  if (r && BigInt(amount!) * 100n > r.order.totalCents) back("/admin/devoluciones", { error: "El reembolso no puede ser mayor que el total del pedido." });
  // Con reembolso el pedido queda "Reembolsado"; sin reembolso (cambio o reparación) la venta se mantiene y vuelve a "Entregado".
  const orderTo: OrderStatus = amount! > 0 ? "refunded" : "delivered";
  const done = await moveReturn(id, "received", "refunded", user.id, orderTo, ["returned"], { refundCents: BigInt(amount!) * 100n, ...(notes ? { notes } : {}) });
  revalidatePath("/admin", "layout");
  back(
    "/admin/devoluciones",
    done ? { ok: amount! > 0 ? "Reembolso anotado. Recuerda hacerlo en Wompi o por transferencia." : "Devolución cerrada sin reembolso." } : { error: "La devolución ya cambió de estado." },
  );
}

export async function rejectReturn(form: FormData) {
  const user = await requireAdmin("/admin/devoluciones");
  const id = str(form, "id");
  const notes = str(form, "notes").slice(0, 1000);
  if (notes.length < 3) back("/admin/devoluciones", { error: "Escribe por qué se rechaza (queda en el historial)." });
  const done = await moveReturn(id, "requested", "rejected", user.id, "delivered", ["return_requested"], { notes });
  revalidatePath("/admin", "layout");
  back("/admin/devoluciones", done ? { ok: "Devolución rechazada; el pedido vuelve a Entregado." } : { error: "La devolución ya cambió de estado." });
}

// ───────────── Fotos ─────────────

const MAX_PHOTOS_PER_SEND = 3;

/** Sube hasta 3 fotos a un grupo: principales de un color (card), galería de un color (gallery) o generales del producto. */
export async function uploadPhotos(form: FormData) {
  const slug = str(form, "slug");
  const path = `/admin/productos/${slug}`;
  const user = await requireAdmin(path);
  const sku = str(form, "sku");
  const kind = str(form, "kind") === "card" ? "card" : "gallery";
  const { storageConfigured, uploadPhoto, MAX_FILE_BYTES } = await import("@/lib/storage");
  if (!storageConfigured()) back(path, { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para poder subir fotos." });

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) back(path, { error: "Elige al menos una foto." });
  if (files.length > MAX_PHOTOS_PER_SEND) back(path, { error: `Sube máximo ${MAX_PHOTOS_PER_SEND} fotos por vez.` });
  if (files.some((f) => f.size > MAX_FILE_BYTES)) back(path, { error: "Cada foto debe pesar menos de 8 MB." });

  const d = await db();
  const product = await d.product.findUnique({
    where: { slug },
    select: { id: true, name: true, variants: { where: { deletedAt: null }, select: { id: true, sku: true, label: true } } },
  });
  if (!product) back("/admin/productos", { error: "Producto no encontrado." });
  const variant = sku ? product!.variants.find((v) => v.sku === sku) : undefined;
  if (sku && !variant) back(path, { error: "Color no encontrado." });

  let done = 0;
  try {
    for (const f of files) {
      const url = await uploadPhoto(Buffer.from(await f.arrayBuffer()), slug);
      const last = await d.productImage.aggregate({ where: { productId: product!.id }, _max: { position: true } });
      const img = await d.productImage.create({
        data: {
          productId: product!.id,
          variantId: variant?.id ?? null,
          url,
          alt: variant ? `${product!.name} ${variant.label}` : product!.name,
          kind: variant ? kind : "gallery",
          position: (last._max.position ?? -1) + 1,
        },
      });
      await d.auditLog.create({
        data: { actorId: user.id, action: "photo.add", entity: "product_image", entityId: img.id, changes: { slug, sku: sku || null, kind: img.kind, url } },
      });
      done++;
    }
  } catch (e) {
    console.error("[fotos] subida", e);
    revalidatePath("/", "layout");
    back(path, { error: `No se pudo subir la foto${done ? ` (se subieron ${done})` : ""}. Revisa que sea JPG, PNG o WebP.` });
  }
  revalidatePath("/", "layout");
  back(path, { ok: done === 1 ? "Foto subida." : `${done} fotos subidas.` });
}

export async function deletePhotoAction(form: FormData) {
  const slug = str(form, "slug");
  const path = `/admin/productos/${slug}`;
  const user = await requireAdmin(path);
  const d = await db();
  const img = await d.productImage.findFirst({ where: { id: str(form, "id"), product: { slug } } });
  if (!img) back(path, { error: "La foto ya no existe." });
  await d.productImage.delete({ where: { id: img!.id } });
  await d.auditLog.create({
    data: { actorId: user.id, action: "photo.delete", entity: "product_image", entityId: img!.id, changes: { slug, url: img!.url } },
  });
  try {
    const { deletePhoto } = await import("@/lib/storage");
    await deletePhoto(img!.url);
  } catch (e) {
    console.error("[fotos] borrar archivo", e);
  }
  revalidatePath("/", "layout");
  back(path, { ok: "Foto eliminada." });
}

/** Sube o baja una foto dentro de su grupo (mismo color y tipo, o las generales). */
export async function movePhoto(form: FormData) {
  const slug = str(form, "slug");
  const path = `/admin/productos/${slug}`;
  const user = await requireAdmin(path);
  const dir = str(form, "dir") === "up" ? -1 : 1;
  const d = await db();
  const img = await d.productImage.findFirst({ where: { id: str(form, "id"), product: { slug } } });
  if (!img) back(path, { error: "La foto ya no existe." });
  const group = await d.productImage.findMany({
    where: { productId: img!.productId, variantId: img!.variantId, kind: img!.kind },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const i = group.findIndex((g) => g.id === img!.id);
  const j = i + dir;
  if (j < 0 || j >= group.length) back(path, {});
  [group[i], group[j]] = [group[j]!, group[i]!];
  await d.$transaction(group.map((g, n) => d.productImage.update({ where: { id: g.id }, data: { position: n } })));
  await d.auditLog.create({
    data: { actorId: user.id, action: "photo.move", entity: "product_image", entityId: img!.id, changes: { slug, dir } },
  });
  revalidatePath("/", "layout");
  back(path, { ok: "Orden actualizado." });
}

// ───────────── Productos y colores nuevos ─────────────

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** Código único para un color: prefijo del producto + número (ej. AURAFIT-03). */
async function nextSku(t: Prisma.TransactionClient, slug: string) {
  const prefix = slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "PROD";
  for (let n = 1; n < 1000; n++) {
    const sku = `${prefix}-${String(n).padStart(2, "0")}`;
    if (!(await t.productVariant.findUnique({ where: { sku }, select: { id: true } }))) return sku;
  }
  throw new Error("Sin códigos libres");
}

type VariantInput = { swatch: string | null; label: string; regular: number; offer: number; cost: number | null; stock: number; lowAt: number; weight: number };

/** Lee y valida los campos de un color; devuelve el texto del error si algo está mal. */
function readVariant(form: FormData): VariantInput | string {
  const label = str(form, "label").slice(0, 60);
  const regular = int(str(form, "price"));
  const offerRaw = str(form, "offer");
  const offer = offerRaw ? int(offerRaw) : 0;
  const costRaw = str(form, "cost");
  const cost = costRaw ? int(costRaw) : null;
  const stock = int(str(form, "stock") || "0");
  const lowAt = int(str(form, "lowAt") || "3");
  const weight = int(str(form, "weight") || "200");
  const swatchRaw = str(form, "swatch").toLowerCase();
  if (swatchRaw && !/^#[0-9a-f]{6}$/.test(swatchRaw)) return "El color del círculo no es válido.";
  if (!label) return "Falta el nombre del color o versión.";
  if (regular === null || offer === null || stock === null || lowAt === null || weight === null || (costRaw && cost === null))
    return "Revisa los números (solo dígitos, sin decimales).";
  if (regular < 1000 || regular > MAX_PRICE_PESOS || offer > MAX_PRICE_PESOS || (cost ?? 0) > MAX_PRICE_PESOS || stock > MAX_STOCK || lowAt > 1000 || weight < 1 || weight > 50_000)
    return "Algún valor está fuera de rango.";
  if (offer > 0 && offer >= regular) return "El precio de oferta debe ser menor que el precio normal (o déjalo vacío).";
  return { swatch: swatchRaw || null, label, regular, offer, cost, stock, lowAt, weight };
}

async function createVariant(t: Prisma.TransactionClient, productId: string, slug: string, v: VariantInput, actorId: string) {
  const sku = await nextSku(t, slug);
  const last = await t.productVariant.aggregate({ where: { productId }, _max: { position: true } });
  const row = await t.productVariant.create({
    data: {
      productId,
      sku,
      label: v.label,
      swatch: v.swatch,
      priceCents: (v.offer > 0 ? v.offer : v.regular) * 100,
      compareAtCents: v.offer > 0 ? v.regular * 100 : null,
      weightGrams: v.weight,
      lengthMm: 100,
      widthMm: 100,
      heightMm: 100,
      position: (last._max.position ?? -1) + 1,
      inventory: { create: { onHand: v.stock, lowStockAt: v.lowAt, unitCostCents: v.cost === null ? null : v.cost * 100 } },
    },
    include: { inventory: true },
  });
  if (v.stock > 0)
    await t.stockMovement.create({ data: { inventoryItemId: row.inventory!.id, delta: v.stock, reason: "Stock inicial", actorId } });
  await t.auditLog.create({ data: { actorId, action: "variant.create", entity: "product_variant", entityId: row.id, changes: { sku, ...v } } });
  return sku;
}

export async function createProduct(form: FormData) {
  const user = await requireAdmin("/admin/productos/nuevo");
  const name = str(form, "name").slice(0, 120);
  const description = str(form, "description").slice(0, 5000);
  const tagline = str(form, "tagline").slice(0, 200);
  const brandName = str(form, "brand").slice(0, 80);
  const categoryId = str(form, "category");
  const variant = readVariant(form);
  const fail = (error: string): never => back("/admin/productos/nuevo", { error });
  if (name.length < 2) fail("Escribe el nombre del producto.");
  if (description.length < 10) fail("La descripción debe tener 10 letras o más.");
  if (typeof variant === "string") fail(`Primer color: ${variant}`);
  const v = variant as VariantInput;

  const d = await db();
  const [category, seller] = await Promise.all([
    d.category.findFirst({ where: { id: categoryId, deletedAt: null, children: { none: {} } } }),
    d.seller.findFirst({ orderBy: { createdAt: "asc" } }),
  ]);
  if (!category) fail("Elige una categoría.");
  if (!seller) fail("No hay vendedor configurado en la base.");

  const baseSlug = slugify(name);
  if (!baseSlug) fail("El nombre debe tener letras o números.");
  const created = await d.$transaction(async (t) => {
    let slug = baseSlug;
    for (let n = 2; await t.product.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${baseSlug}-${n}`;
    let brand = brandName ? await t.brand.findFirst({ where: { name: { equals: brandName, mode: "insensitive" } } }) : null;
    if (brandName && !brand) {
      const bs = slugify(brandName) || "marca";
      let slugB = bs;
      for (let n = 2; await t.brand.findUnique({ where: { slug: slugB }, select: { id: true } }); n++) slugB = `${bs}-${n}`;
      brand = await t.brand.create({ data: { name: brandName, slug: slugB } });
    }
    const p = await t.product.create({
      data: {
        name,
        slug,
        tagline: tagline || null,
        description,
        status: "draft",
        sellerId: seller!.id,
        brandId: brand?.id ?? null,
        categories: { create: { categoryId: category!.id } },
      },
    });
    await createVariant(t, p.id, slug, v, user.id);
    await t.auditLog.create({ data: { actorId: user.id, action: "product.create", entity: "product", entityId: p.id, changes: { slug, name } } });
    return slug;
  });
  revalidatePath("/", "layout");
  back(`/admin/productos/${created}`, { ok: "Producto creado. Está oculto: sube las fotos, revisa los datos y cámbialo a «Visible en la tienda»." });
}

export async function addVariant(form: FormData) {
  const slug = str(form, "slug");
  const path = `/admin/productos/${slug}`;
  const user = await requireAdmin(path);
  const v = readVariant(form);
  if (typeof v === "string") return back(path, { error: `Color nuevo: ${v}` });
  const d = await db();
  const sku = await d.$transaction(async (t) => {
    const p = await t.product.findUnique({ where: { slug }, select: { id: true } });
    return p ? createVariant(t, p.id, slug, v, user.id) : null;
  });
  if (!sku) return back("/admin/productos", { error: "Producto no encontrado." });
  revalidatePath("/", "layout");
  back(path, { ok: `Color «${v.label}» agregado (${sku}). Ahora sube sus fotos.` });
}

/** Quita un color de la tienda (no borra el historial: los pedidos viejos lo conservan). No se puede quitar el último. */
export async function removeVariant(form: FormData) {
  const slug = str(form, "slug");
  const path = `/admin/productos/${slug}`;
  const user = await requireAdmin(path);
  const sku = str(form, "sku");
  const d = await db();
  const res = await d.$transaction(async (t) => {
    const v = await t.productVariant.findFirst({ where: { sku, deletedAt: null, product: { slug } } });
    if (!v) return "Ese color ya no existe.";
    const left = await t.productVariant.count({ where: { productId: v.productId, deletedAt: null } });
    if (left <= 1) return "No puedes quitar el único color. Si no quieres vender el producto, ponlo como «Oculto».";
    await t.productVariant.update({ where: { id: v.id }, data: { deletedAt: new Date() } });
    await t.auditLog.create({ data: { actorId: user.id, action: "variant.delete", entity: "product_variant", entityId: v.id, changes: { sku, label: v.label } } });
    return null;
  });
  revalidatePath("/", "layout");
  back(path, res ? { error: res } : { ok: `Color ${sku} quitado.` });
}

// ───────────── Categorías ─────────────

/** Crea una subcategoría dentro de Moda o Tecnología. Hereda el diseño del padre (portada, lista por color, ficha corta). */
export async function createCategory(form: FormData) {
  const path = "/admin/categorias";
  const user = await requireAdmin(path);
  const name = str(form, "name").slice(0, 60);
  const parentSlug = str(form, "parent");
  const { categories, allCategorySlugs } = await import("@/lib/products");
  if (name.length < 2) back(path, { error: "Escribe el nombre de la categoría." });
  if (!categories.some((c) => c.slug === parentSlug)) back(path, { error: "Elige dentro de qué categoría va (Moda o Tecnología)." });
  const slug = slugify(name);
  if (!slug) back(path, { error: "El nombre debe tener letras o números." });
  const d = await db();
  const parent = await d.category.findFirst({ where: { slug: parentSlug, deletedAt: null } });
  if (!parent) back(path, { error: "La categoría padre no existe en la base. Corre el seed." });
  if (allCategorySlugs.includes(slug) || (await d.category.findUnique({ where: { slug }, select: { id: true } })))
    back(path, { error: `Ya existe una categoría con la dirección «${slug}». Usa otro nombre.` });
  const last = await d.category.aggregate({ where: { parentId: parent!.id }, _max: { position: true } });
  const c = await d.category.create({
    data: { name, slug, parentId: parent!.id, path: `${parent!.path}/${slug}`, position: (last._max.position ?? -1) + 1 },
  });
  await d.auditLog.create({ data: { actorId: user.id, action: "category.create", entity: "category", entityId: c.id, changes: { name, slug, parent: parentSlug } } });
  revalidatePath("/", "layout");
  back(path, { ok: `Categoría «${name}» creada dentro de ${parent!.name}. Ya puedes crear productos en ella.` });
}

/** Borra una subcategoría creada en el panel, solo si no tiene productos. Las del código no se pueden borrar. */
export async function deleteCategory(form: FormData) {
  const path = "/admin/categorias";
  const user = await requireAdmin(path);
  const { isBuiltInCategory } = await import("@/lib/products");
  const d = await db();
  const c = await d.category.findFirst({ where: { id: str(form, "id"), deletedAt: null }, include: { _count: { select: { products: true, children: true } } } });
  if (!c) back(path, { error: "La categoría ya no existe." });
  if (isBuiltInCategory(c!.slug)) back(path, { error: "Esa categoría viene en el código y no se borra desde el panel." });
  if (c!._count.products > 0 || c!._count.children > 0) back(path, { error: `«${c!.name}» tiene productos: muévelos o ocúltalos antes de borrarla.` });
  await d.category.delete({ where: { id: c!.id } });
  await d.auditLog.create({ data: { actorId: user.id, action: "category.delete", entity: "category", entityId: c!.id, changes: { name: c!.name, slug: c!.slug } } });
  revalidatePath("/", "layout");
  back(path, { ok: `Categoría «${c!.name}» borrada.` });
}

// ───────────── Portadas de categoría ─────────────

export async function saveCover(form: FormData) {
  const path = "/admin/portadas";
  const user = await requireAdmin(path);
  const slug = str(form, "slug");
  const title = str(form, "title").slice(0, 80);
  const subtitle = str(form, "subtitle").slice(0, 140);
  const cta = (str(form, "cta") || "Ver colección").slice(0, 30);
  const { storageConfigured, uploadCoverImage, saveCover: put, removeCoverFiles } = await import("@/lib/storage");
  const { getCover } = await import("@/lib/covers");
  if (!storageConfigured()) back(path, { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para guardar portadas." });
  if (title.length < 2) back(path, { error: "Escribe el título de la portada." });
  const d = await db();
  if (!(await d.category.findFirst({ where: { slug, deletedAt: null }, select: { id: true } }))) back(path, { error: "Categoría no encontrada." });

  const file = (k: string) => {
    const f = form.get(k);
    return f instanceof File && f.size > 0 ? f : null;
  };
  const desktop = file("image");
  const mobile = file("mobile");
  if ((desktop && desktop.size > 12 * 1024 * 1024) || (mobile && mobile.size > 12 * 1024 * 1024)) back(path, { error: "Cada foto debe pesar menos de 12 MB." });

  try {
    const before = await getCover(slug, true);
    const image = desktop ? await uploadCoverImage(Buffer.from(await desktop.arrayBuffer()), slug, 2400) : before?.image;
    const dropMobile = form.get("dropMobile") === "on";
    const mobileImage = mobile ? await uploadCoverImage(Buffer.from(await mobile.arrayBuffer()), slug, 1100) : dropMobile ? undefined : before?.mobileImage;
    await put(slug, { title, subtitle, cta, image, mobileImage });
    // Borra las fotos que se reemplazaron o quitaron.
    await removeCoverFiles(slug, [desktop ? before?.image : undefined, mobile || dropMobile ? before?.mobileImage : undefined], false);
    await d.auditLog.create({ data: { actorId: user.id, action: "cover.save", entity: "category", entityId: slug, changes: { slug, title } } });
  } catch (e) {
    console.error("[portadas] guardar", e);
    back(path, { error: "No se pudo guardar la portada. Revisa que la foto sea JPG, PNG o WebP." });
  }
  revalidatePath("/", "layout");
  back(path, { ok: `Portada de «${title}» guardada.` });
}

export async function removeCover(form: FormData) {
  const path = "/admin/portadas";
  const user = await requireAdmin(path);
  const slug = str(form, "slug");
  const { storageConfigured, removeCoverFiles } = await import("@/lib/storage");
  const { getCover } = await import("@/lib/covers");
  if (!storageConfigured()) back(path, { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." });
  const before = await getCover(slug, true);
  await removeCoverFiles(slug, [before?.image, before?.mobileImage], true);
  await (await db()).auditLog.create({ data: { actorId: user.id, action: "cover.remove", entity: "category", entityId: slug, changes: { slug } } });
  revalidatePath("/", "layout");
  back(path, { ok: "Portada quitada: la página vuelve a su diseño de siempre." });
}
