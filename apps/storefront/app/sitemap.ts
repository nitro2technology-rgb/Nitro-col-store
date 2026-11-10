import type { MetadataRoute } from "next";
import { getExtraCategories, getProducts } from "@/lib/catalog";
import { allCategorySlugs } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await getExtraCategories(); // suma al listado las categorías creadas en el panel
  const products = await getProducts();
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...allCategorySlugs.map((slug) => ({ url: `${SITE_URL}/c/${slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/p/${p.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...["ayuda", "terminos", "privacidad"].map((s) => ({ url: `${SITE_URL}/${s}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.2 })),
  ];
}
