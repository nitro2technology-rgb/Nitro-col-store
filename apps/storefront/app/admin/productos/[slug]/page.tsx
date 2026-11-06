import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { updateProduct } from "../../actions";
import { card, CardHead, cop, field, Icon, label, Notice, primaryBtn, thumb } from "../../ui";
import { VariantForm, type VariantRow } from "../variant-form";

const SOLD = ["paid", "processing", "shipped", "delivered", "return_requested"] as const;
const pesos = (cents: number) => Math.round(cents / 100);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: `Editar ${(await params).slug}` };
}

export default async function ProductEdit({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { slug } = await params;
  await requireAdmin(`/admin/productos/${slug}`);
  const { ok, error } = await searchParams;

  const { db } = await import("@nitro/db");
  const p = await db.product.findUnique({
    where: { slug },
    include: {
      categories: { include: { category: { select: { name: true } } } },
      images: { orderBy: { position: "asc" }, select: { url: true, alt: true, variantId: true, kind: true } },
      variants: { where: { deletedAt: null }, orderBy: [{ position: "asc" }, { sku: "asc" }], include: { inventory: true } },
    },
  });
  if (!p || p.deletedAt) notFound();

  const sold = await db.orderItem.groupBy({
    by: ["variantId"],
    where: { variant: { productId: p.id }, order: { status: { in: [...SOLD] } } },
    _sum: { quantity: true, totalCents: true },
  });
  const units = sold.reduce((s, r) => s + (r._sum.quantity ?? 0), 0);
  const revenue = sold.reduce((s, r) => s + Number(r._sum.totalCents ?? 0n), 0);

  const rows: VariantRow[] = p.variants.map((v) => {
    const photo = p.images.find((im) => im.variantId === v.id && im.kind === "card") ?? p.images.find((im) => im.variantId === v.id);
    return {
      sku: v.sku,
      label: v.label,
      photo: photo ? { url: thumb(photo.url)!, alt: photo.alt } : undefined,
      regular: pesos(v.compareAtCents ?? v.priceCents),
      offer: v.compareAtCents ? pesos(v.priceCents) : null,
      cost: v.inventory?.unitCostCents != null ? pesos(v.inventory.unitCostCents) : null,
      stock: v.inventory?.onHand ?? 0,
      reserved: v.inventory?.reserved ?? 0,
      lowAt: v.inventory?.lowStockAt ?? 3,
    };
  });
  const cover = rows[0]?.photo ?? (p.images[0] ? { url: thumb(p.images[0].url)!, alt: p.images[0].alt } : undefined);
  const specs = Object.entries((p.specs ?? {}) as Record<string, string>)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const highlights = ((p.highlights ?? []) as { title: string; body: string }[]).map((h) => `${h.title} | ${h.body}`).join("\n");
  const inBox = ((p.inBox ?? []) as string[]).join("\n");

  return (
    <>
      <p className="text-[14px]">
        <Link href="/admin/productos" className="text-[#6b6b80] hover:text-[#5b4fe0]">
          ← Productos
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <div className="size-20 overflow-hidden rounded-[14px] border border-[#e6e6ee] bg-[#f3f3f8]">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt={cover.alt} className="size-full object-contain p-1.5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[clamp(24px,3.4vw,34px)] font-bold tracking-[-0.02em] text-[#1d1b3a]">{p.name}</h1>
          <p className="text-[14px] text-[#6b6b80]">
            {p.categories.map((c) => c.category.name).join(", ")} · {p.status === "published" ? "Visible en la tienda" : "Oculto"} · vendidos {units} ·{" "}
            {cop(revenue)} en ventas
          </p>
        </div>
        <Link
          href={`/p/${p.slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-[10px] border border-[#dcdce6] px-4 py-2 text-[14px] font-semibold hover:border-[#5b4fe0] hover:text-[#5b4fe0]"
        >
          <Icon name="ext" className="size-[18px]" /> Ver en la tienda
        </Link>
      </div>
      <Notice ok={ok} error={error} />

      <section className="mt-8">
        <CardHead
          title="Colores, precios y stock"
          sub="Precios en pesos, sin puntos. La ganancia no descuenta la comisión de pago ni el envío. Cada color se guarda por separado."
        />
        <div className="mt-4 space-y-4">
          {rows.map((v) => (
            <VariantForm key={v.sku} slug={p.slug} v={v} />
          ))}
        </div>
      </section>

      <form action={updateProduct} className={`${card} mt-10`}>
        <input type="hidden" name="slug" value={p.slug} />
        <CardHead title="Información del producto" sub="Lo que el cliente lee en la página del producto." />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className={`${label} md:col-span-2`}>
            Título
            <input name="name" required minLength={2} maxLength={120} defaultValue={p.name} className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Disponibilidad
            <select name="status" defaultValue={p.status} className={`${field} mt-1`}>
              <option value="published">Visible en la tienda</option>
              <option value="draft">Oculto (no se vende)</option>
            </select>
          </label>
          <label className={label}>
            Destacado en portada
            <input name="rank" inputMode="numeric" defaultValue={p.featuredRank ?? ""} placeholder="No destacado (1 = primero)" className={`${field} mt-1`} />
          </label>
          <label className={`${label} md:col-span-2`}>
            Frase corta (debajo del título)
            <input name="tagline" maxLength={200} defaultValue={p.tagline ?? ""} className={`${field} mt-1`} />
          </label>
          <label className={`${label} md:col-span-2`}>
            Descripción
            <textarea name="description" required minLength={10} maxLength={5000} rows={5} defaultValue={p.description} className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Especificaciones <span className="font-normal text-[#a0a0b2]">— una por línea: «Nombre: valor»</span>
            <textarea name="specs" rows={10} defaultValue={specs} className={`${field} mt-1 font-mono text-[13px]`} />
          </label>
          <label className={label}>
            Lo principal <span className="font-normal text-[#a0a0b2]">— una por línea: «Título | texto»</span>
            <textarea name="highlights" rows={10} defaultValue={highlights} className={`${field} mt-1 text-[14px]`} />
          </label>
          <label className={label}>
            En la caja <span className="font-normal text-[#a0a0b2]">— una cosa por línea</span>
            <textarea name="inBox" rows={4} defaultValue={inBox} className={`${field} mt-1 text-[14px]`} />
          </label>
          <div className="grid content-start gap-4">
            <label className={label}>
              Etiquetas <span className="font-normal text-[#a0a0b2]">— separadas por coma</span>
              <input name="tags" defaultValue={p.tags.join(", ")} className={`${field} mt-1`} />
            </label>
            <label className={label}>
              Video (enlace)
              <input name="videoUrl" defaultValue={p.videoUrl ?? ""} placeholder="https://…" className={`${field} mt-1`} />
            </label>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="submit" className={primaryBtn}>
            Guardar información
          </button>
          <p className="text-[13px] text-[#6b6b80]">La dirección de la página (/p/{p.slug}) no cambia aunque cambies el título. Las fotos se cambian aparte, por ahora en el código.</p>
        </div>
      </form>
    </>
  );
}
