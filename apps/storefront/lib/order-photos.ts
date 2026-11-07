// Foto de cada producto comprado (para «Mi cuenta»). Usa la primera foto del color; si no tiene, la del producto.
export async function photosForVariants(variantIds: string[]) {
  const out = new Map<string, string>();
  if (variantIds.length === 0) return out;
  const { db } = await import("@nitro/db");
  const variants = await db.productVariant.findMany({ where: { id: { in: variantIds } }, select: { id: true, productId: true } });
  const images = await db.productImage.findMany({
    where: { OR: [{ variantId: { in: variantIds } }, { productId: { in: variants.map((v) => v.productId) } }] },
    orderBy: [{ kind: "asc" }, { position: "asc" }],
    select: { variantId: true, productId: true, url: true },
  });
  for (const v of variants) {
    const own = images.find((i) => i.variantId === v.id) ?? images.find((i) => i.productId === v.productId);
    if (own) out.set(v.id, own.url);
  }
  return out;
}

/** Miniatura pregenerada (ver lib/image-loader.ts) para no bajar la foto grande en las listas. */
export const smallPhoto = (src: string | undefined) =>
  src && (src.startsWith("/products/") || src.includes("/storage/v1/object/public/productos/")) && src.endsWith(".webp")
    ? `${src.slice(0, -5)}-480.webp`
    : src;
