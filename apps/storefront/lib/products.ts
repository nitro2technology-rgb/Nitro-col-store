import type { Product } from "@nitro/shared";

// Datos de ejemplo hasta conectar la API/BD. Precios en centavos de COP.
// `featuredRank` decide qué productos salen en la portada (menor número = primero).
export const products: Product[] = [
  {
    slug: "audifonos-aura-pro",
    name: "Aura Pro",
    brand: "Nitro",
    category: "audifonos",
    art: "headphones",
    featuredRank: 1,
    tagline: "Silencio que se siente.",
    description:
      "Audífonos inalámbricos con cancelación activa de ruido y hasta 30 horas de batería.",
    theme: "light",
    specs: {
      Batería: "30 horas",
      Conectividad: "Bluetooth 5.3",
      Cancelación: "Activa, 3 niveles",
      Peso: "250 g",
      Carga: "USB-C, 10 min = 5 h",
    },
    highlights: [
      { title: "Cancelación activa de ruido", body: "Aísla el entorno en la oficina, el bus o el avión, y deja pasar la voz cuando lo necesitas." },
      { title: "Una semana sin cargador", body: "Hasta 30 horas de música. Diez minutos de carga te dan cinco horas más." },
    ],
    inBox: ["Audífonos Aura Pro", "Estuche rígido", "Cable USB-C", "Cable de audio de 3,5 mm"],
    variants: [
      { sku: "AURA-PRO-BLK", label: "Negro", swatch: "#1f2937", priceCents: 49900000, compareAtCents: 59900000, stock: 12 },
      { sku: "AURA-PRO-WHT", label: "Blanco", swatch: "#ffffff", priceCents: 49900000, stock: 3 },
    ],
  },
  {
    slug: "audifonos-aura-lite",
    name: "Aura Lite",
    brand: "Nitro",
    category: "audifonos",
    art: "headphones",
    tagline: "Música ligera, todo el día.",
    description: "Audífonos de diadema livianos, con 40 horas de batería y micrófono integrado.",
    theme: "light",
    specs: { Batería: "40 horas", Conectividad: "Bluetooth 5.2", Peso: "190 g", Carga: "USB-C" },
    highlights: [
      { title: "Solo 190 gramos", body: "Tan livianos que olvidas que los llevas puestos." },
      { title: "40 horas de batería", body: "Para toda la semana, sin pensar en el cargador." },
    ],
    inBox: ["Audífonos Aura Lite", "Cable USB-C", "Bolsa de tela"],
    variants: [
      { sku: "AURA-LITE-BLK", label: "Negro", swatch: "#1f2937", priceCents: 24990000, stock: 20 },
      { sku: "AURA-LITE-WHT", label: "Blanco", swatch: "#ffffff", priceCents: 24990000, stock: 8 },
    ],
  },
  {
    slug: "smartwatch-forma-ultra",
    name: "Forma Ultra",
    brand: "Nitro",
    category: "smartwatch",
    art: "watch",
    featuredRank: 2,
    tagline: "Una fuerza de la naturaleza.",
    description:
      "Reloj inteligente en titanio con GPS de doble frecuencia y pantalla siempre activa.",
    theme: "dark",
    specs: {
      Caja: "49 mm, titanio",
      GPS: "Doble frecuencia",
      Resistencia: "Agua hasta 100 m",
      Batería: "Hasta 36 horas",
      Pantalla: "Siempre activa",
    },
    highlights: [
      { title: "GPS de precisión", body: "Rutas exactas en ciudad, montaña y mar, incluso entre edificios altos." },
      { title: "Titanio de grado aeroespacial", body: "Ligero, resistente a los golpes y hecho para durar años de entrenamiento." },
    ],
    inBox: ["Reloj Forma Ultra", "Correa de silicona", "Cable de carga magnético"],
    variants: [{ sku: "FORMA-ULTRA-49", label: "49 mm", priceCents: 349900000, stock: 5 }],
  },
  {
    slug: "smartwatch-forma-sport",
    name: "Forma Sport",
    brand: "Nitro",
    category: "smartwatch",
    art: "watch",
    tagline: "Tu ritmo, al día.",
    description: "Reloj deportivo con GPS, monitor cardíaco y siete días de batería.",
    theme: "dark",
    specs: { Caja: "Aluminio", GPS: "Integrado", Resistencia: "Agua hasta 50 m", Batería: "7 días" },
    highlights: [
      { title: "Siete días de batería", body: "Entrena toda la semana y carga el fin de semana." },
      { title: "Monitor cardíaco", body: "Frecuencia cardíaca en tiempo real, en reposo y en movimiento." },
    ],
    inBox: ["Reloj Forma Sport", "Correa deportiva", "Cable de carga"],
    variants: [
      { sku: "FORMA-SPORT-41", label: "41 mm", priceCents: 189900000, stock: 14 },
      { sku: "FORMA-SPORT-45", label: "45 mm", priceCents: 209900000, stock: 0 },
    ],
  },
  {
    slug: "lampara-luma-mesa",
    name: "Luma Mesa",
    brand: "Nitro",
    category: "lamparas",
    art: "lamp-table",
    featuredRank: 3,
    tagline: "La luz justa, a tu altura.",
    description: "Lámpara de mesa con luz cálida regulable y base de metal.",
    theme: "dark",
    specs: { Altura: "42 cm", Luz: "Cálida, 2700 K", Intensidad: "Regulable", Material: "Metal y tela" },
    highlights: [
      { title: "Luz cálida regulable", body: "De una luz tenue para leer a una luz plena para trabajar, con un solo giro." },
      { title: "Base de metal", body: "Estable y de acabado mate, se ve bien en la mesa de noche o en el escritorio." },
    ],
    inBox: ["Lámpara Luma Mesa", "Bombillo LED", "Guía de instalación"],
    variants: [{ sku: "LUMA-MESA-STD", label: "Estándar", priceCents: 18990000, stock: 9 }],
  },
  {
    slug: "lampara-luma-pie",
    name: "Luma Pie",
    brand: "Nitro",
    category: "lamparas",
    art: "lamp-floor",
    tagline: "Una esquina con calma.",
    description: "Lámpara de pie de 1,6 m, con pantalla en domo y luz difusa.",
    theme: "light",
    specs: { Altura: "160 cm", Luz: "Cálida, 2700 K", Material: "Acero y tela", Cable: "2 m" },
    highlights: [
      { title: "Luz difusa", body: "La pantalla en domo reparte la luz sin deslumbrar." },
      { title: "160 cm de altura", body: "Cabe en cualquier esquina de la sala o la habitación." },
    ],
    inBox: ["Lámpara Luma Pie", "Pantalla", "Bombillo LED"],
    variants: [{ sku: "LUMA-PIE-STD", label: "Estándar", priceCents: 34990000, stock: 4 }],
  },
  {
    slug: "accesorio-jarron-terra",
    name: "Jarrón Terra",
    brand: "Nitro",
    category: "accesorios-hogar",
    art: "vase",
    featuredRank: 4,
    tagline: "Cerámica con carácter.",
    description: "Jarrón de cerámica esmaltada, hecho para ramas secas o flores de tallo largo.",
    theme: "light",
    specs: { Altura: "28 cm", Material: "Cerámica esmaltada", Capacidad: "1,2 L", Cuidado: "Lavar a mano" },
    highlights: [
      { title: "Cerámica esmaltada", body: "Acabado liso por fuera y sellado por dentro, listo para agua." },
      { title: "Tres tonos", body: "Arcilla, arena o grafito, para combinar con cualquier espacio." },
    ],
    inBox: ["Jarrón Terra", "Base antideslizante"],
    variants: [
      { sku: "TERRA-ARC", label: "Arcilla", swatch: "#b9785a", priceCents: 12990000, stock: 18 },
      { sku: "TERRA-ARE", label: "Arena", swatch: "#d9c7a8", priceCents: 12990000, stock: 11 },
      { sku: "TERRA-GRA", label: "Grafito", swatch: "#4b5563", priceCents: 12990000, stock: 2 },
    ],
  },
  {
    slug: "accesorio-velas-brasa",
    name: "Velas Brasa",
    brand: "Nitro",
    category: "accesorios-hogar",
    art: "candles",
    tagline: "Tres alturas, una atmósfera.",
    description: "Set de tres velas de soja con bandeja de metal.",
    theme: "dark",
    specs: { Velas: "3 unidades", Cera: "Soja", Duración: "Hasta 40 horas cada una", Bandeja: "Metal" },
    highlights: [
      { title: "Cera de soja", body: "Se consume lento y parejo, sin humo negro." },
      { title: "Bandeja incluida", body: "Las tres velas juntas ya parecen una decoración." },
    ],
    inBox: ["3 velas de soja", "Bandeja de metal"],
    variants: [
      { sku: "BRASA-MAR", label: "Marfil", swatch: "#ededed", priceCents: 8990000, stock: 25 },
      { sku: "BRASA-GRA", label: "Grafito", swatch: "#4b5563", priceCents: 8990000, stock: 10 },
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
  {
    slug: "hogar",
    name: "Hogar",
    description: "Luz y detalles para tus espacios.",
    children: [
      { slug: "lamparas", name: "Lámparas" },
      { slug: "accesorios-hogar", name: "Accesorios para el hogar" },
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
