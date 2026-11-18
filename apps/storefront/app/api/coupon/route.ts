// Comprueba un código de cupón contra el carrito. No crea nada: el cobro real se recalcula en /api/checkout.
import { currentUser } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { validateCoupon } from "@/lib/coupons";

export const dynamic = "force-dynamic";

const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Solicitud inválida." }, 400);
  }
  if (!Array.isArray(body?.items) || body.items.length === 0 || body.items.length > 40) return reply({ error: "Tu carrito está vacío." }, 400);
  const wanted = new Map<string, number>();
  for (const it of body.items) {
    const qty = Number(it?.qty);
    if (typeof it?.sku !== "string" || !Number.isInteger(qty) || qty < 1 || qty > 20) return reply({ error: "Carrito inválido." }, 400);
    wanted.set(it.sku, (wanted.get(it.sku) ?? 0) + qty);
  }
  const { db } = await import("@nitro/db");
  const variants = await db.productVariant.findMany({
    where: { sku: { in: [...wanted.keys()] }, deletedAt: null, product: { status: "published", deletedAt: null } },
    select: { sku: true, priceCents: true },
  });
  const subtotalCents = variants.reduce((s, v) => s + v.priceCents * (wanted.get(v.sku) ?? 0), 0);
  const user = await currentUser().catch(() => null);
  const profile = user ? await ensureProfile(user) : null;
  const email = typeof body?.email === "string" ? body.email.trim() : null;
  const result = await validateCoupon({ code: body?.code, subtotalCents, profileId: profile?.id, email });
  if ("error" in result) return reply({ error: result.error }, 200);
  const { code, type, value } = result.coupon;
  return reply({ ok: true, code, type, value });
}
