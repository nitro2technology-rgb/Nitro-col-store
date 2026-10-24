// Recibe una reseña. Solo la acepta de quien compró: el número de pedido y el correo deben coincidir con un
// pedido pagado que incluya el producto. El nombre público sale del pedido, no de lo que escriba la persona.
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

// Freno simple por IP (memoria del servidor): suficiente contra abuso casual; la compra verificada es el filtro real.
const hits = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

const REVIEWABLE = ["paid", "processing", "shipped", "delivered"] as const;

/** "Camila Rodríguez Pérez" → "Camila R." */
function publicName(full: unknown) {
  const parts = String(full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Cliente";
  const first = parts[0]!;
  return parts.length > 1 ? `${first} ${parts[parts.length - 1]![0]!.toUpperCase()}.` : first;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (tooMany(ip)) return fail("Demasiados intentos. Prueba de nuevo más tarde.", 429);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida.");
  }

  const slug = typeof body?.slug === "string" ? body.slug : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const match = /^NC-?(\d{1,9})$/i.exec(String(body?.order ?? "").trim());
  const stars = Number(body?.stars);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!slug || !email || !match) return fail("Escribe el número de tu pedido (ej. NC-12) y el correo de la compra.");
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return fail("Elige de 1 a 5 estrellas.");
  if (text.length < 10 || text.length > 600) return fail("Cuéntanos tu experiencia en 10 a 600 caracteres.");

  const { db } = await import("@nitro/db");
  const order = await db.order.findUnique({
    where: { number: Number(match[1]) },
    include: { items: { include: { variant: { select: { productId: true, product: { select: { slug: true } } } } } } },
  });
  const item = order?.items.find((i) => i.variant.product.slug === slug);
  // Mismo mensaje para todo desajuste: no se revela si un pedido existe.
  if (!order || order.email.toLowerCase() !== email || !(REVIEWABLE as readonly string[]).includes(order.status) || !item) {
    return fail("No encontramos una compra pagada de este producto con ese pedido y correo.", 403);
  }

  try {
    await db.review.create({
      data: {
        productId: item.variant.productId,
        orderId: order.id,
        authorName: publicName((order.shippingAddress as Record<string, unknown> | null)?.name),
        rating: stars,
        body: text,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return fail("Ya dejaste una reseña de este producto con ese pedido.", 409);
    console.error("[reviews] No se pudo guardar:", error);
    return fail("No se pudo guardar la reseña. Intenta de nuevo.", 500);
  }

  revalidatePath(`/p/${slug}`);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
