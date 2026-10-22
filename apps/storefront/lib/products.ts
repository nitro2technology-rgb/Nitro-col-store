import type { Product, ProductImage } from "@nitro/shared";

const photos = (dir: string, name: string, prefix: string, nums: number[], ext = "webp"): ProductImage[] =>
  nums.map((n) => ({ src: `/products/${dir}/${prefix}${n}.${ext}`, alt: `${name}, foto ${n}` }));

const gtide: ProductImage[] = [
  ...photos("gtide-l42", "G-tide L42", "", [1, 2, 3]),
  ...photos("gtide-l42", "G-tide L42", "", [4], "avif"),
];

// Datos de ejemplo hasta conectar la API/BD. Precios en centavos de COP.
// `featuredRank` decide qué productos salen en la portada (menor número = primero).
export const products: Product[] = [
  {
    slug: "audifonos-aurafit-fw5",
    featuredRank: 1,
    name: "Aurafit Aurabuds FW5",
    brand: "Aurafit",
    category: "audifonos",
    tagline: "Música sin cables, en dos colores.",
    description: "Audífonos inalámbricos pequeños y cómodos, disponibles en azul y beige.",
    theme: "light",
    specs: { Conectividad: "Bluetooth", Colores: "Azul, Beige" },
    highlights: [
      { title: "Pequeños y livianos", body: "Caben en el bolsillo y se olvidan puestos." },
      { title: "Dos colores", body: "Elige azul o beige, al mismo precio." },
    ],
    images: [
      ...photos("aurafit-fw5", "Aurafit Aurabuds FW5 azul", "azul-", [1, 2, 3, 4, 5, 6, 7]),
      ...photos("aurafit-fw5", "Aurafit Aurabuds FW5 beige", "beige-", [1, 2, 3, 6]),
    ],
    variants: [
      {
        sku: "AURAFIT-FW5-AZL", label: "Azul", swatch: "#3b6fb6", priceCents: 6500000, stock: 10,
        images: photos("aurafit-fw5", "Aurafit Aurabuds FW5 azul", "principal-", [1, 2, 3]),
      },
      {
        sku: "AURAFIT-FW5-BEI", label: "Beige", swatch: "#d9c7a8", priceCents: 6500000, stock: 10,
        images: photos("aurafit-fw5", "Aurafit Aurabuds FW5 beige", "beige-", [1, 2, 3, 6]),
      },
    ],
  },
  {
    slug: "audifonos-gtide-l42",
    featuredRank: 2,
    name: "G-tide L42",
    brand: "G-tide",
    category: "audifonos",
    tagline: "Sonido directo, en negro.",
    description: "Audífonos inalámbricos pequeños en color negro.",
    theme: "light",
    specs: { Conectividad: "Bluetooth", Color: "Negro" },
    highlights: [{ title: "Compactos", body: "Livianos y fáciles de llevar a todas partes." }],
    images: gtide,
    variants: [{ sku: "GTIDE-L42-BLK", label: "Negro", swatch: "#1f2937", priceCents: 6990000, stock: 10, images: gtide }],
  },
  {
    slug: "smartwatch-x8-pro",
    featuredRank: 3,
    name: "Smartwatch X8 Pro 7+1",
    brand: "X8 Pro",
    category: "smartwatch",
    tagline: "Un reloj, ocho correas.",
    description: "Smartwatch con pantalla HD de 2,19\", llamadas por Bluetooth, notificaciones y 7 correas más la del reloj.",
    theme: "dark",
    specs: { Pantalla: "2,19\" HD", Llamadas: "Bluetooth", Notificaciones: "Sí", Correas: "7 + 1" },
    highlights: [
      { title: "Llamadas desde la muñeca", body: "Contesta por Bluetooth sin sacar el celular." },
      { title: "Siete correas extra", body: "Cambia de estilo cuando quieras." },
    ],
    images: photos("smartwatch-x8-pro", "Smartwatch X8 Pro", "", [1, 2, 3, 4], "avif"),
    videoUrl: "/products/smartwatch-x8-pro/video.mp4",
    videoPoster: "/products/smartwatch-x8-pro/principal-1.webp",
    variants: [
      {
        sku: "SW-X8PRO", label: "Único", priceCents: 9500000, stock: 10,
        images: photos("smartwatch-x8-pro", "Smartwatch X8 Pro", "principal-", [1, 2, 3, 4]),
      },
    ],
  },
];

// ───────────── Categorías (árbol de dos niveles) ─────────────

export type CategoryNode = {
  slug: string;
  name: string;
  description: string;
  children: { slug: string; name: string }[];
};

export const categories: CategoryNode[] = [
  {
    slug: "tecnologia",
    name: "Tecnología",
    description: "Audio y relojes para tu día a día.",
    children: [
      { slug: "audifonos", name: "Audífonos" },
      { slug: "smartwatch", name: "Smartwatch" },
    ],
  },
];

export const allCategorySlugs = categories.flatMap((c) => [c.slug, ...c.children.map((x) => x.slug)]);

/** Devuelve la categoría (padre u hoja) y, si es hoja, su padre. */
export function findCategory(slug: string) {
  for (const parent of categories) {
    if (parent.slug === slug) return { name: parent.name, slug, parent: undefined, node: parent };
    const child = parent.children.find((c) => c.slug === slug);
    if (child) return { name: child.name, slug, parent, node: undefined };
  }
  return undefined;
}

export const categoryName = (slug: string) => findCategory(slug)?.name ?? slug;

export function productsIn(slug: string): Product[] {
  const found = findCategory(slug);
  if (!found) return [];
  const leaves = found.node ? found.node.children.map((c) => c.slug) : [slug];
  return products.filter((p) => leaves.includes(p.category));
}

export const featuredProducts = products
  .filter((p) => p.featuredRank != null)
  .sort((a, b) => a.featuredRank! - b.featuredRank!);

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
/** Busca una variante por SKU junto con su producto. */
export function findVariant(sku: string) {
  for (const product of products) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
  return undefined;
}

export const fromPrice = (p: Product) => Math.min(...p.variants.map((v) => v.priceCents));

/** Imágenes del carrusel de la tarjeta y la cabecera: las de la variante, o la galería general. */
export function variantImages(product: Product, sku?: string): ProductImage[] {
  const v = product.variants.find((x) => x.sku === sku) ?? product.variants[0];
  return v?.images ?? product.images ?? [];
}
