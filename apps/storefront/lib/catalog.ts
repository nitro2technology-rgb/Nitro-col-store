// Fuente única del catálogo para el servidor (páginas y layout).
// CATALOG_SOURCE=db lee de Supabase vía Prisma; por defecto se usa el catálogo estático de products.ts.
// En modo db un fallo NO cae al estático: mostraría precios y stock viejos. Con ISR, Next conserva la
// última página buena si la regeneración falla, y en el build el error detiene el despliegue.
import { cache } from "react";
import { productSchema, type Product } from "@nitro/shared";
import { buildSearchIndex, products as staticProducts, type SearchEntry } from "./products";

const toImages = (rows: { url: string; alt: string }[]) =>
  rows.length > 0 ? rows.map((r) => ({ src: r.url, alt: r.alt })) : undefined;

async function loadFromDb(): Promise<Product[]> {
  // Import dinámico: en modo estático ni siquiera se carga Prisma.
  const { db } = await import("@nitro/db");
  const rows = await db.product.findMany({
    where: { status: "published", deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      brand: true,
      categories: { include: { category: true } },
      images: { orderBy: { position: "asc" } },
      variants: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: "asc" }, { sku: "asc" }],
        include: { inventory: true },
      },
    },
  });

  const out: Product[] = [];
  for (const r of rows) {
    const candidate = {
      slug: r.slug,
      name: r.name,
      brand: r.brand?.name ?? "",
      category: r.categories[0]?.category.slug ?? "",
      tagline: r.tagline ?? "",
      description: r.description,
      theme: r.theme,
      featuredRank: r.featuredRank ?? undefined,
      specs: r.specs,
      tags: r.tags.length > 0 ? r.tags : undefined,
      highlights: r.highlights,
      inBox: Array.isArray(r.inBox) && r.inBox.length > 0 ? r.inBox : undefined,
      faq: Array.isArray(r.faq) && r.faq.length > 0 ? r.faq : undefined,
      images: toImages(r.images.filter((im) => im.variantId === null)),
      videoUrl: r.videoUrl ?? undefined,
      videoPoster: r.videoPoster ?? undefined,
      variants: r.variants.map((v) => ({
        sku: v.sku,
        label: v.label,
        swatch: v.swatch ?? undefined,
        priceCents: v.priceCents,
        compareAtCents: v.compareAtCents ?? undefined,
        // Lo reservado por pagos en curso no se puede vender.
        stock: Math.max(0, (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0)),
        images: toImages(r.images.filter((im) => im.variantId === v.id && im.kind === "card")),
        gallery: toImages(r.images.filter((im) => im.variantId === v.id && im.kind === "gallery")),
      })),
    };
    const parsed = productSchema.safeParse(candidate);
    if (parsed.success) out.push(parsed.data);
    else console.error(`[catalog] Producto "${r.slug}" omitido por datos inválidos:`, parsed.error.flatten().fieldErrors);
  }
  if (out.length === 0) throw new Error("[catalog] CATALOG_SOURCE=db pero la base no tiene productos publicados. ¿Se ejecutó el seed?");
  return out;
}

/** Todos los productos publicados. Se calcula una vez por petición/regeneración. */
export const getProducts = cache(async (): Promise<Product[]> =>
  process.env.CATALOG_SOURCE === "db" ? loadFromDb() : staticProducts,
);

/** Índice del buscador, ya calculado en el servidor para no enviar el catálogo completo al navegador. */
export const getSearchIndex = cache(async (): Promise<SearchEntry[]> => buildSearchIndex(await getProducts()));

/**
 * Lo mínimo del catálogo que necesitan el carrito y el menú en el navegador:
 * datos de cabecera de cada producto y una sola foto por color.
 */
export const getCartCatalog = cache(async (): Promise<Product[]> =>
  (await getProducts()).map((p) => ({
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    tagline: p.tagline,
    description: "",
    theme: p.theme,
    art: p.art,
    specs: {},
    highlights: [],
    variants: p.variants.map((v) => ({
      sku: v.sku,
      label: v.label,
      swatch: v.swatch,
      priceCents: v.priceCents,
      stock: v.stock,
      images: v.images?.slice(0, 1),
    })),
  })),
);
