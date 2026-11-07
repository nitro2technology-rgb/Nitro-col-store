"use server";

// Acciones del panel. Cada una verifica de nuevo que quien la llama es administrador (un formulario se puede
// enviar a mano), valida los datos, cambia la base en una transacción y deja rastro en historial y auditoría.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OrderStatus, Prisma } from "@nitro/db";
import { requireAdmin } from "@/lib/admin";
import { sendDeliveredEmail, sendShippedEmail } from "@/lib/mail";

const MAX_PRICE_PESOS = 50_000_000;
const MAX_STOCK = 100_000;

/** Desde qué estados se puede llegar a cada estado. Lo que no está aquí no se puede hacer desde el panel. */
const ALLOWED_FROM: Partial<Record<OrderStatus, OrderStatus[]>> = {
  processing: ["paid"],
  shipped: ["paid", "processing"],
  delivered: ["shipped", "paid", "processing"], // las ventas por fuera de la página no llevan guía
  cancelled: ["pending_payment"],
};

// `v` cambia en cada redirección: las páginas con formularios la usan como `key` para que se reinicien por completo
// (campos vacíos, botón de guardar bloqueado hasta el próximo cambio).
const back = (path: string, msg: { ok?: string; error?: string }): never =>
  redirect(`${path}?${new URLSearchParams({ ...(msg as Record<string, string>), v: Date.now().toString(36) }).toString()}`);

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
  if (done && to === "delivered") {
    // Al marcar entregado, el cliente recibe el correo de agradecimiento (si dejó correo).
    const order = await (await db()).order.findUnique({ where: { number: number! }, include: { items: true } });
    const sent = order ? await sendDeliveredEmail(order) : false;
    back(path, { ok: sent ? "Pedido entregado. Le enviamos el correo de agradecimiento al cliente." : "Pedido entregado." });
  }
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

/** Error de validación del formulario: se muestra al administrador y no se guarda nada. */
class Fail extends Error {}
const fail = (message: string): never => {
  throw new Fail(message);
};

function parseInfo(form: FormData) {
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

  if (name.length < 2 || description.length < 10) fail("El nombre y la descripción son obligatorios (descripción de 10 letras o más).");
  if (status !== "published" && status !== "draft") fail("Disponibilidad inválida.");
  if (rankRaw && (rank === null || rank < 1 || rank > 99)) fail("El orden de destacado va de 1 a 99 (vacío = no destacado).");
  if (videoUrl && !/^(https:\/\/|\/)\S+$/i.test(videoUrl)) fail("El video debe ser un enlace https:// o una ruta que empiece por /.");
  if (!specs) fail("Especificaciones: una por línea con el formato «Nombre: valor».");
  if (!highlights) fail("Lo principal: una por línea con el formato «Título | texto».");

  return {
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
}

/** Datos de un color dentro del formulario único (campos `v__<sku>__<campo>`). */
function parseVariant(form: FormData, sku: string) {
  const g = (f: string) => str(form, `v__${sku}__${f}`);
  const label = g("label").slice(0, 60);
  const regular = int(g("price"));
  const offerRaw = g("offer");
  const offer = offerRaw ? int(offerRaw) : 0;
  const costRaw = g("cost");
  const cost = costRaw ? int(costRaw) : null;
  const stock = int(g("stock"));
  const lowAt = int(g("lowAt") || "3");
  const swatchRaw = g("swatch");
  const swatch = swatchRaw ? swatchRaw.toLowerCase() : null;

  if (swatch !== null && !/^#[0-9a-f]{6}$/.test(swatch)) fail(`${sku}: el color del círculo no es válido.`);
  if (label.length < 1) fail(`${sku}: falta el nombre del color o versión.`);
  if (regular === null || offer === null || stock === null || lowAt === null || (costRaw && cost === null))
    fail(`${sku}: revisa los números (solo dígitos, sin decimales).`);
  if (regular! < 1000 || regular! > MAX_PRICE_PESOS || offer! > MAX_PRICE_PESOS || (cost ?? 0) > MAX_PRICE_PESOS || stock! > MAX_STOCK || lowAt! > 1000)
    fail(`${sku}: algún valor está fuera de rango.`);
  if (offer! > 0 && offer! >= regular!) fail(`${sku}: el precio de oferta debe ser menor que el precio normal (o déjalo vacío).`);

  // En la tienda, priceCents es lo que se cobra y compareAtCents el precio tachado.
  const charged = offer! > 0 ? offer! : regular!;
  return {
    sku,
    label,
    swatch,
    priceCents: charged * 100,
    compareAtCents: offer! > 0 ? regular! * 100 : null,
    unitCostCents: cost === null ? null : cost * 100,
    onHand: stock!,
    lowStockAt: lowAt!,
  };
}

const MAX_PHOTOS_PER_SEND = 30;

/** Fotos elegidas en el formulario (campos `files__<sku o general>__<card|gallery>`). Vacío si no se eligió ninguna. */
async function parseUploads(form: FormData) {
  const batches: { sku: string; kind: "card" | "gallery"; files: File[] }[] = [];
  for (const key of new Set(form.keys())) {
    const m = /^files__(.*)__(card|gallery)$/.exec(key);
    if (!m) continue;
    const files = form.getAll(key).filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length) batches.push({ sku: m[1] === "general" ? "" : m[1]!, kind: m[2] as "card" | "gallery", files });
  }
  const total = batches.reduce((n, b) => n + b.files.length, 0);
  if (total === 0) return batches;
  const { storageConfigured, MAX_FILE_BYTES } = await import("@/lib/storage");
  if (!storageConfigured()) fail("Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para poder subir fotos.");
  if (total > MAX_PHOTOS_PER_SEND) fail(`Sube máximo ${MAX_PHOTOS_PER_SEND} fotos por vez.`);
  if (batches.some((b) => b.files.some((f) => f.size > MAX_FILE_BYTES))) fail("Cada foto debe pesar menos de 8 MB.");
  return batches;
}

/**
 * Guarda TODO lo de la página de un producto con un solo botón: la información, todos los colores (nombre, círculo,
 * precios, costo, stock) y las fotos elegidas. Primero se revisa todo; si algo está mal no se guarda nada.
 * Los datos se guardan juntos (todo o nada); las fotos se suben después.
 */
export async function saveProduct(form: FormData) {
  const slug = str(form, "slug");
  const path = `/admin/productos/${slug}`;
  const user = await requireAdmin(path);

  let info: ReturnType<typeof parseInfo>;
  let variants: ReturnType<typeof parseVariant>[];
  let batches: Awaited<ReturnType<typeof parseUploads>>;
  try {
    info = parseInfo(form);
    variants = [...new Set(form.getAll("skus").map(String))].map((sku) => parseVariant(form, sku));
    batches = await parseUploads(form);
  } catch (e) {
    if (e instanceof Fail) back(path, { error: e.message });
    throw e;
  }

  const d = await db();
  let changedColors = 0;
  try {
    const found = await d.$transaction(async (t) => {
      const p = await t.product.findUnique({ where: { slug } });
      if (!p) return false;
      const beforeInfo = Object.fromEntries(Object.keys(info).map((k) => [k, p[k as keyof typeof p]]));
      if (JSON.stringify(beforeInfo) !== JSON.stringify(info)) {
        await t.product.update({ where: { id: p.id }, data: info });
        await t.auditLog.create({
          data: { actorId: user.id, action: "product.update", entity: "product", entityId: p.id, changes: JSON.parse(JSON.stringify({ slug, before: beforeInfo, after: info })) },
        });
      }
      for (const nv of variants) {
        const v = await t.productVariant.findUnique({ where: { sku: nv.sku }, include: { inventory: true } });
        if (!v || v.productId !== p.id) fail(`No existe ${nv.sku} en este producto.`);
        const before = {
          label: v!.label,
          swatch: v!.swatch,
          priceCents: v!.priceCents,
          compareAtCents: v!.compareAtCents,
          unitCostCents: v!.inventory?.unitCostCents ?? null,
          onHand: v!.inventory?.onHand ?? 0,
          lowStockAt: v!.inventory?.lowStockAt ?? null,
        };
        const { sku, ...after } = nv;
        if (JSON.stringify(before) === JSON.stringify(after)) continue;
        changedColors++;
        await t.productVariant.update({ where: { id: v!.id }, data: { label: after.label, swatch: after.swatch, priceCents: after.priceCents, compareAtCents: after.compareAtCents } });
        const inv = await t.inventoryItem.upsert({
          where: { variantId: v!.id },
          update: { onHand: after.onHand, unitCostCents: after.unitCostCents, lowStockAt: after.lowStockAt, version: { increment: 1 } },
          create: { variantId: v!.id, onHand: after.onHand, unitCostCents: after.unitCostCents, lowStockAt: after.lowStockAt },
        });
        const delta = after.onHand - before.onHand;
        if (delta !== 0) await t.stockMovement.create({ data: { inventoryItemId: inv.id, delta, reason: "Ajuste manual en el panel", actorId: user.id } });
        await t.auditLog.create({ data: { actorId: user.id, action: "variant.update", entity: "product_variant", entityId: v!.id, changes: { sku, before, after } } });
      }
      return true;
    });
    if (!found) back("/admin/productos", { error: "Producto no encontrado." });
  } catch (e) {
    if (e instanceof Fail) back(path, { error: e.message });
    throw e;
  }

  // Fotos (después de guardar los datos).
  let done = 0;
  if (batches.length > 0) {
    const { uploadPhoto } = await import("@/lib/storage");
    const product = await d.product.findUnique({
      where: { slug },
      select: { id: true, name: true, variants: { where: { deletedAt: null }, select: { id: true, sku: true, label: true } } },
    });
    if (!product) back("/admin/productos", { error: "Producto no encontrado." });
    if (batches.some((b) => b.sku && !product!.variants.find((v) => v.sku === b.sku))) {
      revalidatePath("/", "layout");
      back(path, { error: "Los datos se guardaron, pero un color de las fotos ya no existe." });
    }
    try {
      for (const bt of batches) {
        const variant = bt.sku ? product!.variants.find((v) => v.sku === bt.sku) : undefined;
        for (const f of bt.files) {
          const url = await uploadPhoto(Buffer.from(await f.arrayBuffer()), slug);
          const last = await d.productImage.aggregate({ where: { productId: product!.id }, _max: { position: true } });
          const img = await d.productImage.create({
            data: {
              productId: product!.id,
              variantId: variant?.id ?? null,
              url,
              alt: variant ? `${product!.name} ${variant.label}` : product!.name,
              kind: variant ? bt.kind : "gallery",
              position: (last._max.position ?? -1) + 1,
            },
          });
          await d.auditLog.create({
            data: { actorId: user.id, action: "photo.add", entity: "product_image", entityId: img.id, changes: { slug, sku: bt.sku || null, kind: img.kind, url } },
          });
          done++;
        }
      }
    } catch (e) {
      console.error("[fotos] subida", e);
      revalidatePath("/", "layout");
      back(path, { error: `Los datos se guardaron, pero no se pudo subir una foto${done ? ` (se subieron ${done})` : ""}. Revisa que sea JPG, PNG o WebP.` });
    }
  }

  revalidatePath("/", "layout");
  const parts = ["la información", changedColors === 1 ? "1 color" : `${changedColors} colores`];
  if (done) parts.push(done === 1 ? "1 foto" : `${done} fotos`);
  const hidden = info.status === "draft" ? " El producto está oculto: no aparece en la tienda." : "";
  back(path, { ok: `Todo guardado (${parts.join(", ")}).${hidden}` });
}

/**
 * Aplica el mismo precio normal, precio de oferta y/o costo a todos los colores de los productos elegidos en el catálogo.
 * Lo que se deja vacío no se toca. Se revisa todo antes de escribir.
 */
export async function applyPrices(form: FormData) {
  const path = "/admin/productos";
  const user = await requireAdmin(path);
  const slugs = [...new Set(form.getAll("slug").map(String))];
  const priceRaw = str(form, "price");
  const offerRaw = str(form, "offer");
  const costRaw = str(form, "cost");
  const clearOffer = form.get("clearOffer") === "on";
  const price = priceRaw ? int(priceRaw) : undefined;
  const offer = clearOffer ? 0 : offerRaw ? int(offerRaw) : undefined;
  const cost = costRaw ? int(costRaw) : undefined;

  if (slugs.length === 0) back(path, { error: "Marca al menos un producto." });
  if (price === undefined && offer === undefined && cost === undefined) back(path, { error: "Escribe al menos un valor: precio, oferta o costo." });
  if (price === null || offer === null || cost === null) back(path, { error: "Revisa los números (solo dígitos, sin decimales)." });
  if ((price !== undefined && (price! < 1000 || price! > MAX_PRICE_PESOS)) || (offer !== undefined && offer! > MAX_PRICE_PESOS) || (cost !== undefined && cost! > MAX_PRICE_PESOS))
    back(path, { error: "Algún valor está fuera de rango." });

  const d = await db();
  const variants = await d.productVariant.findMany({
    where: { deletedAt: null, product: { slug: { in: slugs }, deletedAt: null } },
    include: { inventory: true, product: { select: { name: true } } },
  });
  if (variants.length === 0) back(path, { error: "No se encontraron colores en esos productos." });

  const plan = variants.map((v) => {
    const curRegular = (v.compareAtCents ?? v.priceCents) / 100;
    const curOffer = v.compareAtCents ? v.priceCents / 100 : 0;
    const regular = price ?? curRegular;
    const off = offer ?? curOffer;
    return { v, regular, off };
  });
  const bad = plan.find((x) => x.off > 0 && x.off >= x.regular);
  if (bad) back(path, { error: `${bad.v.product.name} (${bad.v.label}): el precio de oferta debe ser menor que el precio normal.` });

  await d.$transaction(async (t) => {
    for (const { v, regular, off } of plan) {
      const data = { priceCents: (off > 0 ? off : regular) * 100, compareAtCents: off > 0 ? regular * 100 : null };
      await t.productVariant.update({ where: { id: v.id }, data });
      if (cost !== undefined) {
        await t.inventoryItem.upsert({
          where: { variantId: v.id },
          update: { unitCostCents: cost! * 100, version: { increment: 1 } },
          create: { variantId: v.id, onHand: 0, unitCostCents: cost! * 100 },
        });
      }
      await t.auditLog.create({
        data: {
          actorId: user.id,
          action: "variant.bulk_price",
          entity: "product_variant",
          entityId: v.id,
          changes: { sku: v.sku, before: { priceCents: v.priceCents, compareAtCents: v.compareAtCents, unitCostCents: v.inventory?.unitCostCents ?? null }, after: { ...data, ...(cost !== undefined ? { unitCostCents: cost! * 100 } : {}) } },
        },
      });
    }
  });
  revalidatePath("/", "layout");
  back(path, { ok: `Listo: precios aplicados a ${variants.length} ${variants.length === 1 ? "color" : "colores"} de ${slugs.length} ${slugs.length === 1 ? "producto" : "productos"}.` });
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

/** Elimina de una vez todas las fotos marcadas (campo `id` repetido). */
export async function deletePhotosAction(form: FormData) {
  const slug = str(form, "slug");
  const path = `/admin/productos/${slug}`;
  const user = await requireAdmin(path);
  const ids = [...new Set(form.getAll("id").map(String).filter(Boolean))].slice(0, 100);
  if (ids.length === 0) back(path, { error: "Marca al menos una foto para eliminar." });
  const d = await db();
  const imgs = await d.productImage.findMany({ where: { id: { in: ids }, product: { slug } } });
  if (imgs.length === 0) back(path, { error: "Esas fotos ya no existen." });
  await d.productImage.deleteMany({ where: { id: { in: imgs.map((i) => i.id) } } });
  await d.auditLog.createMany({
    data: imgs.map((img) => ({ actorId: user.id, action: "photo.delete", entity: "product_image", entityId: img.id, changes: { slug, url: img.url } })),
  });
  try {
    const { deletePhoto } = await import("@/lib/storage");
    for (const img of imgs) await deletePhoto(img.url);
  } catch (e) {
    console.error("[fotos] borrar archivos", e);
  }
  revalidatePath("/", "layout");
  back(path, { ok: imgs.length === 1 ? "Foto eliminada." : `${imgs.length} fotos eliminadas.` });
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

/** Guarda de una vez las portadas de todas las categorías que tengan archivos nuevos, cambios de enlace o pedido de quitar la de celular. */
export async function saveCovers(form: FormData) {
  const path = "/admin/portadas";
  const user = await requireAdmin(path);
  const { storageConfigured, uploadCoverMedia, saveCover: put, removeCoverFiles, COVER_MAX_BYTES } = await import("@/lib/storage");
  const { getCover } = await import("@/lib/covers");
  if (!storageConfigured()) back(path, { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para guardar portadas." });
  const d = await db();
  const cats = [{ slug: "inicio", name: "Inicio" }, ...(await d.category.findMany({ where: { deletedAt: null }, select: { slug: true, name: true } }))];
  const file = (k: string) => {
    const f = form.get(k);
    return f instanceof File && f.size > 0 ? f : null;
  };

  const saved: string[] = [];
  const failed: string[] = [];
  for (const c of cats) {
    const slug = c.slug;
    const desktop = file(`media__${slug}`);
    const mobile = file(`mobile__${slug}`);
    const dropMobile = form.get(`drop__${slug}`) === "on";
    const hrefRaw = str(form, `href__${slug}`).slice(0, 200);
    try {
      const before = await getCover(slug, true);
      const hrefChanged = hrefRaw !== (before?.href ?? "");
      if (!desktop && !mobile && !dropMobile && !(before && hrefChanged)) continue; // sin cambios
      if ((desktop && desktop.size > COVER_MAX_BYTES) || (mobile && mobile.size > COVER_MAX_BYTES)) throw new Error("pesa más de 20 MB");
      if (hrefRaw && !/^(\/|https:\/\/)\S*$/.test(hrefRaw)) throw new Error("el enlace debe empezar por / o por https://");
      const media = desktop ? await uploadCoverMedia(desktop, slug, 2400) : before?.media;
      if (!media) throw new Error("falta la imagen, el GIF o el video");
      const mobileMedia = mobile ? await uploadCoverMedia(mobile, slug, 1100) : dropMobile ? undefined : before?.mobile;
      await put(slug, { media, mobile: mobileMedia, href: hrefRaw || undefined });
      await removeCoverFiles(slug, [desktop ? before?.media.url : undefined, mobile || dropMobile ? before?.mobile?.url : undefined], false);
      await d.auditLog.create({ data: { actorId: user.id, action: "cover.save", entity: "category", entityId: slug, changes: { slug } } });
      saved.push(c.name);
    } catch (e) {
      console.error("[portadas] guardar", slug, e);
      failed.push(`${c.name} (${e instanceof Error ? e.message : "error"})`);
    }
  }
  revalidatePath("/", "layout");
  if (failed.length) back(path, { error: `${saved.length ? `Guardadas: ${saved.join(", ")}. ` : ""}No se pudo guardar: ${failed.join("; ")}.` });
  if (saved.length === 0) back(path, { error: "No hay cambios: elige al menos un archivo." });
  back(path, { ok: saved.length === 1 ? `Portada de ${saved[0]} guardada.` : `${saved.length} portadas guardadas: ${saved.join(", ")}.` });
}

export async function removeCover(form: FormData) {
  const path = "/admin/portadas";
  const user = await requireAdmin(path);
  const slug = str(form, "slug");
  const { storageConfigured, removeCoverFiles } = await import("@/lib/storage");
  const { getCover } = await import("@/lib/covers");
  if (!storageConfigured()) back(path, { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." });
  const before = await getCover(slug, true);
  await removeCoverFiles(slug, [before?.media.url, before?.mobile?.url], true);
  await (await db()).auditLog.create({ data: { actorId: user.id, action: "cover.remove", entity: "category", entityId: slug, changes: { slug } } });
  revalidatePath("/", "layout");
  back(path, { ok: "Portada quitada: la página vuelve a su diseño de siempre." });
}

/** Guarda de una vez los ajustes del inicio: destacados, Instagram y reseñas de Instagram. */
export async function saveHome(form: FormData) {
  const path = "/admin/inicio";
  const user = await requireAdmin(path);
  const { storageConfigured, uploadSiteImage, uploadSiteMedia, saveSettingsFile, removeCoverFiles, MAX_FILE_BYTES, SITE_VIDEO_MAX_BYTES } = await import("@/lib/storage");
  const { getSettings } = await import("@/lib/site-settings");
  if (!storageConfigured()) back(path, { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para guardar." });
  const d = await db();

  const instagramUrl = str(form, "instagramUrl").slice(0, 200);
  if (instagramUrl && !/^https:\/\/(www\.)?instagram\.com\/\S*$/.test(instagramUrl)) back(path, { error: "El enlace de Instagram debe empezar por https://www.instagram.com/" });

  const slugs = [...new Set([0, 1, 2, 3, 4].map((i) => str(form, `feat_${i}`)).filter(Boolean))];
  if (slugs.length) {
    const found = await d.product.findMany({ where: { slug: { in: slugs } }, select: { slug: true } });
    if (found.length !== slugs.length) back(path, { error: "Algún producto destacado ya no existe." });
  }

  const before = await getSettings(true);
  const file = (k: string) => {
    const f = form.get(k);
    return f instanceof File && f.size > 0 ? f : null;
  };
  const oldUrls = new Set([...before.posts.flatMap((p) => p.images), ...before.reviews.map((r) => r.image)]);
  const used = new Set<string>();
  const uploaded: string[] = [];

  /** Una fila (publicación o reseña): foto nueva, o la que ya tenía; null si se quitó o no tiene foto. */
  async function imageOf(prefix: string, i: number, tag: string) {
    if (form.get(`${prefix}_del_${i}`) === "on") return null;
    const f = file(`${prefix}_image_${i}`);
    if (f) {
      const video = f.type === "video/mp4" || f.type === "video/webm";
      if (video ? f.size > SITE_VIDEO_MAX_BYTES : f.size > MAX_FILE_BYTES) throw new Error(video ? "Cada video debe pesar menos de 30 MB." : "Cada foto debe pesar menos de 8 MB.");
      const url = await uploadSiteMedia(f, tag);
      uploaded.push(url);
      return url;
    }
    const keep = str(form, `${prefix}_keep_${i}`);
    return keep && oldUrls.has(keep) ? keep : null;
  }

  try {
    const posts: { image: string; images: string[]; caption: string; href: string; date: string }[] = [];
    const nPosts = Math.min(Number(str(form, "ig_n")) || 0, 24);
    for (let i = 0; i < nPosts; i++) {
      if (form.get(`ig_del_${i}`) === "on") continue;
      // Fotos de la publicación: las que ya tenía (menos las quitadas) y las nuevas; máximo 5.
      const rm = new Set(form.getAll(`ig_rm_${i}`).map(String));
      const keep = form.getAll(`ig_keep_${i}`).map(String).filter((u) => oldUrls.has(u) && !rm.has(u));
      const fresh = form.getAll(`ig_image_${i}`).filter((f): f is File => f instanceof File && f.size > 0);
      if (keep.length + fresh.length > 5) throw new Error("Cada publicación admite hasta 5 fotos o videos.");
      const added: string[] = [];
      for (const f of fresh) {
        const video = f.type === "video/mp4" || f.type === "video/webm";
        if (video ? f.size > SITE_VIDEO_MAX_BYTES : f.size > MAX_FILE_BYTES) throw new Error(video ? "Cada video debe pesar menos de 30 MB." : "Cada foto debe pesar menos de 8 MB.");
        const url = await uploadSiteMedia(f, "ig");
        uploaded.push(url);
        added.push(url);
      }
      const images = [...keep, ...added];
      if (images.length === 0) continue;
      const href = str(form, `ig_href_${i}`).slice(0, 300);
      if (href && !/^https:\/\/\S+$/.test(href)) throw new Error("El enlace de cada publicación debe empezar por https://");
      images.forEach((u) => used.add(u));
      posts.push({ image: images[0]!, images, caption: str(form, `ig_caption_${i}`).slice(0, 300), href, date: str(form, `ig_date_${i}`).slice(0, 40) });
    }
    const reviews: { image: string; text: string; name: string; places: string[] }[] = [];
    const validPlaces = new Set(["inicio", ...(await d.category.findMany({ where: { deletedAt: null }, select: { slug: true } })).map((c) => c.slug)]);
    const nRev = Math.min(Number(str(form, "rv_n")) || 0, 24);
    for (let i = 0; i < nRev; i++) {
      const image = await imageOf("rv", i, "res");
      if (!image) continue;
      used.add(image);
      reviews.push({
        image,
        text: str(form, `rv_text_${i}`).slice(0, 400),
        name: str(form, `rv_name_${i}`).slice(0, 60),
        places: [...new Set(form.getAll(`rv_places_${i}`).map(String).filter((s) => validPlaces.has(s)))],
      });
    }
    await saveSettingsFile({ featured: slugs, instagramUrl, posts, reviews });
    // Borra las fotos que ya no se usan (quitadas o reemplazadas).
    await removeCoverFiles("ajustes", [...oldUrls].filter((u) => !used.has(u)), false);
    await d.auditLog.create({ data: { actorId: user.id, action: "home.save", entity: "settings", entityId: "inicio", changes: { featured: slugs, posts: posts.length, reviews: reviews.length } } });
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[inicio] guardar", e);
    await removeCoverFiles("ajustes", uploaded, false).catch(() => {});
    back(path, { error: e instanceof Error && /8 MB|30 MB|https|5 fotos/.test(e.message) ? e.message : "No se pudo guardar. Usa fotos JPG, PNG o WebP de menos de 8 MB o videos MP4 o WebM de menos de 30 MB." });
  }
  revalidatePath("/", "layout");
  back(path, { ok: "Inicio guardado." });
}

// ───────────── Ventas por fuera de la página ─────────────

const SALE_METHODS = ["Efectivo", "Transferencia", "Nequi o Daviplata", "Otro"] as const;

/** Registra una venta hecha por fuera de la página (efectivo, conocidos…): descuenta inventario y guarda el contacto. */
export async function createManualSale(form: FormData) {
  const path = "/admin/pedidos/nuevo";
  const user = await requireAdmin(path);
  const d = await db();

  const name = str(form, "name").slice(0, 120);
  const phone = str(form, "phone").slice(0, 20);
  const email = str(form, "email").slice(0, 160);
  const city = str(form, "city").slice(0, 80);
  const line = str(form, "line").slice(0, 200);
  const notes = str(form, "notes").slice(0, 300);
  const method = (SALE_METHODS as readonly string[]).includes(str(form, "method")) ? str(form, "method") : "Otro";
  const delivered = str(form, "state") !== "paid";
  const sendMail = form.get("sendMail") === "on";
  if (name.length < 2) back(path, { error: "Escribe el nombre de quien compró." });
  if (!/^[0-9+() -]{7,20}$/.test(phone)) back(path, { error: "Escribe un teléfono o WhatsApp válido de quien compró." });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back(path, { error: "Revisa el correo: no parece válido." });

  const pesos = (k: string) => {
    const n = Number(str(form, k).replace(/[^0-9]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  // Líneas: cada una con producto (SKU), cantidad y precio unitario (por defecto el de la página).
  const wanted: { sku: string; qty: number; unitCents: number | null }[] = [];
  for (let i = 0; i < 8; i++) {
    const sku = str(form, `sku_${i}`);
    if (!sku) continue;
    const qty = Number(str(form, `qty_${i}`) || 1);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) back(path, { error: "Revisa las cantidades: deben ser números enteros." });
    const price = pesos(`price_${i}`);
    wanted.push({ sku, qty, unitCents: price > 0 ? price * 100 : null });
  }
  if (wanted.length === 0) back(path, { error: "Elige al menos un producto." });
  if (new Set(wanted.map((w) => w.sku)).size !== wanted.length) back(path, { error: "Un producto está repetido: súmalo en una sola línea." });

  const variants = await d.productVariant.findMany({
    where: { sku: { in: wanted.map((w) => w.sku) }, deletedAt: null },
    include: { inventory: true, product: { select: { name: true, sellerId: true } } },
  });
  if (variants.length !== wanted.length) back(path, { error: "Algún producto ya no existe." });

  const lines = wanted.map((w) => {
    const v = variants.find((x) => x.sku === w.sku)!;
    return { v, qty: w.qty, unitCents: w.unitCents ?? v.priceCents };
  });
  const subtotal = lines.reduce((s, l) => s + l.unitCents * l.qty, 0);
  const discount = pesos("discount") * 100;
  if (discount > subtotal) back(path, { error: "El descuento no puede ser mayor que el total de la venta." });
  const total = subtotal - discount;
  if (total <= 0) back(path, { error: "El total de la venta debe ser mayor que cero. Revisa los precios." });

  let number = 0;
  try {
    const order = await d.$transaction(async (t) => {
      const created = await t.order.create({
        data: {
          email,
          phone,
          status: delivered ? "delivered" : "paid",
          subtotalCents: subtotal,
          discountCents: discount,
          shippingCents: 0,
          totalCents: total,
          shippingAddress: { name, department: "", city, line, notes },
          attribution: { source: "manual", method },
          items: {
            create: lines.map((l) => ({
              variantId: l.v.id,
              sellerId: l.v.product.sellerId,
              name: `${l.v.product.name} ${l.v.label}`,
              sku: l.v.sku,
              unitCents: l.unitCents,
              unitCostCents: l.v.inventory?.unitCostCents ?? null,
              quantity: l.qty,
              totalCents: l.unitCents * l.qty,
            })),
          },
          payments: { create: { provider: "manual", method, status: "approved", amountCents: total } },
          history: {
            create: [
              { toStatus: "paid", reason: `Venta registrada por fuera de la página (${method})`, actorId: user.id },
              ...(delivered ? [{ fromStatus: "paid" as const, toStatus: "delivered" as const, reason: "Entregado al cliente", actorId: user.id }] : []),
            ],
          },
        },
      });
      // Inventario: solo se descuenta si alcanza; si no, se cancela toda la venta.
      for (const l of lines) {
        const dec = await t.inventoryItem.updateMany({ where: { variantId: l.v.id, onHand: { gte: l.qty } }, data: { onHand: { decrement: l.qty } } });
        if (dec.count === 0) throw new Error(`stock:${l.v.product.name} (${l.v.label})`);
        if (l.v.inventory) await t.stockMovement.create({ data: { inventoryItemId: l.v.inventory.id, delta: -l.qty, reason: `Venta manual NC-${created.number}`, actorId: user.id } });
      }
      await t.auditLog.create({ data: { actorId: user.id, action: "order.manual", entity: "order", entityId: created.id, changes: { number: created.number, total, method } } });
      return created;
    });
    number = order.number;
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    const msg = e instanceof Error && e.message.startsWith("stock:") ? `No hay suficientes unidades de ${e.message.slice(6)} en inventario.` : "No se pudo registrar la venta. Intenta de nuevo.";
    if (!(e instanceof Error && e.message.startsWith("stock:"))) console.error("[venta manual]", e);
    back(path, { error: msg });
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");

  const dest = `/admin/pedidos/${number}`;
  if (delivered && sendMail) {
    if (!email) back(dest, { ok: `Venta NC-${number} registrada.`, error: "No se envió el correo: no escribiste el correo del cliente." });
    const order = await d.order.findUnique({ where: { number }, include: { items: true } });
    const sent = order ? await sendDeliveredEmail(order) : false;
    back(dest, sent ? { ok: `Venta NC-${number} registrada y correo de agradecimiento enviado.` } : { ok: `Venta NC-${number} registrada.`, error: "No se pudo enviar el correo al cliente." });
  }
  back(dest, { ok: `Venta NC-${number} registrada.` });
}
