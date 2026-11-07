// Recibe una reseña: solo de quien tiene sesión iniciada. Lleva nombre, estrellas, opinión, hasta 3 fotos y, si la persona
// elige uno, el pedido que respalda la reseña (debe ser suyo y de ese producto: así queda como «compra verificada»).
// El correo sale de la sesión, no de lo que se escriba. No se publica.
import { revalidatePath } from "next/cache";
import { ensureProfile } from "@/lib/profile";
import { currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

// Freno simple por IP (memoria del servidor): suficiente contra abuso casual.
const hits = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 8;
}

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const REVIEWABLE = ["paid", "processing", "shipped", "delivered"] as const;

/** "Camila Rodríguez Pérez" → "Camila R." */
function publicName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Cliente";
  const first = parts[0]!;
  return parts.length > 1 ? `${first} ${parts[parts.length - 1]![0]!.toUpperCase()}.` : first;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (tooMany(ip)) return fail("Demasiados intentos. Prueba de nuevo más tarde.", 429);

  const user = await currentUser().catch(() => null);
  const profile = user ? await ensureProfile(user) : null;
  if (!user?.email || !profile) return fail("Inicia sesión con tu correo para dejar una reseña.", 401);
  const email = user.email.toLowerCase();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Solicitud inválida.");
  }
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const slug = get("slug");
  const name = get("name");
  const stars = Number(get("stars"));
  const text = get("text");
  const orderRaw = get("order");
  const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!slug) return fail("Solicitud inválida.");
  if (name.length < 2 || name.length > 60) return fail("Escribe tu nombre.");
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return fail("Elige de 1 a 5 estrellas.");
  if (text.length < 10 || text.length > 600) return fail("Cuéntanos tu experiencia en 10 a 600 caracteres.");
  if (photos.length > MAX_PHOTOS) return fail(`Puedes subir hasta ${MAX_PHOTOS} fotos.`);
  if (photos.some((f) => f.size > MAX_PHOTO_BYTES)) return fail("Cada foto debe pesar menos de 6 MB.");
  if (photos.some((f) => !["image/jpeg", "image/png", "image/webp"].includes(f.type))) return fail("Las fotos deben ser JPG, PNG o WebP.");

  const { db } = await import("@nitro/db");
  const product = await db.product.findFirst({ where: { slug, status: "published", deletedAt: null }, select: { id: true } });
  if (!product) return fail("Ese producto ya no está disponible.", 404);

  // Una reseña por cuenta y producto.
  const already = await db.review.findFirst({ where: { productId: product.id, profileId: profile.id }, select: { id: true } });
  if (already) return fail("Ya dejaste una reseña de este producto.", 409);

  // Pedido elegido: debe ser de esta persona, estar pagado e incluir este producto.
  let orderId: string | null = null;
  if (orderRaw) {
    const number = Number(orderRaw.replace(/^NC-?/i, ""));
    const order = Number.isInteger(number)
      ? await db.order.findFirst({
          where: {
            number,
            OR: [{ profileId: profile.id }, { email: { equals: email, mode: "insensitive" } }],
            status: { in: [...REVIEWABLE] },
            items: { some: { variant: { productId: product.id } } },
          },
          select: { id: true },
        })
      : null;
    if (!order) return fail("Ese pedido no es tuyo o no incluye este producto.", 403);
    if (await db.review.findFirst({ where: { productId: product.id, orderId: order.id }, select: { id: true } })) return fail("Ese pedido ya tiene una reseña de este producto.", 409);
    orderId = order.id;
  }

  // Fotos: se convierten a WebP y se guardan en el almacenamiento público.
  const urls: string[] = [];
  const { storageConfigured, uploadSiteImage, removeCoverFiles } = await import("@/lib/storage");
  try {
    if (photos.length > 0) {
      if (!storageConfigured()) return fail("Por ahora no se pueden subir fotos. Envía tu reseña sin fotos.", 503);
      for (const f of photos) urls.push(await uploadSiteImage(f, "rev"));
    }
    await db.review.create({
      data: {
        productId: product.id,
        profileId: profile.id,
        orderId,
        authorName: publicName(name),
        authorEmail: email,
        rating: stars,
        body: text,
        images: urls,
      },
    });
  } catch (error) {
    if (urls.length > 0) await removeCoverFiles("rev", urls, false).catch(() => {});
    if ((error as { code?: string }).code === "P2002") return fail("Ya dejaste una reseña de este producto.", 409);
    console.error("[reviews] No se pudo guardar:", error);
    return fail("No se pudo guardar la reseña. Revisa las fotos e intenta de nuevo.", 500);
  }

  revalidatePath(`/p/${slug}`);
  revalidatePath("/");
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
