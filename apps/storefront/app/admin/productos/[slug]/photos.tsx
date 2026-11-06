import { deletePhotoAction, movePhoto, uploadPhotos } from "../../actions";
import { card, CardHead, thumb } from "../../ui";

export type PhotoRow = { id: string; url: string; alt: string };
export type PhotoGroup = { key: string; title: string; hint: string; sku: string; kind: "card" | "gallery"; photos: PhotoRow[] };

const mini =
  "grid size-7 place-items-center rounded-[8px] border border-[#dcdce6] bg-white text-[14px] leading-none text-[#1d1b3a] hover:border-[#5b4fe0] hover:text-[#5b4fe0]";

export function Group({ slug, g, canUpload }: { slug: string; g: PhotoGroup; canUpload: boolean }) {
  return (
    <div className="border-t border-[#ececf3] pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-[15px] font-semibold text-[#1d1b3a]">{g.title}</h3>
      <p className="text-[13px] text-[#6b6b80]">{g.hint}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {g.photos.map((p, i) => (
          <div key={p.id} className="w-[132px]">
            <div className="relative aspect-square overflow-hidden rounded-[12px] border border-[#e6e6ee] bg-[#f3f3f8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(p.url)} alt={p.alt} loading="lazy" className="size-full object-contain p-1" />
              {i === 0 && g.kind === "card" && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-[#1d1b3a] px-2 py-0.5 text-[11px] font-semibold text-white">Portada</span>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex gap-1">
                <form action={movePhoto}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" disabled={i === 0} aria-label="Mover antes" className={`${mini} disabled:opacity-30`}>
                    ←
                  </button>
                </form>
                <form action={movePhoto}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" disabled={i === g.photos.length - 1} aria-label="Mover después" className={`${mini} disabled:opacity-30`}>
                    →
                  </button>
                </form>
              </div>
              <form action={deletePhotoAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" aria-label="Eliminar foto" className={`${mini} hover:!border-red-500 hover:!text-red-600`}>
                  ✕
                </button>
              </form>
            </div>
          </div>
        ))}
        {g.photos.length === 0 && <p className="py-4 text-[14px] text-[#a0a0b2]">Sin fotos.</p>}
      </div>
      {canUpload && (
        <form action={uploadPhotos} className="mt-3 flex flex-wrap items-center gap-3">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="sku" value={g.sku} />
          <input type="hidden" name="kind" value={g.kind} />
          <input
            type="file"
            name="files"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
            className="max-w-full text-[13px] file:mr-3 file:rounded-[8px] file:border file:border-[#dcdce6] file:bg-white file:px-3 file:py-1.5 file:text-[13px] file:font-semibold"
          />
          <button type="submit" className="rounded-[10px] bg-[#5b4fe0] px-4 py-1.5 text-[14px] font-semibold text-white hover:opacity-90">
            Subir
          </button>
        </form>
      )}
    </div>
  );
}

/** Fotos generales del producto (las de cada color van dentro de su tarjeta de color). */
export function PhotoManager({ slug, group, enabled }: { slug: string; group: PhotoGroup; enabled: boolean }) {
  return (
    <section className={`${card} mt-10`}>
      <CardHead title="Fotos generales" sub="Las fotos de cada color se cambian arriba, dentro de su color. Aquí van las que no son de un color en particular." />
      <div className="mt-5">
        <Group slug={slug} g={group} canUpload={enabled} />
      </div>
    </section>
  );
}

export function UploadNotice({ enabled }: { enabled: boolean }) {
  if (enabled) return null;
  return (
    <p className="mt-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
      Para subir fotos falta la variable <code>SUPABASE_SERVICE_ROLE_KEY</code> en el servidor. Mientras tanto puedes ordenar y quitar fotos.
    </p>
  );
}
