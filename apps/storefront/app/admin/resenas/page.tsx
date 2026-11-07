import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { dateTimeFmt } from "@/lib/order-status";
import { setReviewPublished } from "../actions";
import { card, ghostBtn, Notice, PageTitle, primaryBtn } from "../ui";

export const metadata = { title: "Reseñas" };

const FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "visibles", label: "Visibles" },
  { key: "ocultas", label: "Ocultas" },
];

export default async function ReviewsAdminPage({ searchParams }: { searchParams: Promise<{ ver?: string; ok?: string; error?: string }> }) {
  await requireAdmin("/admin/resenas");
  const { ver = "todas", ok, error } = await searchParams;
  const { db } = await import("@nitro/db");
  const reviews = await db.review.findMany({
    where: ver === "visibles" ? { published: true } : ver === "ocultas" ? { published: false } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { name: true, slug: true } }, order: { select: { number: true } } },
  });

  return (
    <>
      <PageTitle sub="Reseñas que dejan los clientes. Ocultar una la quita de la tienda sin borrarla; puedes volver a mostrarla.">Reseñas</PageTitle>
      <Notice ok={ok} error={error} />

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/resenas?ver=${f.key}`}
            className={`rounded-full px-4 py-1.5 text-[14px] ${f.key === ver ? "bg-[#5b4fe0] font-semibold text-white" : "border border-[#e6e6ee] bg-white text-[#3d3d55] hover:border-[#5b4fe0]"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className={`${card} mt-6 text-[15px] text-[#6b6b80]`}>No hay reseñas {ver === "todas" ? "todavía" : "aquí"}.</div>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className={`${card} ${r.published ? "" : "opacity-70"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-semibold text-[#1d1b3a]">
                    {"★".repeat(r.rating)}
                    <span className="text-[#c9c9d6]">{"★".repeat(5 - r.rating)}</span>{" "}
                    <Link href={`/p/${r.product.slug}`} className="hover:text-[#5b4fe0]">
                      {r.product.name}
                    </Link>
                  </p>
                  <p className="text-[13px] text-[#6b6b80]">
                    {r.authorName ?? "Sin nombre"}
                    {r.authorEmail ? ` · ${r.authorEmail}` : ""} · {dateTimeFmt.format(r.createdAt)}
                    {r.order ? ` · Compra verificada (NC-${r.order.number})` : ""}
                    {!r.published ? " · OCULTA" : ""}
                  </p>
                </div>
                <form action={setReviewPublished}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="publish" value={r.published ? "0" : "1"} />
                  <button className={r.published ? ghostBtn : primaryBtn}>{r.published ? "Ocultar" : "Mostrar"}</button>
                </form>
              </div>
              {r.title && <p className="mt-3 font-medium text-[#1d1b3a]">{r.title}</p>}
              {r.body && <p className="mt-1 whitespace-pre-line text-[15px] text-[#3d3d55]">{r.body}</p>}
              {r.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
