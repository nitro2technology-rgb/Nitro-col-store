import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getCover } from "@/lib/covers";
import { storageConfigured } from "@/lib/storage";
import { removeCover, saveCover } from "../actions";
import { card, CardHead, field, label, Notice, PageTitle, primaryBtn } from "../ui";

export const metadata = { title: "Portadas" };

export default async function CoversAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin("/admin/portadas");
  const { ok, error } = await searchParams;
  const { db } = await import("@nitro/db");
  const cats = await db.category.findMany({ where: { deletedAt: null }, orderBy: [{ path: "asc" }], select: { slug: true, name: true, parentId: true } });
  const covers = await Promise.all(cats.map((c) => getCover(c.slug, true)));
  const enabled = storageConfigured();

  return (
    <>
      <PageTitle sub="Cada página de categoría puede tener su propia portada: foto grande, título, frase y botón.">Portadas</PageTitle>
      {!enabled && (
        <p className="mt-6 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          Para guardar portadas falta la variable <code>SUPABASE_SERVICE_ROLE_KEY</code> en el servidor.
        </p>
      )}
      <Notice ok={ok} error={error} />

      <div className="mt-6 space-y-5">
        {cats.map((c, i) => {
          const cover = covers[i];
          return (
            <section key={c.slug} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardHead
                  title={c.name}
                  sub={cover ? "Tiene portada propia." : "Sin portada propia: usa el diseño de siempre."}
                />
                <Link href={`/c/${c.slug}`} target="_blank" className="text-[14px] font-semibold text-[#5b4fe0] underline">
                  Ver página
                </Link>
              </div>
              <form action={saveCover} className="mt-4 grid gap-4 md:grid-cols-[200px_1fr]">
                <input type="hidden" name="slug" value={c.slug} />
                <div className="aspect-[4/3] overflow-hidden rounded-[10px] border border-[#e6e6ee] bg-[#f3f3f8]">
                  {cover?.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.image} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={label}>
                    Título
                    <input name="title" required maxLength={80} defaultValue={cover?.title ?? c.name} className={`${field} mt-1`} />
                  </label>
                  <label className={label}>
                    Texto del botón
                    <input name="cta" maxLength={30} defaultValue={cover?.cta ?? "Ver colección"} className={`${field} mt-1`} />
                  </label>
                  <label className={`${label} sm:col-span-2`}>
                    Frase debajo del título
                    <input name="subtitle" maxLength={140} defaultValue={cover?.subtitle ?? ""} className={`${field} mt-1`} />
                  </label>
                  <label className={label}>
                    Foto para computador <span className="font-normal text-[#a0a0b2]">— horizontal, la más grande</span>
                    <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-[13px]" />
                  </label>
                  <label className={label}>
                    Foto para celular <span className="font-normal text-[#a0a0b2]">— opcional, vertical</span>
                    <input type="file" name="mobile" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-[13px]" />
                    {cover?.mobileImage && (
                      <span className="mt-1 flex items-center gap-2 text-[12px] font-normal">
                        <input type="checkbox" name="dropMobile" /> Quitar la foto de celular actual
                      </span>
                    )}
                  </label>
                  <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                    <button type="submit" disabled={!enabled} className={primaryBtn}>
                      Guardar portada
                    </button>
                    {cover && (
                      <button
                        type="submit"
                        formAction={removeCover}
                        formNoValidate
                        disabled={!enabled}
                        className="rounded-[10px] border border-red-300 px-4 py-2 text-[14px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Quitar portada
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </section>
          );
        })}
      </div>
    </>
  );
}
