import type { Product, ProductImage } from "@nitro/shared";
import { gafasModels } from "./gafas-data";

const photos = (dir: string, name: string, prefix: string, nums: number[], ext = "webp"): ProductImage[] =>
  nums.map((n) => ({ src: `/products/${dir}/${prefix}${n}.${ext}`, alt: `${name}, foto ${n}` }));

const gtideGallery: ProductImage[] = [
  ...photos("gtide-l42", "G-tide L42", "", [1, 2, 3]),
  ...photos("gtide-l42", "G-tide L42", "", [4], "avif"),
];

// Datos de ejemplo hasta conectar la API/BD. Precios en centavos de COP.
// `featuredRank` decide qué productos salen en la portada (menor número = primero).
const tech: Product[] = [
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
        gallery: photos("aurafit-fw5", "Aurafit Aurabuds FW5 azul", "azul-", [1, 2, 3, 4, 5, 6, 7]),
      },
      {
        sku: "AURAFIT-FW5-BEI", label: "Beige", swatch: "#d9c7a8", priceCents: 6500000, stock: 10,
        images: photos("aurafit-fw5", "Aurafit Aurabuds FW5 beige", "beige-principal-", [1, 2]),
        gallery: photos("aurafit-fw5", "Aurafit Aurabuds FW5 beige", "beige-", [1, 2, 3, 6]),
      },
    ],
  },
  {
    slug: "audifonos-gtide-l42",
    featuredRank: 2,
    name: "G-tide L42",
    brand: "G-tide",
    category: "audifonos",
    tagline: "Sonido directo, en cuatro colores.",
    description: "Audífonos inalámbricos pequeños, disponibles en negro, blanco, lila y rosado.",
    theme: "light",
    specs: { Conectividad: "Bluetooth", Colores: "Negro, Blanco, Lila, Rosado" },
    highlights: [{ title: "Compactos", body: "Livianos y fáciles de llevar a todas partes." }],
    images: gtideGallery,
    variants: [
      { sku: "GTIDE-L42-BLK", label: "Negro", swatch: "#1f2937", priceCents: 6990000, stock: 10, images: photos("gtide-l42", "G-tide L42 negro", "negro-principal-", [1, 2]), gallery: gtideGallery },
      { sku: "GTIDE-L42-WHT", label: "Blanco", swatch: "#f3f4f6", priceCents: 6990000, stock: 10, images: photos("gtide-l42", "G-tide L42 blanco", "blanco-principal-", [1, 2]) },
      { sku: "GTIDE-L42-LIL", label: "Lila", swatch: "#b7a3d6", priceCents: 6990000, stock: 10, images: photos("gtide-l42", "G-tide L42 lila", "lila-principal-", [1]) },
      { sku: "GTIDE-L42-ROS", label: "Rosado", swatch: "#f2b4c6", priceCents: 6990000, stock: 10, images: photos("gtide-l42", "G-tide L42 rosado", "rosado-principal-", [1]) },
    ],
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

// Gafas: una ficha por modelo y un color por variante. PRECIOS INVENTADOS (provisionales, en pesos):
// el dueño los reemplaza con los reales. priceCents 0 se muestra como "Precio por definir".
const gafasPesos: Record<string, number> = {
  barcelona: 49900, berlin: 39900, brooklyn: 44900, cat: 39900, europe: 42900, impact: 54900,
  malibu: 39900, miami: 42900, milan: 44900, moon: 39900, office: 39900, orlando: 42900,
  paris: 45900, versace: 59900, vintage: 39900, "x-treme": 54900,
};
/** Código corto del modelo: primeras tres letras (MIA, PAR...). */
const modelCode = (slug: string) => slug.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase();

const gafas: Product[] = gafasModels.map((m) => ({
  slug: `gafas-${m.slug}`,
  name: `Gafas ${m.name}`,
  brand: "Nitro Col",
  category: "gafas",
  tagline: `Modelo ${m.name}.`,
  description: `Gafas de sol modelo ${m.name}, disponibles en ${m.variants.length} ${m.variants.length === 1 ? "color" : "colores"}.`,
  theme: "light",
  tags: [m.slug === "impact" || m.slug === "x-treme" ? "Deportivas" : "Casuales"],
  specs: { Modelo: m.name, Colores: m.variants.map((v) => v.label).join(", ") },
  highlights: [],
  variants: m.variants.map((v, i) => ({
    sku: `GAF-${modelCode(m.slug)}-${String(i + 1).padStart(2, "0")}`,
    label: v.label,
    swatch: v.swatch,
    priceCents: (gafasPesos[m.slug] ?? 0) * 100,
    stock: 10,
    images: v.images.map((src, i) => ({ src, alt: `Gafas ${m.name} ${v.label}, foto ${i + 1}` })),
    gallery: v.gallery.map((src, i) => ({ src, alt: `Gafas ${m.name} ${v.label}, con modelo ${i + 1}` })),
  })),
}));

export const products: Product[] = [...tech, ...gafas];

// ───────────── Categorías (árbol de dos niveles) ─────────────

export type CategoryNode = {
  /** Si es true, la lista muestra cada color de cada modelo como tarjeta propia. */
  byColor?: boolean;
  /** Dos fotos de la portada de Moda (alta calidad); sin ellas, la categoría muestra solo su título. */
  cover?: { src: string; alt: string }[];
  slug: string;
  name: string;
  description: string;
  children: { slug: string; name: string }[];
};

export const categories: CategoryNode[] = [
  {
    slug: "tecnologia",
    byColor: true,
    name: "Tecnología",
    description: "Audio y relojes para tu día a día.",
    children: [
      { slug: "audifonos", name: "Audífonos" },
      { slug: "smartwatch", name: "Smartwatch" },
    ],
  },
  {
    slug: "moda",
    byColor: true,
    // Portada de Moda (la misma para sus subcategorías; una categoría nueva, como Beanies, puede traer la suya).
    cover: [
      { src: "/moda/portada-1.webp", alt: "Modelo con gafas de animal print" },
      { src: "/moda/portada-2.webp", alt: "Modelo con gafas negras" },
    ],
    name: "Moda",
    description: "Gafas y accesorios con estilo.",
    children: [{ slug: "gafas", name: "Gafas" }],
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

export function productsIn(slug: string, list: Product[] = products): Product[] {
  const found = findCategory(slug);
  if (!found) return [];
  const leaves = found.node ? found.node.children.map((c) => c.slug) : [slug];
  return list.filter((p) => leaves.includes(p.category));
}

export const featuredOf = (list: Product[] = products) =>
  list.filter((p) => p.featuredRank != null).sort((a, b) => a.featuredRank! - b.featuredRank!);

export const featuredProducts = featuredOf();

export const getProduct = (slug: string, list: Product[] = products) => list.find((p) => p.slug === slug);
/** Busca una variante por SKU junto con su producto. */
export function findVariant(sku: string, list: Product[] = products) {
  for (const product of list) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
  return undefined;
}

/** Moda y Tecnología se listan por color y usan la ficha corta (fotos, reseñas, recomendados). */
export const isEditorial = (p: Product) => !!findCategory(p.category)?.parent?.byColor;

/** Los productos sin precio (priceCents = 0) se muestran pero no se pueden comprar. */
export const isPriced = (cents: number) => cents > 0;

export const fromPrice = (p: Product) => Math.min(...p.variants.map((v) => v.priceCents));

/** Fotos de la sección "Galería" para el color elegido: sus fotos de producto y las extras, sin repetir. */
export function galleryImages(product: Product, sku?: string): ProductImage[] {
  const v = product.variants.find((x) => x.sku === sku) ?? product.variants[0];
  // Moda: la foto de portada de la tarjeta (la primera del color) no se repite en la galería.
  if (isEditorial(product)) return [...(v?.images ?? []).slice(1), ...(v?.gallery ?? [])];
  const own = [...(v?.images ?? []), ...(v?.gallery ?? [])];
  // Producto de un solo color o sin fotos por color: la galería general.
  const list = own.length > 0 && product.variants.length > 1 ? own : [...own, ...(product.images ?? [])];
  return list.filter((im, i) => list.findIndex((x) => x.src === im.src) === i);
}

/**
 * Familias de color de una variante, para filtrar y buscar. Una gafa puede tener varias:
 * "Negras lente amarillo" cuenta como Negro y como Amarillo. Beige y Habano son una sola familia.
 */
const colorWords: Record<string, string> = {
  negras: "Negro", negro: "Negro", negros: "Negro", blancas: "Blanco", blanco: "Blanco", blancos: "Blanco",
  beige: "Beige", habanas: "Beige", habano: "Beige", cafes: "Café", cafe: "Café",
  rosada: "Rosado", rosadas: "Rosado", rosado: "Rosado", rosados: "Rosado",
  rojas: "Rojo", rojo: "Rojo", amarilla: "Amarillo", amarillas: "Amarillo", amarillo: "Amarillo",
  azul: "Azul", azules: "Azul", grises: "Gris", gris: "Gris", animal: "Animal print", cebra: "Cebra",
  ghost: "Transparente", vino: "Vino", verde: "Verde", naranja: "Naranja", morado: "Morado", lila: "Lila", dorado: "Dorado",
};
export function colorFamilies(label: string): string[] {
  const words = label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
  const found = [...new Set(words.flatMap((w) => colorWords[w] ?? []))];
  return found.length > 0 ? found : [label];
}

/** Imágenes del carrusel de la tarjeta y la cabecera: las de la variante, o la galería general. */
export function variantImages(product: Product, sku?: string): ProductImage[] {
  const v = product.variants.find((x) => x.sku === sku) ?? product.variants[0];
  return v?.images ?? product.images ?? [];
}

// ───────────── Búsqueda ─────────────

export type SearchEntry = { key: string; href: string; title: string; subtitle: string; image?: string; haystack: string };

/** Texto sin tildes ni mayúsculas, para comparar. */
export const normalizeText = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Una entrada por producto, o por color cuando la categoría se lista por color (gafas). */
export function buildSearchIndex(list: Product[] = products): SearchEntry[] {
  return list.flatMap((p) => {
    const cat = findCategory(p.category);
    const catNames = [cat?.name, cat?.parent?.name].filter(Boolean).join(" ");
    const specs = Object.entries(p.specs).filter(([k]) => k !== "Colores").map(([, v]) => v);
    const base = [p.name, p.brand, p.tagline, catNames, ...(p.tags ?? []), ...specs].join(" ");
    if (cat?.parent?.byColor) {
      return p.variants.map((v) => ({
        key: v.sku,
        href: `/p/${p.slug}?color=${v.sku}`,
        title: p.name,
        subtitle: p.variants.length > 1 ? v.label : p.tagline,
        image: v.images?.[0]?.src,
        haystack: normalizeText(`${base} ${v.label} ${colorFamilies(v.label).join(" ")}`),
      }));
    }
    const colors = `${p.description} ${p.variants.map((v) => `${v.label} ${colorFamilies(v.label).join(" ")}`).join(" ")}`;
    return [{
      key: p.slug,
      href: `/p/${p.slug}`,
      title: p.name,
      subtitle: p.tagline,
      image: variantImages(p)[0]?.src,
      haystack: normalizeText(`${base} ${colors}`),
    }];
  });
}
