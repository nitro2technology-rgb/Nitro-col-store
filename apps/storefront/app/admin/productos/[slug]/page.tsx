import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { Fragment } from "react";
import { addVariant, deletePhotosAction, removeVariant, saveProduct } from "../../actions";
import { DeleteSelectedButton, SaveButton } from "../../save-button";
import { card, CardHead, cop, field, Icon, label, Notice, primaryBtn, thumb } from "../../ui";
import { getPalette } from "../../palette";
import { storageConfigured } from "@/lib/storage";
import { ColorFields } from "../color-fields";
import { VariantForm, type VariantRow } from "../variant-form";
import { Group, PhotoManager, UploadNotice, type PhotoGroup } from "./photos";

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
  searchParams: Promise<{ ok?: string; error?: string; v?: string }>;
}) {
  const { slug } = await params;
  await requireAdmin(`/admin/productos/${slug}`);
  const { ok, error, v } = await searchParams;

  const { db } = await import("@nitro/db");
  const p = await db.product.findUnique({
    where: { slug },
    include: {
      categories: { include: { category: { select: { name: true } } } },
      images: { orderBy: { position: "asc" }, select: { id: true, url: true, alt: true, variantId: true, kind: true } },
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
      swatch: v.swatch,
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

  const canUpload = storageConfigured();
  const F = "producto-todo"; // formulario único: guarda la información, todos los colores y las fotos
  const palette = await getPalette();
  const groupsOf = (v: (typeof p.variants)[number]): PhotoGroup[] => [
    {
      key: `${v.sku}-card`,
      title: "Fotos principales",
      hint: "Son las que se ven primero: la foto grande de la ficha con sus miniaturas al lado (hasta 8) y la tarjeta del catálogo. La primera es la portada de este color.",
      sku: v.sku,
      kind: "card",
      photos: p.images.filter((im) => im.variantId === v.id && im.kind === "card"),
    },
    {
      key: `${v.sku}-gallery`,
      title: "Galería",
      hint: "Salen en la galería de la ficha: la columna de fotos grandes debajo de la información del producto (por ejemplo, con modelo o en uso). No aparecen entre las miniaturas.",
      sku: v.sku,
      kind: "gallery",
      photos: p.images.filter((im) => im.variantId === v.id && im.kind === "gallery"),
    },
  ];
  const general: PhotoGroup = {
    key: "general",
    title: "Fotos generales del producto",
    hint: "No pertenecen a un color en particular.",
    sku: "",
    kind: "gallery",
    photos: p.images.filter((im) => im.variantId === null),
  };

  return (
    <Fragment key={v ?? "0"}>
      <form id={F} action={saveProduct}>
        <input type="hidden" name="slug" value={p.slug} />
      </form>
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
          sub="Cada color tiene su nombre, el color del círculo, precio, stock y fotos. Todo se guarda junto con el botón «Guardar todo» de abajo: datos de todos los colores, información del producto y fotos elegidas. Ordenar o borrar fotos sí se hace al instante."
        />
        <div className="mt-4 space-y-4">
          {rows.map((v, i) => (
            <VariantForm key={v.sku} v={v} form={F} palette={palette}>
              {groupsOf(p.variants[i]!).map((g) => (
                <Group key={g.key} slug={p.slug} g={g} canUpload={canUpload} />
              ))}
            </VariantForm>
          ))}
          <UploadNotice enabled={canUpload} />
        </div>
      </section>

      <form action={addVariant} className={`${card} mt-6`}>
        <input type="hidden" name="slug" value={p.slug} />
        <CardHead title="Agregar un color o versión" sub="Después de crearlo, sube sus fotos en la sección Fotos." />
        <ColorFields palette={palette} />
        <div className="mt-5">
          <button type="submit" className={primaryBtn}>
            Agregar color
          </button>
        </div>
      </form>

      {rows.length > 1 && (
        <details className="mt-4 text-[14px]">
          <summary className="cursor-pointer text-[#6b6b80] hover:text-[#5b4fe0]">Quitar un color de la tienda</summary>
          <form action={removeVariant} className="mt-3 flex flex-wrap items-center gap-3">
            <input type="hidden" name="slug" value={p.slug} />
            <select name="sku" required defaultValue="" className={`${field} max-w-xs`}>
              <option value="" disabled>
                Elige el color…
              </option>
              {rows.map((v) => (
                <option key={v.sku} value={v.sku}>
                  {v.label} ({v.sku})
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-[10px] border border-red-300 px-4 py-2 font-semibold text-red-700 hover:bg-red-50">
              Quitar color
            </button>
            <span className="text-[13px] text-[#6b6b80]">Deja de venderse; los pedidos anteriores no se afectan.</span>
          </form>
        </details>
      )}

      <PhotoManager slug={p.slug} group={general} enabled={canUpload} />

      <div className={`${card} mt-10`}>
        <CardHead title="Información del producto" sub="Lo que el cliente lee en la página del producto." />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className={`${label} md:col-span-2`}>
            Título
            <input name="name" form={F} required minLength={2} maxLength={120} defaultValue={p.name} className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Disponibilidad
            <select name="status" form={F} defaultValue={p.status} className={`${field} mt-1`}>
              <option value="published">Visible en la tienda</option>
              <option value="draft">Oculto (no se vende)</option>
            </select>
          </label>
          <label className={label}>
            Destacado en portada
            <input name="rank" form={F} inputMode="numeric" defaultValue={p.featuredRank ?? ""} placeholder="No destacado (1 = primero)" className={`${field} mt-1`} />
          </label>
          <label className={`${label} md:col-span-2`}>
            Frase corta (debajo del título)
            <input name="tagline" form={F} maxLength={200} defaultValue={p.tagline ?? ""} className={`${field} mt-1`} />
          </label>
          <label className={`${label} md:col-span-2`}>
            Descripción
            <textarea name="description" form={F} required minLength={10} maxLength={5000} rows={5} defaultValue={p.description} className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Especificaciones <span className="font-normal text-[#a0a0b2]">— una por línea: «Nombre: valor»</span>
            <textarea name="specs" form={F} rows={10} defaultValue={specs} className={`${field} mt-1 font-mono text-[13px]`} />
          </label>
          <label className={label}>
            Lo principal <span className="font-normal text-[#a0a0b2]">— una por línea: «Título | texto»</span>
            <textarea name="highlights" form={F} rows={10} defaultValue={highlights} className={`${field} mt-1 text-[14px]`} />
          </label>
          <label className={label}>
            En la caja <span className="font-normal text-[#a0a0b2]">— una cosa por línea</span>
            <textarea name="inBox" form={F} rows={4} defaultValue={inBox} className={`${field} mt-1 text-[14px]`} />
          </label>
          <div className="grid content-start gap-4">
            <label className={label}>
              Etiquetas <span className="font-normal text-[#a0a0b2]">— separadas por coma</span>
              <input name="tags" form={F} defaultValue={p.tags.join(", ")} className={`${field} mt-1`} />
            </label>
            <label className={label}>
              Video (enlace)
              <input name="videoUrl" form={F} defaultValue={p.videoUrl ?? ""} placeholder="https://…" className={`${field} mt-1`} />
            </label>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-[#6b6b80]">La dirección de la página (/p/{p.slug}) no cambia aunque cambies el título.</p>
      </div>

      <div className="sticky bottom-4 z-10 mt-8 flex flex-wrap items-center gap-3 rounded-[14px] border border-[#e6e6ee] bg-white/95 p-4 shadow-lg backdrop-blur">
        <SaveButton form={F} pendingText="Guardando todo… no cierres esta página">
          Guardar todo
        </SaveButton>
        {canUpload && (
          <>
            <span className="mx-1 hidden h-6 w-px bg-[#e6e6ee] sm:block" aria-hidden="true" />
            <DeleteSelectedButton form="fotos-borrar" name="id" />
            <form id="fotos-borrar" action={deletePhotosAction}>
              <input type="hidden" name="slug" value={p.slug} />
            </form>
          </>
        )}
        <span className="basis-full text-[13px] text-[#6b6b80]">
          «Guardar todo» guarda la información, los datos de todos los colores y sube las fotos que elegiste. Para quitar fotos: marca «Elegir» en las que quieras y pulsa «Eliminar seleccionadas».
        </span>
      </div>
    </Fragment>
  );
}
