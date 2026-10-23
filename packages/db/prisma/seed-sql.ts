// Genera prisma/seed-partes/parte-NN.sql con el mismo catálogo que seed.ts, para pegarlo en el SQL Editor de Supabase
// cuando la red bloquea los puertos de base de datos. Es idempotente (se puede ejecutar varias veces).
// Uso: pnpm --filter @nitro/db seed:sql
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { categories, products } from "../../../apps/storefront/lib/products";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Mismos valores provisionales que seed.ts
const DIMS = { weightGrams: 150, lengthMm: 100, widthMm: 100, heightMm: 60 };

const str = (v: string | null | undefined) => (v == null ? "NULL" : `'${v.replace(/'/g, "''")}'`);
const json = (v: unknown) => `${str(JSON.stringify(v ?? null))}::jsonb`;
const textArray = (a: string[]) => (a.length ? `ARRAY[${a.map(str).join(",")}]::text[]` : "ARRAY[]::text[]");
const num = (v: number | null | undefined) => (v == null ? "NULL" : String(v));

const out: string[] = ["-- Generado por seed-sql.ts. No editar a mano.", "BEGIN;", ""];

out.push(
  `INSERT INTO sellers (id, name, slug, is_house, updated_at) VALUES (gen_random_uuid(), 'Nitro Col Store', 'nitro-col', true, now())`,
  `ON CONFLICT (slug) DO NOTHING;`,
  "",
);

for (const [i, parent] of categories.entries()) {
  out.push(
    `INSERT INTO categories (id, name, slug, path, position, updated_at) VALUES (gen_random_uuid(), ${str(parent.name)}, ${str(parent.slug)}, ${str(parent.slug)}, ${i}, now())`,
    `ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, path = EXCLUDED.path, position = EXCLUDED.position, updated_at = now();`,
  );
  for (const [j, child] of parent.children.entries()) {
    out.push(
      `INSERT INTO categories (id, parent_id, name, slug, path, position, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM categories WHERE slug = ${str(parent.slug)}), ${str(child.name)}, ${str(child.slug)}, ${str(`${parent.slug}/${child.slug}`)}, ${j}, now())`,
      `ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, path = EXCLUDED.path, position = EXCLUDED.position, updated_at = now();`,
    );
  }
}
out.push("");

for (const p of products) {
  const ps = str(p.slug);
  out.push(
    `-- ${p.slug}`,
    `INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), ${str(p.brand)}, ${str(slugify(p.brand))}, now()) ON CONFLICT (slug) DO NOTHING;`,
    `INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, \"inBox\", faq, video_url, video_poster, created_at, updated_at)`,
    `VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = ${str(slugify(p.brand))}), (SELECT id FROM sellers WHERE slug = 'nitro-col'), ${str(p.name)}, ${ps}, ${str(p.tagline)}, ${str(p.description)}, 'published', ${num(p.featuredRank)}, ${str(p.theme)}, ${json(p.specs)}, ${textArray(p.tags ?? [])}, ${json(p.highlights)}, ${json(p.inBox ?? [])}, ${json(p.faq ?? [])}, ${str(p.videoUrl)}, ${str(p.videoPoster)}, clock_timestamp(), now())`,
    `ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, \"inBox\" = EXCLUDED.\"inBox\", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();`,
    `DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = ${ps});`,
    `INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = ${ps}), (SELECT id FROM categories WHERE slug = ${str(p.category)}));`,
    `DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = ${ps});`,
  );

  const image = (kind: string, im: { src: string; alt: string }, position: number, sku?: string) =>
    `INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = ${ps}), ${sku ? `(SELECT id FROM product_variants WHERE sku = ${str(sku)})` : "NULL"}, ${str(im.src)}, ${str(im.alt)}, ${str(kind)}, ${position});`;

  (p.images ?? []).forEach((im, pos) => out.push(image("gallery", im, pos)));

  for (const v of p.variants) {
    out.push(
      `INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)`,
      `VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = ${ps}), ${str(v.sku)}, ${str(v.label)}, ${str(v.swatch)}, ${num(v.priceCents)}, ${num(v.compareAtCents)}, ${DIMS.weightGrams}, ${DIMS.lengthMm}, ${DIMS.widthMm}, ${DIMS.heightMm}, clock_timestamp(), now())`,
      `ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();`,
      `INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = ${str(v.sku)}), ${v.stock}, now())`,
      `ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();`,
    );
    // Las fotos de la variante se borran al re-sembrar: DELETE por variante antes de insertar
    out.push(`DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = ${str(v.sku)});`);
    [...(v.images ?? []).map((im) => ["card", im] as const), ...(v.gallery ?? []).map((im) => ["gallery", im] as const)].forEach(
      ([kind, im], pos) => out.push(image(kind, im, pos, v.sku)),
    );
  }
  out.push("");
}

// El SQL Editor corta scripts grandes ("connection termination"): se reparte en partes pequeñas.
// Cada parte es independiente (brand, producto, variantes y fotos van juntos) y va en su propia transacción.
const MAX_CHARS = 25_000;
const blocks: string[][] = [];
for (const line of out) {
  if (line === "BEGIN;" || line === "COMMIT;") continue;
  if (line.startsWith("-- ") && blocks.length > 0) blocks.push([]);
  if (blocks.length === 0) blocks.push([]);
  blocks[blocks.length - 1]!.push(line);
}
const parts: string[][] = [];
let size = 0;
for (const b of blocks) {
  const n = b.join("\n").length;
  if (parts.length === 0 || size + n > MAX_CHARS) { parts.push([]); size = 0; }
  parts[parts.length - 1]!.push(...b);
  size += n;
}
const dir = new URL("./seed-partes/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const f of readdirSync(dir)) rmSync(new URL(f, dir));
parts.forEach((lines, i) => {
  const name = `parte-${String(i + 1).padStart(2, "0")}.sql`;
  writeFileSync(new URL(name, dir), ["BEGIN;", ...lines, "COMMIT;", ""].join("\n"));
});
console.log(`Escritas ${parts.length} partes en ${dir.pathname}`);
