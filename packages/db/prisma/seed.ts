// Siembra la base con el catálogo de apps/storefront/lib/products.ts.
// Por defecto solo simula (no escribe). Para escribir: pnpm --filter @nitro/db seed -- --apply
// Es idempotente: se puede repetir y actualiza lo existente por slug / SKU.
import { PrismaClient } from "@prisma/client";
import { categories, products } from "../../../apps/storefront/lib/products";

const apply = process.argv.includes("--apply");
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Peso y medidas provisionales: el dueño debe dar los reales para calcular envíos.
const PLACEHOLDER_DIMS = { weightGrams: 150, lengthMm: 100, widthMm: 100, heightMm: 60 };

async function main() {
  const lines = [
    `Vendedor de la casa: nitro-col`,
    ...categories.flatMap((c) => [`Categoría: ${c.slug}`, ...c.children.map((x) => `Categoría: ${c.slug}/${x.slug}`)]),
    ...products.flatMap((p) => [
      `Producto: ${p.slug} (${p.category}, marca ${p.brand})`,
      ...p.variants.map((v) => `  Variante ${v.sku} ${v.label} $${v.priceCents / 100} stock ${v.stock}, ${v.images?.length ?? 0} fotos`),
      `  Galería: ${p.images?.length ?? 0} fotos`,
    ]),
  ];
  console.log(lines.join("\n"));
  if (!apply) return console.log("\nSimulación: no se escribió nada. Usa --apply para sembrar.");

  const db = new PrismaClient();
  const house = await db.seller.upsert({
    where: { slug: "nitro-col" },
    update: {},
    create: { name: "Nitro Col Store", slug: "nitro-col", isHouse: true },
  });

  const catId = new Map<string, string>();
  for (const [i, parent] of categories.entries()) {
    const p = await db.category.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name, path: parent.slug, position: i },
      create: { name: parent.name, slug: parent.slug, path: parent.slug, position: i },
    });
    catId.set(parent.slug, p.id);
    for (const [j, child] of parent.children.entries()) {
      const c = await db.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: p.id, path: `${parent.slug}/${child.slug}`, position: j },
        create: { name: child.name, slug: child.slug, parentId: p.id, path: `${parent.slug}/${child.slug}`, position: j },
      });
      catId.set(child.slug, c.id);
    }
  }

  for (const p of products) {
    const brand = await db.brand.upsert({
      where: { slug: slugify(p.brand) },
      update: {},
      create: { name: p.brand, slug: slugify(p.brand) },
    });
    const data = {
      brandId: brand.id,
      sellerId: house.id,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      status: "published" as const,
      featuredRank: p.featuredRank ?? null,
      theme: p.theme,
      specs: p.specs,
      tags: p.tags ?? [],
      highlights: p.highlights,
      inBox: p.inBox ?? [],
      faq: p.faq ?? [],
      videoUrl: p.videoUrl ?? null,
      videoPoster: p.videoPoster ?? null,
    };
    const product = await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });

    await db.productCategory.deleteMany({ where: { productId: product.id } });
    await db.productCategory.create({ data: { productId: product.id, categoryId: catId.get(p.category)! } });

    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.createMany({
      data: (p.images ?? []).map((im, position) => ({ productId: product.id, kind: "gallery", url: im.src, alt: im.alt, position })),
    });

    for (const v of p.variants) {
      const vdata = { productId: product.id, label: v.label, swatch: v.swatch ?? null, priceCents: v.priceCents, compareAtCents: v.compareAtCents ?? null };
      const variant = await db.productVariant.upsert({
        where: { sku: v.sku },
        update: vdata,
        create: { sku: v.sku, ...PLACEHOLDER_DIMS, ...vdata },
      });
      await db.inventoryItem.upsert({
        where: { variantId: variant.id },
        update: { onHand: v.stock },
        create: { variantId: variant.id, onHand: v.stock },
      });
      await db.productImage.createMany({
        data: [
          ...(v.images ?? []).map((im) => ({ ...im, kind: "card" })),
          ...(v.gallery ?? []).map((im) => ({ ...im, kind: "gallery" })),
        ].map((im, position) => ({ productId: product.id, variantId: variant.id, kind: im.kind, url: im.src, alt: im.alt, position })),
      });
    }
  }
  console.log("\nSembrado completo.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
