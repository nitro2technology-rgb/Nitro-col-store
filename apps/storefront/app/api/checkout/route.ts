// Crea el pedido y devuelve la URL de pago de Wompi. El navegador solo envía SKU y cantidades:
// precios, descuento, envío y stock se calculan aquí con los datos de la base.
import { priceCart } from "@/lib/pricing";
import { requestOrigin } from "@/lib/site";
import { ensureProfile } from "@/lib/profile";
import { currentUser } from "@/lib/supabase/server";
import { buildCapiContext } from "@/lib/meta-capi";
import { checkoutUrl, orderReference } from "@/lib/wompi";
import { expireStaleOrders, OutOfStockError, RESERVATION_MINUTES, reserveItem } from "@/lib/reservations";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
const text = (v: unknown, min: number, max: number) => (typeof v === "string" && v.trim().length >= min && v.trim().length <= max ? v.trim() : null);

function siteOrigin(req: Request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  return requestOrigin(req);
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida.");
  }

  // Validación de lo que escribe la persona.
  const name = text(body?.customer?.name, 2, 120);
  const email = text(body?.customer?.email, 5, 160);
  const phone = text(body?.customer?.phone, 7, 20);
  const department = text(body?.address?.department, 2, 80);
  const city = text(body?.address?.city, 2, 80);
  const line = text(body?.address?.line, 5, 200);
  const notes = typeof body?.address?.notes === "string" ? body.address.notes.trim().slice(0, 300) : "";
  if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Revisa tu nombre y correo.");
  if (!phone || !/^[0-9+() -]{7,20}$/.test(phone)) return fail("Revisa tu teléfono.");
  if (!department || !city || !line) return fail("Completa la dirección de envío.");

  // Carrito: se juntan SKU repetidos y se limitan las cantidades.
  const wanted = new Map<string, number>();
  if (!Array.isArray(body?.items) || body.items.length === 0 || body.items.length > 40) return fail("Tu carrito está vacío.");
  for (const it of body.items) {
    const qty = Number(it?.qty);
    if (typeof it?.sku !== "string" || !Number.isInteger(qty) || qty < 1 || qty > 20) return fail("Carrito inválido.");
    wanted.set(it.sku, (wanted.get(it.sku) ?? 0) + qty);
  }

  const { db } = await import("@nitro/db");
  // Suelta primero el stock de pedidos vencidos para que no aparezca como agotado sin estarlo.
  await expireStaleOrders().catch((e) => console.error("[checkout] No se pudieron vencer pedidos:", e));
  const variants = await db.productVariant.findMany({
    where: { sku: { in: [...wanted.keys()] }, deletedAt: null, product: { status: "published", deletedAt: null } },
    include: { inventory: true, product: { include: { categories: { include: { category: true } } } } },
  });
  if (variants.length !== wanted.size) return fail("Algún producto de tu carrito ya no está disponible. Revisa el carrito.", 409);

  const rows = variants.map((v) => ({
    v,
    qty: wanted.get(v.sku)!,
    category: v.product.categories[0]?.category.slug ?? "",
  }));
  for (const r of rows) {
    const available = (r.v.inventory?.onHand ?? 0) - (r.v.inventory?.reserved ?? 0);
    if (r.v.priceCents <= 0) return fail(`${r.v.product.name} aún no tiene precio.`, 409);
    if (available < r.qty) return fail(`No hay suficientes unidades de ${r.v.product.name} (${r.v.label}).`, 409);
  }

  const totals = priceCart(rows.map((r) => ({ category: r.category, priceCents: r.v.priceCents, qty: r.qty })));
  // Con sesión, el pedido queda en "Mi cuenta". Comprar sin cuenta sigue siendo posible.
  const user = await currentUser().catch(() => null);
  const profile = user ? await ensureProfile(user) : null;
  const capi = buildCapiContext(body?.tracking, req);
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000);
  let order;
  try {
    // Pedido y reservas en una sola transacción: si alguna unidad ya no alcanza, no queda nada a medias.
    order = await db.$transaction(async (t) => {
      const created = await t.order.create({
    data: {
      profileId: profile?.id,
      email,
      phone,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      shippingCents: totals.shippingCents,
      totalCents: totals.totalCents,
      shippingAddress: { name, department, city, line, notes },
      ...(capi && { attribution: { source: "web", capi } }),
      items: {
        create: rows.map((r) => ({
          variantId: r.v.id,
          sellerId: r.v.product.sellerId,
          name: `${r.v.product.name} ${r.v.label}`,
          sku: r.v.sku,
          unitCents: r.v.priceCents,
          // Costo de ese momento: la ganancia del pedido no cambia si después se edita el costo
          unitCostCents: r.v.inventory?.unitCostCents ?? null,
          quantity: r.qty,
          totalCents: r.v.priceCents * r.qty,
        })),
      },
      payments: { create: { provider: "wompi", method: "checkout", amountCents: totals.totalCents } },
      history: { create: { toStatus: "pending_payment", reason: "Pedido creado" } },
    },
      });
      for (const r of rows) {
        if (!r.v.inventory) throw new OutOfStockError(r.v.id);
        await reserveItem(t, { orderId: created.id, variantId: r.v.id, inventoryItemId: r.v.inventory.id, quantity: r.qty, expiresAt });
      }
      return created;
    }, { timeout: 20000, maxWait: 10000 });
  } catch (error) {
    if (error instanceof OutOfStockError) return fail("Alguien más acaba de llevarse las últimas unidades de un producto de tu carrito. Revisa el carrito.", 409);
    throw error;
  }

  // «Guardar mis datos»: solo con sesión. Un fallo aquí nunca debe frenar el pago.
  if (profile && body?.saveData === true) {
    try {
      const same = await db.address.findFirst({ where: { profileId: profile.id, line1: line, city }, select: { id: true } });
      if (same) await db.address.update({ where: { id: same.id }, data: { fullName: name, phone, department, notes: notes || null } });
      else if ((await db.address.count({ where: { profileId: profile.id } })) < 10) {
        const first = (await db.address.count({ where: { profileId: profile.id } })) === 0;
        await db.address.create({ data: { profileId: profile.id, fullName: name, phone, documentId: "", department, city, line1: line, notes: notes || null, isDefault: first } });
      }
      await db.profile.update({ where: { id: profile.id }, data: { ...(profile.fullName ? {} : { fullName: name }), ...(profile.phone ? {} : { phone }) } });
    } catch (error) {
      console.error("[checkout] No se pudieron guardar los datos de la cuenta:", error);
    }
  }

  const reference = orderReference(order.number);
  const origin = siteOrigin(req);
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(origin);
  const url = checkoutUrl({ reference, amountCents: totals.totalCents, redirectUrl: isLocal ? undefined : `${origin}/pedido/${reference}` });
  return Response.json({ url, reference }, { headers: { "Cache-Control": "no-store" } });
}
