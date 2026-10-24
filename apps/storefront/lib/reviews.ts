import type { Product } from "@nitro/shared";

export type Review = { author: string; stars: number; date: string; text: string };

// Reseñas de ejemplo (INVENTADAS) hasta tener reseñas reales de clientes. Cuando existan,
// `reviewsFor` debe devolver solo las reales y estas se quitan.
const placeholders: Review[] = [
  { author: "Camila R.", stars: 5, date: "2026-09-14", text: "Muy livianas y cómodas, el color es tal cual la foto. Llegaron bien empacadas." },
  { author: "Andrés M.", stars: 5, date: "2026-09-27", text: "Buena calidad por el precio. Se sienten firmes y los lentes protegen del sol." },
  { author: "Valentina G.", stars: 5, date: "2026-10-03", text: "Me encantó el diseño, combinan con todo. Ya pedí otro color." },
  { author: "Juan P.", stars: 5, date: "2026-10-08", text: "Ajustan bien y no se resbalan. Las uso a diario y siguen como nuevas." },
];

const techPlaceholders: Review[] = [
  { author: "Laura S.", stars: 5, date: "2026-09-18", text: "Llegó rápido y funciona tal como se describe. Muy buena relación calidad-precio." },
  { author: "Sebastián T.", stars: 5, date: "2026-09-30", text: "Buen sonido y la batería rinde bastante. Se conecta al celular sin problemas." },
  { author: "Daniela V.", stars: 5, date: "2026-10-05", text: "Me gustó mucho el acabado, se ve mejor que en la foto. Lo recomiendo." },
  { author: "Felipe A.", stars: 5, date: "2026-10-10", text: "Cómodo y fácil de usar desde el primer día. Llegó bien empacado." },
];

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Reseñas reales del producto; si no hay, una de ejemplo con 5 estrellas. */
export function reviewsFor(product: Product & { reviews?: Review[] }): Review[] {
  if (product.reviews && product.reviews.length > 0) return product.reviews;
  const set = product.category === "gafas" ? placeholders : techPlaceholders;
  return [set[hash(product.slug) % set.length]!];
}
