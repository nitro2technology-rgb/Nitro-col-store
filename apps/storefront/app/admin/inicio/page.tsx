import { requireAdmin } from "@/lib/admin";
import { getSettings, isVideoUrl } from "@/lib/site-settings";
import { storageConfigured } from "@/lib/storage";
import { saveHome } from "../actions";
import { FilePicker } from "../file-picker";
import { SaveButton } from "../save-button";
import { card, CardHead, field, label, Notice, PageTitle } from "../ui";

export const metadata = { title: "Inicio" };

const IMG = "image/jpeg,image/png,image/webp";
const IMG_VIDEO = `${IMG},video/mp4,video/webm`;
const EXTRA = 3; // filas vacías para agregar nuevas en cada guardado

export default async function HomeAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; v?: string }> }) {
  await requireAdmin("/admin/inicio");
  const { ok, error, v } = await searchParams;
  const { db } = await import("@nitro/db");
  const products = await db.product.findMany({ where: { status: "published" }, orderBy: { name: "asc" }, select: { slug: true, name: true } });
  const s = await getSettings(true);
  const enabled = storageConfigured();
  const posts = [...s.posts, ...Array.from({ length: EXTRA }, () => null)];
  const reviews = [...s.reviews, ...Array.from({ length: EXTRA }, () => null)];

  return (
    <>
      <PageTitle sub="Productos destacados, publicaciones de Instagram y reseñas de Instagram de la página de inicio. Todo se guarda con un solo botón.">Inicio</PageTitle>
      {!enabled && (
        <p className="mt-6 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          Para guardar falta la variable <code>SUPABASE_SERVICE_ROLE_KEY</code> en el servidor.
        </p>
      )}
      <Notice ok={ok} error={error} />

      <form key={v ?? "0"} action={saveHome} className="mt-6 space-y-6">
        <section className={card}>
          <CardHead title="Productos destacados" sub="Elige hasta 5 productos: salen de primeros en «Productos destacados» del inicio, en este orden. El resto se completa solo." />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <label key={i} className={label}>
                Puesto {i + 1}
                <select name={`feat_${i}`} defaultValue={s.featured[i] ?? ""} className={`${field} mt-1`}>
                  <option value="">— Ninguno —</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        <section className={card}>
          <CardHead title="Instagram" sub="Las publicaciones salen en un carrusel; al tocar una, abre esa publicación en Instagram. Sube la foto, escribe la descripción y pega el enlace de la publicación." />
          <label className={`${label} mt-4`}>
            Enlace de tu perfil de Instagram
            <input name="instagramUrl" defaultValue={s.instagramUrl} placeholder="https://www.instagram.com/tu_usuario" maxLength={200} className={`${field} mt-1`} />
          </label>
          <input type="hidden" name="ig_n" value={posts.length} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {posts.map((p, i) => (
              <div key={i} className="rounded-[12px] border border-[#e6e6ee] p-4">
                <p className="text-[13px] font-semibold text-[#1d1b3a]">{p ? `Publicación ${i + 1}` : "Nueva publicación"}</p>
                {p && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.images.map((u, k) => (
                      <div key={u} className="w-[72px]">
                        <div className="size-[72px] overflow-hidden rounded-[10px] border border-[#e6e6ee] bg-[#f3f3f8]">
                          {isVideoUrl(u) ? (
                            <video src={`${u}#t=0.1`} muted playsInline preload="metadata" className="size-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u} alt="" className="size-full object-cover" />
                          )}
                        </div>
                        <input type="hidden" name={`ig_keep_${i}`} value={u} />
                        <label className="mt-1 flex items-center gap-1 text-[11px] text-red-700">
                          <input type="checkbox" name={`ig_rm_${i}`} value={u} /> Quitar {k + 1}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                <FilePicker name={`ig_image_${i}`} accept={IMG_VIDEO} multiple text={p ? "Agregar fotos o videos" : "Elegir fotos o videos"} />
                <p className="mt-1 text-[12px] text-[#6b6b80]">Hasta 5 fotos o videos por publicación (los que ya tiene cuentan). Fotos JPG, PNG o WebP de hasta 8 MB; videos MP4 o WebM de hasta 30 MB. El primero es la portada.</p>
                <label className={`${label} mt-3`}>
                  Descripción
                  <textarea name={`ig_caption_${i}`} defaultValue={p?.caption ?? ""} rows={2} maxLength={300} className={`${field} mt-1`} />
                </label>
                <label className={`${label} mt-3`}>
                  Enlace de la publicación
                  <input name={`ig_href_${i}`} defaultValue={p?.href ?? ""} placeholder="https://www.instagram.com/p/..." maxLength={300} className={`${field} mt-1`} />
                </label>
                <label className={`${label} mt-3`}>
                  Fecha (opcional)
                  <input name={`ig_date_${i}`} defaultValue={p?.date ?? ""} placeholder="23 de abril de 2024" maxLength={40} className={`${field} mt-1`} />
                </label>
                {p && (
                  <label className="mt-3 flex items-center gap-2 text-[13px] text-red-700">
                    <input type="checkbox" name={`ig_del_${i}`} /> Quitar esta publicación
                  </label>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={card}>
          <CardHead title="Reseñas de Instagram" sub="Sube la captura o foto de la reseña y escribe lo que dijo el cliente. Salen en el inicio, antes de Instagram y de las preguntas frecuentes." />
          <input type="hidden" name="rv_n" value={reviews.length} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reviews.map((r, i) => (
              <div key={i} className="rounded-[12px] border border-[#e6e6ee] p-4">
                <div className="flex gap-3">
                  <div className="size-20 shrink-0 overflow-hidden rounded-[10px] border border-[#e6e6ee] bg-[#f3f3f8]">
                    {r && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1d1b3a]">{r ? `Reseña ${i + 1}` : "Nueva reseña"}</p>
                    <FilePicker name={`rv_image_${i}`} accept={IMG} text={r ? "Cambiar imagen" : "Elegir imagen"} />
                  </div>
                </div>
                {r && <input type="hidden" name={`rv_keep_${i}`} value={r.image} />}
                <label className={`${label} mt-3`}>
                  Comentario
                  <textarea name={`rv_text_${i}`} defaultValue={r?.text ?? ""} rows={3} maxLength={400} className={`${field} mt-1`} />
                </label>
                <label className={`${label} mt-3`}>
                  Nombre o usuario (opcional)
                  <input name={`rv_name_${i}`} defaultValue={r?.name ?? ""} maxLength={60} className={`${field} mt-1`} />
                </label>
                {r && (
                  <label className="mt-3 flex items-center gap-2 text-[13px] text-red-700">
                    <input type="checkbox" name={`rv_del_${i}`} /> Quitar esta reseña
                  </label>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-[14px] border border-[#e6e6ee] bg-white/95 p-4 shadow-lg backdrop-blur">
          <SaveButton disabled={!enabled}>Guardar todo</SaveButton>
          <span className="text-[13px] text-[#6b6b80]">Al guardar aparecen 3 filas vacías nuevas para seguir agregando. Los cambios pueden tardar hasta 1 minuto en verse.</span>
        </div>
      </form>
    </>
  );
}
