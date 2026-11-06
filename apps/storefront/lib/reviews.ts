// Reseñas de compradores verificados: se publican con el número de un pedido pagado (ver /api/reviews).
// Mientras no haya ninguna, la ficha muestra "Aún no hay reseñas": no hay reseñas de ejemplo.
export type Review = { author: string; stars: number; date: string; text: string };

export type ShopReview = Review & { product: string; productSlug: string };

/** Últimas reseñas publicadas de toda la tienda (para la portada). Sin base de datos o sin reseñas devuelve []. */
export async function getLatestReviews(limit = 6): Promise<ShopReview[]> {
  if (process.env.CATALOG_SOURCE !== "db") return [];
  try {
    const { db } = await import("@nitro/db");
    const rows = await db.review.findMany({
      where: { published: true, rating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { authorName: true, rating: true, body: true, createdAt: true, product: { select: { name: true, slug: true } } },
    });
    return rows
      .filter((r) => (r.body ?? "").trim().length > 0)
      .map((r) => ({
        author: r.authorName ?? "Cliente",
        stars: r.rating,
        date: r.createdAt.toISOString(),
        text: r.body ?? "",
        product: r.product.name,
        productSlug: r.product.slug,
      }));
  } catch (error) {
    console.error("[reviews] No se pudieron leer las últimas reseñas:", error);
    return [];
  }
}

/** Reseñas publicadas de un producto, las más recientes primero. Sin base de datos devuelve []; nunca rompe la ficha. */
export async function getReviews(slug: string): Promise<Review[]> {
  if (process.env.CATALOG_SOURCE !== "db") return [];
  try {
    const { db } = await import("@nitro/db");
    const rows = await db.review.findMany({
      where: { published: true, product: { slug } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { authorName: true, rating: true, body: true, createdAt: true },
    });
    return rows.map((r) => ({
      author: r.authorName ?? "Cliente",
      stars: r.rating,
      date: r.createdAt.toISOString(),
      text: r.body ?? "",
    }));
  } catch (error) {
    console.error(`[reviews] No se pudieron leer las reseñas de ${slug}:`, error);
    return [];
  }
}
