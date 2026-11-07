import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getCover, type CoverMedia } from "@/lib/covers";
import { storageConfigured } from "@/lib/storage";
import { removeCover, saveCovers } from "../actions";
import { FilePicker } from "../file-picker";
import { card, CardHead, field, label, Notice, PageTitle, primaryBtn } from "../ui";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";

export const metadata = { title: "Portadas" };

function Preview({ m }: { m?: CoverMedia }) {
  if (!m) return <span className="grid size-full place-items-center text-[13px] text-[#a0a0b2]">Sin portada</span>;
  return m.type === "video" ? (
    <video src={m.url} muted loop playsInline autoPlay className="size-full object-cover" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m.url} alt="" className="size-full object-cover" />
  );
}

export default async function CoversAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin("/admin/portadas");
  const { ok, error } = await searchParams;
  const { db } = await import("@nitro/db");
  const cats = await db.category.findMany({ where: { deletedAt: null }, orderBy: [{ path: "asc" }], select: { slug: true, name: true } });
  const covers = await Promise.all(cats.map((c) => getCover(c.slug, true)));
  const enabled = storageConfigured();

  return (
    <>
      <PageTitle sub="La portada de cada página es una imagen, un GIF o un video a todo el ancho de la página, con una altura moderada. Si lleva texto, va dentro de la imagen.">
        Portadas
      </PageTitle>
      {!enabled && (
        <p className="mt-6 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          Para guardar portadas falta la variable <code>SUPABASE_SERVICE_ROLE_KEY</code> en el servidor.
        </p>
      )}
      <Notice ok={ok} error={error} />
      <p className="mt-4 text-[14px] text-[#6b6b80]">
        Medida recomendada para computador: <b>2600 × 1000 px</b> (proporción 2,6 : 1). Para celular, vertical <b>1080 × 1440 px</b> (3 : 4, ocupa casi toda la pantalla; si no subes una, se recorta la de computador). JPG, PNG, WebP, GIF, MP4 o WebM de menos de 20 MB.
      </p>

      <form action={saveCovers} className="mt-6 space-y-5">
        {cats.map((c, i) => {
          const cover = covers[i];
          return (
            <section key={c.slug} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardHead title={c.name} sub={cover ? "Tiene portada propia." : "Sin portada propia: usa el diseño de siempre."} />
                <Link href={`/c/${c.slug}`} target="_blank" className="text-[14px] font-semibold text-[#5b4fe0] underline">
                  Ver página
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-[1fr_110px] gap-4 md:grid-cols-[1fr_150px]">
                  <div className="aspect-[2.6/1] self-start overflow-hidden rounded-[10px] border border-[#e6e6ee] bg-[#f3f3f8]">
                    <Preview m={cover?.media} />
                  </div>
                  <div className="aspect-[3/4] overflow-hidden rounded-[10px] border border-[#e6e6ee] bg-[#f3f3f8]">
                    <Preview m={cover?.mobile} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={label}>
                    Portada para computador <span className="font-normal text-[#a0a0b2]">— imagen, GIF o video</span>
                    <FilePicker name={`media__${c.slug}`} accept={ACCEPT} />
                  </label>
                  <label className={label}>
                    Portada para celular <span className="font-normal text-[#a0a0b2]">— opcional</span>
                    <FilePicker name={`mobile__${c.slug}`} accept={ACCEPT} />
                    {cover?.mobile && (
                      <span className="mt-1 flex items-center gap-2 text-[12px] font-normal">
                        <input type="checkbox" name={`drop__${c.slug}`} /> Quitar la portada de celular actual
                      </span>
                    )}
                  </label>
                  <label className={`${label} sm:col-span-2`}>
                    Enlace al tocar la portada <span className="font-normal text-[#a0a0b2]">— opcional, ej. /p/aurafit o /c/gafas</span>
                    <input name={`href__${c.slug}`} maxLength={200} defaultValue={cover?.href ?? ""} className={`${field} mt-1`} />
                  </label>
                </div>
                {cover && (
                  <button
                    type="submit"
                    name="slug"
                    value={c.slug}
                    formAction={removeCover}
                    formNoValidate
                    disabled={!enabled}
                    className="rounded-[10px] border border-red-300 px-4 py-2 text-[14px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Quitar esta portada
                  </button>
                )}
              </div>
            </section>
          );
        })}
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-[14px] border border-[#e6e6ee] bg-white/95 p-4 shadow-lg backdrop-blur">
          <button type="submit" disabled={!enabled} className={primaryBtn}>
            Guardar todas las portadas
          </button>
          <span className="text-[13px] text-[#6b6b80]">Elige los archivos de todas las categorías que quieras y guarda una sola vez. Solo se guardan las que tengan cambios.</span>
        </div>
      </form>
    </>
  );
}
