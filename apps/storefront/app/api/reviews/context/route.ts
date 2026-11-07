// Contexto del formulario de reseña: si la persona tiene sesión, sus pedidos (pagados) que incluyen el producto y si ya
// reseñó. Lee la sesión de las cookies, por eso es dinámico y nunca se guarda en caché.
import { ensureProfile } from "@/lib/profile";
import { currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const REVIEWABLE = ["paid", "processing", "shipped", "delivered"] as const;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const user = await currentUser().catch(() => null);
  if (!user?.email) return json({ signedIn: false });
  const profile = await ensureProfile(user);
  if (!profile) return json({ signedIn: false });

  const { db } = await import("@nitro/db");
  const product = await db.product.findFirst({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!product) return json({ error: "Producto no encontrado." }, 404);

  const already = await db.review.findFirst({ where: { productId: product.id, profileId: profile.id }, select: { id: true } });
  const orders = await db.order.findMany({
    where: {
      OR: [{ profileId: profile.id }, { email: { equals: user.email, mode: "insensitive" } }],
      status: { in: [...REVIEWABLE] },
      items: { some: { variant: { productId: product.id } } },
      reviews: { none: { productId: product.id } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { number: true, createdAt: true, items: { where: { variant: { productId: product.id } }, select: { name: true, quantity: true } } },
  });
  const meta = user.user_metadata ?? {};
  return json({
    signedIn: true,
    email: user.email,
    name: profile.fullName ?? String(meta.full_name ?? meta.name ?? ""),
    reviewed: Boolean(already),
    orders: orders.map((o) => ({ number: o.number, date: o.createdAt.toISOString(), items: o.items.map((i) => `${i.quantity} × ${i.name}`).join(", ") })),
  });
}
