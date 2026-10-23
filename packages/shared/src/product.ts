import { z } from "zod";

export const themeSchema = z.enum(["light", "dark"]);
export type Theme = z.infer<typeof themeSchema>;

/** Ilustración provisional del producto, hasta contar con fotografía real. */
export const artSchema = z.enum(["headphones", "watch", "lamp-table", "lamp-floor", "vase", "candles"]);
export type Art = z.infer<typeof artSchema>;

export const imageSchema = z.object({ src: z.string(), alt: z.string() });
export type ProductImage = z.infer<typeof imageSchema>;

export const variantSchema = z.object({
  sku: z.string(),
  label: z.string(),
  /** Color de muestra en hex; la ilustración del producto lo usa. */
  swatch: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  compareAtCents: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  /** Carrusel de la tarjeta y de la cabecera para esta variante (ej. las fotos de un color). */
  images: z.array(imageSchema).optional(),
  /** Fotos extra de este color para la sección "Galería" (se muestran junto a `images`). */
  gallery: z.array(imageSchema).optional(),
});
export type Variant = z.infer<typeof variantSchema>;

export const productSchema = z.object({
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  /** Slug de la categoría hoja (ej. "audifonos"). */
  category: z.string(),
  tagline: z.string(),
  description: z.string(),
  theme: themeSchema,
  art: artSchema.optional(),
  /** Si tiene valor, aparece en la portada; menor número = primero. */
  featuredRank: z.number().int().optional(),
  specs: z.record(z.string(), z.string()),
  /** Etiquetas para filtrar y buscar (ej. "Deportivas"). */
  tags: z.array(z.string()).optional(),
  highlights: z.array(z.object({ title: z.string(), body: z.string() })),
  inBox: z.array(z.string()).optional(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  /** Galería general (sección "Galería"). Rutas bajo /public, ej. /products/aura-pro/1.jpg */
  images: z.array(imageSchema).optional(),
  videoUrl: z.string().optional(),
  videoPoster: z.string().optional(),
  variants: z.array(variantSchema).min(1),
});
export type Product = z.infer<typeof productSchema>;
