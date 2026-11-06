import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { cop, Icon, Notice, PageTitle, pct, thumb } from "../ui";

export const metadata = { title: "Productos" };

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "visibles", label: "En la tienda" },
  { key: "ocultos", label: "Ocultos" },
  { key: "poco", label: "Poco stock" },
  { key: "sin-costo", label: "Sin costo" },
] as const;

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; q?: string; ver?: string }> }) {
  await requireAdmin("/admin/productos");
  const { ok, error, q = "", ver = "todos" } = await searchParams;
  const search = q.trim().slice(0, 60);

  const { db } = await import("@nitro/db");
  const rows = await db.product.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { variants: { some: { sku: { contains: search, mode: "insensitive" } } } }] }
        : {}),
    },
    orderBy: [{ featuredRank: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    include: {
      categories: { include: { category: { select: { name: true } } } },
      images: { orderBy: { position: "asc" }, select: { url: true, alt: true, variantId: true, kind: true } },
      variants: { where: { deletedAt: null }, orderBy: [{ position: "asc" }, { sku: "asc" }], include: { inventory: true } },
    },
  });

  const products = rows
    .map((p) => {
      const first = p.variants[0];
      const photo =
        p.images.find((im) => im.variantId === first?.id && im.kind === "card") ?? p.images.find((im) => im.variantId === first?.id) ?? p.images[0];
      const stock = p.variants.reduce((s, v) => s + (v.inventory?.onHand ?? 0), 0);
      const low = p.variants.some((v) => (v.inventory?.onHand ?? 0) <= (v.inventory?.lowStockAt ?? 3));
      const missingCost = p.variants.some((v) => v.inventory?.unitCostCents == null);
      const prices = p.variants.map((v) => v.priceCents);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const onSale = p.variants.some((v) => v.compareAtCents);
      // Margen del primer color con costo, como referencia rápida.
      const withCost = p.variants.find((v) => v.inventory?.unitCostCents != null);
      const margin = withCost ? ((withCost.priceCents - withCost.inventory!.unitCostCents!) / withCost.priceCents) * 100 : null;
      return { p, photo, stock, low, missingCost, min, max, onSale, margin };
    })
    .filter(({ p, low, missingCost }) =>
      ver === "visibles" ? p.status === "published" : ver === "ocultos" ? p.status !== "published" : ver === "poco" ? low : ver === "sin-costo" ? missingCost : true,
    );
  const fromDb = process.env.CATALOG_SOURCE === "db";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle sub="Toca un producto para cambiar textos, precios, oferta, costo y stock.">Productos</PageTitle>
        <form action="/admin/productos" className="flex flex-wrap gap-2">
          <Link href="/admin/productos/nuevo" className="inline-flex items-center rounded-[10px] bg-[#5b4fe0] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#4a3fd0]">
            + Producto nuevo
          </Link>
          <input type="hidden" name="ver" value={ver} />
          <input
            name="q"
            defaultValue={search}
            placeholder="Buscar por nombre o código"
            aria-label="Buscar producto"
            className="w-64 rounded-[10px] border border-[#dcdce6] bg-white px-4 py-2 text-[14px]"
          />
        </form>
      </div>
      {!fromDb && (
        <p className="mt-6 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          La tienda está mostrando el catálogo escrito en el código, no el de la base: los cambios se guardan, pero no se verán en la tienda hasta
          poner <code>CATALOG_SOURCE=db</code>.
        </p>
      )}
      <Notice ok={ok} error={error} />

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/productos?ver=${f.key}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
            className={`rounded-full px-4 py-1.5 text-[14px] ${f.key === ver ? "bg-[#5b4fe0] font-semibold text-white" : "border border-[#e6e6ee] bg-white text-[#3d3d55] hover:border-[#5b4fe0]"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-10 text-[16px] text-[#6b6b80]">No hay productos con ese filtro.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map(({ p, photo, stock, low, missingCost, min, max, onSale, margin }) => (
            <li key={p.id}>
              <Link href={`/admin/productos/${p.slug}`} className={`group flex h-full flex-col rounded-[14px] border border-[#e6e6ee] bg-white transition hover:border-[#5b4fe0] hover:shadow-[0_6px_24px_-12px_rgba(91,79,224,0.35)]`}>
                <div className="relative aspect-square overflow-hidden rounded-t-[13px] bg-[#f3f3f8]">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb(photo.url)} alt={photo.alt} loading="lazy" className="size-full object-cover transition group-hover:scale-[1.03]" />
                  ) : (
                    <span className="grid size-full place-items-center text-[#a0a0b2]">
                      <Icon name="box" className="size-10" />
                    </span>
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {p.status !== "published" && <Chip className="bg-[#1d1b3a] text-white">Oculto</Chip>}
                    {p.featuredRank != null && <Chip className="bg-[#efedfd] text-[#4a3fd0]">Destacado {p.featuredRank}</Chip>}
                    {onSale && <Chip className="bg-rose-100 text-rose-800">Oferta</Chip>}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[12px] text-[#6b6b80]">{p.categories.map((c) => c.category.name).join(", ")}</p>
                  <h2 className="mt-0.5 line-clamp-2 text-[16px] font-semibold leading-snug text-[#1d1b3a]">{p.name}</h2>
                  <p className="mt-2 text-[17px] font-bold">{min === max ? cop(min) : `${cop(min)} – ${cop(max)}`}</p>
                  <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-[#f0f0f5] pt-3 text-[12px]">
                    <div>
                      <dt className="text-[#6b6b80]">Stock</dt>
                      <dd className={`text-[15px] font-semibold ${stock === 0 ? "text-red-700" : low ? "text-amber-700" : ""}`}>{stock === 0 ? "Agotado" : stock}</dd>
                    </div>
                    <div>
                      <dt className="text-[#6b6b80]">Colores</dt>
                      <dd className="text-[15px] font-semibold">{p.variants.length}</dd>
                    </div>
                    <div>
                      <dt className="text-[#6b6b80]">Margen</dt>
                      <dd className={`text-[15px] font-semibold ${missingCost && margin === null ? "text-[#a0a0b2]" : ""}`}>{margin === null ? "Sin costo" : pct(margin)}</dd>
                    </div>
                  </dl>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}>{children}</span>;
}
