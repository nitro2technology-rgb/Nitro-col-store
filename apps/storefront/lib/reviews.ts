// Reseñas de clientes: nombre, correo, opinión y hasta 3 fotos (ver /api/reviews). `verified` = el correo tiene un pedido pagado de ese producto.
// Mientras no haya ninguna, la ficha muestra "Aún no hay reseñas": no hay reseñas de ejemplo.
export type Review = { author: string; stars: number; date: string; text: string; images: string[]; verified: boolean };

export type ShopReview = Review & { product: string; productSlug: string };

/** Últimas reseñas publicadas de toda la tienda, de cualquier calificación (para el inicio). Sin base de datos o sin reseñas devuelve []. */
export async function getLatestReviews(limit = 6): Promise<ShopReview[]> {
  if (process.env.CATALOG_SOURCE !== "db") return [];
  try {
    const { db } = await import("@nitro/db");
    const rows = await db.review.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { authorName: true, rating: true, body: true, createdAt: true, images: true, orderId: true, product: { select: { name: true, slug: true } } },
    });
    return rows
      .filter((r) => (r.body ?? "").trim().length > 0)
      .map((r) => ({
        author: r.authorName ?? "Cliente",
        stars: r.rating,
        date: r.createdAt.toISOString(),
        text: r.body ?? "",
        images: r.images ?? [],
        verified: r.orderId !== null,
        product: r.product.name,
        productSlug: r.product.slug,
      }));
  } catch (error) {
    console.error("[reviews] No se pudieron leer las últimas reseñas:", error);
    return [];
  }
}

/** Últimas reseñas publicadas de un conjunto de productos (los de una categoría). Sin base de datos o sin reseñas devuelve []. */
export async function getReviewsForProducts(slugs: string[], limit = 8): Promise<ShopReview[]> {
  if (process.env.CATALOG_SOURCE !== "db" || slugs.length === 0) return [];
  try {
    const { db } = await import("@nitro/db");
    const rows = await db.review.findMany({
      where: { published: true, product: { slug: { in: slugs } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { authorName: true, rating: true, body: true, createdAt: true, images: true, orderId: true, product: { select: { name: true, slug: true } } },
    });
    return rows
      .filter((r) => (r.body ?? "").trim().length > 0)
      .map((r) => ({
        author: r.authorName ?? "Cliente",
        stars: r.rating,
        date: r.createdAt.toISOString(),
        text: r.body ?? "",
        images: r.images ?? [],
        verified: r.orderId !== null,
        product: r.product.name,
        productSlug: r.product.slug,
      }));
  } catch (error) {
    console.error("[reviews] No se pudieron leer las reseñas de la categoría:", error);
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
      select: { authorName: true, rating: true, body: true, createdAt: true, images: true, orderId: true },
    });
    return rows.map((r) => ({
      author: r.authorName ?? "Cliente",
      stars: r.rating,
      date: r.createdAt.toISOString(),
      text: r.body ?? "",
      images: r.images ?? [],
      verified: r.orderId !== null,
    }));
  } catch (error) {
    console.error(`[reviews] No se pudieron leer las reseñas de ${slug}:`, error);
    return [];
  }
}
