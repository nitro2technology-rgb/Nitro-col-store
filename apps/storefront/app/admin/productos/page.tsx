import Link from "next/link";
import { buttonClasses } from "@nitro/ui";
import { requireAdmin } from "@/lib/admin";
import { updateFeatured, updateVariant } from "../actions";
import { card, field, Notice } from "../ui";

export const metadata = { title: "Productos" };

const pesos = (cents: number | null | undefined) => (cents ? String(Math.round(cents / 100)) : "");

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; q?: string }> }) {
  await requireAdmin("/admin/productos");
  const { ok, error, q = "" } = await searchParams;
  const search = q.trim().slice(0, 60);

  const { db } = await import("@nitro/db");
  const products = await db.product.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { variants: { some: { sku: { contains: search, mode: "insensitive" } } } }] }
        : {}),
    },
    orderBy: [{ featuredRank: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    include: {
      categories: { include: { category: { select: { name: true } } } },
      variants: { where: { deletedAt: null }, orderBy: [{ position: "asc" }, { sku: "asc" }], include: { inventory: true } },
    },
  });
  const fromDb = process.env.CATALOG_SOURCE === "db";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[clamp(32px,5vw,48px)]">Productos</h1>
        <form action="/admin/productos" className="flex gap-2">
          <input name="q" defaultValue={search} placeholder="Nombre o código" aria-label="Buscar producto" className="w-52 rounded-full border border-ink/20 bg-white/80 px-4 py-1.5 text-[14px]" />
        </form>
      </div>
      {!fromDb && (
        <p className="mt-6 rounded-[12px] bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          La tienda está mostrando el catálogo escrito en el código, no el de la base: los cambios de aquí se guardan, pero no se verán en la
          tienda hasta poner <code>CATALOG_SOURCE=db</code> en Render (o en <code>.env.local</code> para probar).
        </p>
      )}
      <Notice ok={ok} error={error} />
      <p className="mt-6 text-[15px] text-muted">
        Precios en pesos, sin puntos ni decimales. "Precio anterior" muestra el precio tachado (déjalo vacío si no hay descuento). Los cambios se
        ven en la tienda en unos segundos.
      </p>

      <div className="mt-6 space-y-6">
        {products.map((p) => (
          <section key={p.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[19px] font-semibold">
                  <Link href={`/p/${p.slug}`} target="_blank" className="hover:underline">
                    {p.name}
                  </Link>
                </h2>
                <p className="text-[13px] text-muted">
                  {p.categories.map((c) => c.category.name).join(", ")} · {p.variants.length} {p.variants.length === 1 ? "variante" : "colores"}
                  {p.status !== "published" && " · no publicado"}
                </p>
              </div>
              <form action={updateFeatured} className="flex items-end gap-2">
                <input type="hidden" name="slug" value={p.slug} />
                <label className="text-[13px] text-muted">
                  Destacado en portada (1 = primero)
                  <input name="rank" inputMode="numeric" defaultValue={p.featuredRank ?? ""} placeholder="No" className={`${field} mt-1 w-28`} />
                </label>
                <button type="submit" className={buttonClasses("ghost", "!px-4 !py-2 !text-[14px]")}>
                  Guardar
                </button>
              </form>
            </div>

            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[640px] divide-y divide-ink/10">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr_auto] gap-3 pb-2 text-[13px] text-muted">
                  <span>Color / código</span>
                  <span>Precio</span>
                  <span>Precio anterior</span>
                  <span>Stock</span>
                  <span />
                </div>
                {p.variants.map((v) => (
                  <form key={v.id} action={updateVariant} className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr_auto] items-center gap-3 py-2">
                    <input type="hidden" name="sku" value={v.sku} />
                    <span className="text-[15px]">
                      {v.label} <span className="block text-[12px] text-muted">{v.sku}</span>
                    </span>
                    <input name="price" inputMode="numeric" required defaultValue={pesos(v.priceCents)} aria-label={`Precio de ${v.label}`} className={field} />
                    <input name="compareAt" inputMode="numeric" defaultValue={pesos(v.compareAtCents)} aria-label={`Precio anterior de ${v.label}`} className={field} />
                    <input name="stock" inputMode="numeric" required defaultValue={v.inventory?.onHand ?? 0} aria-label={`Stock de ${v.label}`} className={field} />
                    <button type="submit" className={buttonClasses("buy", "!px-4 !py-2 !text-[14px]")}>
                      Guardar
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
