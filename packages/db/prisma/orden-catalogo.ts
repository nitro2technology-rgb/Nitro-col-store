// Copia a la base el orden de los colores (position) y de las especificaciones (specs) del catálogo estático.
// No toca stock, precios ni fotos. Por defecto solo simula; para escribir: pnpm --filter @nitro/db exec tsx prisma/orden-catalogo.ts --apply
import { PrismaClient } from "@prisma/client";
import { products } from "../../../apps/storefront/lib/products";

const apply = process.argv.includes("--apply");

async function main() {
  const db = new PrismaClient();
  let changes = 0;
  for (const p of products) {
    const row = await db.product.findUnique({ where: { slug: p.slug }, include: { variants: true } });
    if (!row) {
      console.log(`Falta en la base: ${p.slug}`);
      continue;
    }
    if (JSON.stringify(row.specs) !== JSON.stringify(p.specs)) {
      changes++;
      console.log(`${p.slug}: especificaciones en orden ${Object.keys(p.specs).join(", ")}`);
      if (apply) await db.product.update({ where: { id: row.id }, data: { specs: p.specs } });
    }
    for (const [position, v] of p.variants.entries()) {
      const current = row.variants.find((x) => x.sku === v.sku);
      if (!current || current.position === position) continue;
      changes++;
      console.log(`  ${v.sku}: posición ${current.position} → ${position}`);
      if (apply) await db.productVariant.update({ where: { id: current.id }, data: { position } });
    }
  }
  console.log(`\n${changes} cambios${apply ? " aplicados." : ". Simulación: usa --apply para escribir."}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
