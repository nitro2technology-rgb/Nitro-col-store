// Portada propia de cada página de categoría (Tecnología, Audífonos, Moda, Gafas…). Se edita en el panel (/admin/portadas).
// La portada es solo un medio —imagen, GIF o video— a todo el ancho de la página y de altura moderada, como la de
// inicio de la referencia: los textos, si los hay, van dentro de la imagen o el video. Se guarda en Supabase Storage
// (bucket público "portadas"), sin tabla nueva: un JSON por categoría. Sin portada guardada, la página conserva su diseño.
export const COVERS = "portadas";

export type CoverMedia = { url: string; type: "image" | "video" };

export type Cover = {
  /** Para computador. */
  media: CoverMedia;
  /** Para celular (opcional; si falta se usa el de computador). */
  mobile?: CoverMedia;
  /** Enlace opcional al tocar la portada (ej. /p/mi-producto o /c/gafas). */
  href?: string;
};

const parseMedia = (m: unknown): CoverMedia | undefined => {
  const x = m as Partial<CoverMedia> | undefined;
  return x && typeof x.url === "string" && (x.type === "image" || x.type === "video") ? { url: x.url, type: x.type } : undefined;
};

/** Lee la portada de una categoría. Nunca rompe la página: ante cualquier fallo devuelve null. */
export async function getCover(slug: string, fresh = false): Promise<Cover | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    const url = `${base}/storage/v1/object/public/${COVERS}/${slug}.json`;
    // En el panel se lee sin caché (lo recién guardado); en la tienda se guarda un minuto.
    const res = await fetch(fresh ? `${url}?t=${Date.now()}` : url, fresh ? { cache: "no-store" } : { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<Cover>;
    const media = parseMedia(data.media);
    if (!media) return null;
    return { media, mobile: parseMedia(data.mobile), href: typeof data.href === "string" && data.href ? data.href : undefined };
  } catch {
    return null;
  }
}
