// Portada propia de cada página de categoría (Tecnología, Audífonos, Moda, Gafas…). Se edita en el panel (/admin/portadas).
// Los textos y las fotos viven en Supabase Storage (bucket público "portadas"), sin tabla nueva: un JSON por categoría.
// Sin portada guardada, cada página conserva su diseño de siempre.
export const COVERS = "portadas";

export type Cover = {
  title: string;
  subtitle: string;
  /** Texto del botón (baja a los productos). */
  cta: string;
  /** Foto para computador. */
  image?: string;
  /** Foto para celular (opcional; si falta se usa la de computador). */
  mobileImage?: string;
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
    if (typeof data.title !== "string" || !data.title) return null;
    return {
      title: data.title,
      subtitle: typeof data.subtitle === "string" ? data.subtitle : "",
      cta: typeof data.cta === "string" && data.cta ? data.cta : "Ver colección",
      image: typeof data.image === "string" ? data.image : undefined,
      mobileImage: typeof data.mobileImage === "string" ? data.mobileImage : undefined,
    };
  } catch {
    return null;
  }
}
