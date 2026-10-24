// Reseñas de compradores verificados: se publican con el número de un pedido pagado (ver /api/reviews).
// Mientras no haya ninguna, la ficha muestra "Aún no hay reseñas": no hay reseñas de ejemplo.
export type Review = { author: string; stars: number; date: string; text: string };

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
