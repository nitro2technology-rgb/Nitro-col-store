// Ajustes editables de la página de inicio (panel: Admin → Inicio): productos destacados, publicaciones de Instagram y
// reseñas de Instagram. Se guardan en un solo JSON del bucket público "portadas" de Supabase Storage, sin tabla nueva.
import { COVERS } from "./covers";

export type IgPost = { image: string; caption: string; href: string };
export type IgReview = { image: string; text: string; name: string };
export type SiteSettings = {
  /** Slugs de los productos que salen primero en «Productos destacados» (hasta 5, en orden). */
  featured: string[];
  /** Perfil de Instagram (https://www.instagram.com/usuario). */
  instagramUrl: string;
  posts: IgPost[];
  reviews: IgReview[];
};

export const EMPTY_SETTINGS: SiteSettings = { featured: [], instagramUrl: "", posts: [], reviews: [] };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function rows<T>(v: unknown, f: (x: Record<string, unknown>) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const x of v) {
    if (x && typeof x === "object") {
      const r = f(x as Record<string, unknown>);
      if (r) out.push(r);
    }
  }
  return out;
}

/** Lee los ajustes. Nunca rompe la página: ante cualquier fallo devuelve los ajustes vacíos. */
export async function getSettings(fresh = false): Promise<SiteSettings> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return EMPTY_SETTINGS;
  try {
    const url = `${base}/storage/v1/object/public/${COVERS}/ajustes.json`;
    const res = await fetch(fresh ? `${url}?t=${Date.now()}` : url, fresh ? { cache: "no-store" } : { next: { revalidate: 60 } });
    if (!res.ok) return EMPTY_SETTINGS;
    const d = (await res.json()) as Partial<SiteSettings>;
    return {
      featured: Array.isArray(d.featured) ? d.featured.filter((s): s is string => typeof s === "string").slice(0, 5) : [],
      instagramUrl: str(d.instagramUrl, 200),
      posts: rows<IgPost>(d.posts, (x) => (typeof x.image === "string" && x.image ? { image: x.image, caption: str(x.caption, 300), href: str(x.href, 300) } : null)),
      reviews: rows<IgReview>(d.reviews, (x) => (typeof x.image === "string" && x.image ? { image: x.image, text: str(x.text, 400), name: str(x.name, 60) } : null)),
    };
  } catch {
    return EMPTY_SETTINGS;
  }
}
