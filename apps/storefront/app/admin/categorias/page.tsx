import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { categories, isBuiltInCategory } from "@/lib/products";
import { createCategory, deleteCategory } from "../actions";
import { card, CardHead, field, label, Notice, PageTitle, primaryBtn } from "../ui";

export const metadata = { title: "Categorías" };

export default async function CategoriesAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin("/admin/categorias");
  const { ok, error } = await searchParams;
  const { db } = await import("@nitro/db");
  const rows = await db.category.findMany({
    where: { deletedAt: null },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  const tops = categories.map((c) => ({ ...c, row: rows.find((r) => r.slug === c.slug) })).filter((c) => c.row);
  const fromDb = process.env.CATALOG_SOURCE === "db";

  return (
    <>
      <PageTitle sub="Las categorías agrupan los productos en el menú y en la tienda.">Categorías</PageTitle>
      {!fromDb && (
        <p className="mt-6 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          La tienda está leyendo el catálogo del código: las categorías nuevas no se verán hasta poner <code>CATALOG_SOURCE=db</code>.
        </p>
      )}
      <Notice ok={ok} error={error} />

      <form action={createCategory} className={`${card} mt-6`}>
        <CardHead
          title="Crear categoría"
          sub="Va dentro de Moda o Tecnología y copia su diseño: en Moda, la misma portada, la lista por color con tarjetas de fotos y la ficha corta, igual que Gafas."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Nombre
            <input name="name" required minLength={2} maxLength={60} placeholder="Ej. Beanies" className={`${field} mt-1`} />
          </label>
          <label className={label}>
            ¿Dentro de cuál?
            <select name="parent" required defaultValue="" className={`${field} mt-1`}>
              <option value="" disabled>
                Elige una…
              </option>
              {tops.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" className={primaryBtn}>
            Crear categoría
          </button>
          <p className="text-[13px] text-[#6b6b80]">
            Después créale productos en{" "}
            <Link href="/admin/productos/nuevo" className="text-[#5b4fe0] underline">
              Producto nuevo
            </Link>
            . Una categoría de primer nivel nueva (como Moda) necesita diseño y se pide aparte.
          </p>
        </div>
      </form>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {tops.map((top) => {
          const kids = rows.filter((r) => r.parentId === top.row!.id);
          return (
            <section key={top.slug} className={card}>
              <CardHead title={top.name} sub={top.description} />
              <ul className="mt-4 divide-y divide-[#f0f0f5]">
                {kids.map((k) => (
                  <li key={k.id} className="flex items-center gap-3 py-2.5 text-[15px]">
                    <Link href={`/c/${k.slug}`} target="_blank" className="font-medium text-[#1d1b3a] hover:text-[#5b4fe0]">
                      {k.name}
                    </Link>
                    <span className="text-[13px] text-[#6b6b80]">
                      {k._count.products} {k._count.products === 1 ? "producto" : "productos"}
                    </span>
                    {isBuiltInCategory(k.slug) ? (
                      <span className="ml-auto text-[12px] text-[#a0a0b2]">Del código</span>
                    ) : (
                      <form action={deleteCategory} className="ml-auto">
                        <input type="hidden" name="id" value={k.id} />
                        <button
                          type="submit"
                          disabled={k._count.products > 0}
                          title={k._count.products > 0 ? "Tiene productos" : "Borrar"}
                          className="rounded-[8px] border border-[#dcdce6] px-3 py-1 text-[13px] font-semibold text-red-700 hover:border-red-400 disabled:opacity-30"
                        >
                          Borrar
                        </button>
                      </form>
                    )}
                  </li>
                ))}
                {kids.length === 0 && <li className="py-3 text-[14px] text-[#a0a0b2]">Sin subcategorías.</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
