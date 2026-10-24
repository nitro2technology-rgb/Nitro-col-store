import type { Product, ProductImage } from "@nitro/shared";

/** Descuento por llevar varias gafas (de cualquier modelo y color). PORCENTAJES PROVISIONALES: el dueño los confirma. */
export const GAFAS_TIERS = [
  { min: 2, pct: 10 },
  { min: 3, pct: 15 },
  { min: 4, pct: 20 },
] as const;

export const gafasDiscountPct = (units: number) =>
  [...GAFAS_TIERS].reverse().find((t) => units >= t.min)?.pct ?? 0;

/** Texto común de la ficha de todas las gafas. */
export const GAFAS_BULLETS = [
  "Impuesto incluido. Envío calculado en el momento de pagar",
  "Lentes con protección UV400",
  "Diseño unisex",
  "Bisagras cómodas para máximo agarre y durabilidad",
  "Materiales livianos y altamente resistentes a impactos",
];

/** Gafa sugerida en "Lleva más y ahorra": solo lo que el navegador necesita. */
export type Recommendation = {
  slug: string;
  model: string;
  sku: string;
  priceCents: number;
  image?: ProductImage;
};

export const gafasModelName = (p: Product) => p.specs.Modelo ?? p.name;

/** Hasta 4 fotos del color: 2 de producto, 2 con modelo, y si faltan, se completa con las demás. */
export function mainPhotos(product: Product, sku: string, max = 4): ProductImage[] {
  const v = product.variants.find((x) => x.sku === sku) ?? product.variants[0];
  const own = v?.images ?? [];
  const model = v?.gallery ?? [];
  const picked = [...own.slice(0, 2), ...model.slice(0, 2)];
  const rest = [...own.slice(2), ...model.slice(2)];
  return [...picked, ...rest].slice(0, max);
}

/** Tres modelos distintos, primero los del mismo tipo (casuales/deportivas). */
export function recommendationsFor(product: Product, all: Product[]): Recommendation[] {
  const type = product.tags?.[0];
  return all
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .sort((a, b) => Number(b.tags?.[0] === type) - Number(a.tags?.[0] === type))
    .slice(0, 3)
    .flatMap((p) => {
      const v = p.variants.find((x) => x.stock > 0 && x.priceCents > 0);
      return v ? [{ slug: p.slug, model: gafasModelName(p), sku: v.sku, priceCents: v.priceCents, image: v.images?.[0] }] : [];
    });
}

/** Descuento por cantidad sobre las gafas de las filas del carrito (en centavos). */
export function gafasDiscount(rows: { product: { category: string }; variant: { priceCents: number }; qty: number }[]) {
  const gafas = rows.filter((r) => r.product.category === "gafas");
  const units = gafas.reduce((n, r) => n + r.qty, 0);
  const pct = gafasDiscountPct(units);
  const base = gafas.reduce((sum, r) => sum + r.variant.priceCents * r.qty, 0);
  return { units, pct, cents: Math.round((base * pct) / 100) };
}
