// Crea el pedido y devuelve la URL de pago de Wompi. El navegador solo envía SKU y cantidades:
// precios, descuento, envío y stock se calculan aquí con los datos de la base.
import { priceCart } from "@/lib/pricing";
import { checkoutUrl, orderReference } from "@/lib/wompi";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
const text = (v: unknown, min: number, max: number) => (typeof v === "string" && v.trim().length >= min && v.trim().length <= max ? v.trim() : null);

function siteOrigin(req: Request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
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
  const order = await db.order.create({
    data: {
      email,
      phone,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      shippingCents: totals.shippingCents,
      totalCents: totals.totalCents,
      shippingAddress: { name, department, city, line, notes },
      items: {
        create: rows.map((r) => ({
          variantId: r.v.id,
          sellerId: r.v.product.sellerId,
          name: `${r.v.product.name} ${r.v.label}`,
          sku: r.v.sku,
          unitCents: r.v.priceCents,
          quantity: r.qty,
          totalCents: r.v.priceCents * r.qty,
        })),
      },
      payments: { create: { provider: "wompi", method: "checkout", amountCents: totals.totalCents } },
      history: { create: { toStatus: "pending_payment", reason: "Pedido creado" } },
    },
  });

  const reference = orderReference(order.number);
  const origin = siteOrigin(req);
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(origin);
  const url = checkoutUrl({ reference, amountCents: totals.totalCents, redirectUrl: isLocal ? undefined : `${origin}/pedido/${reference}` });
  return Response.json({ url, reference }, { headers: { "Cache-Control": "no-store" } });
}
