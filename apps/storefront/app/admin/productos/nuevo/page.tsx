import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createProduct } from "../../actions";
import { card, CardHead, field, label, Notice, PageTitle, primaryBtn } from "../../ui";
import { getPalette } from "../../palette";
import { ColorFields } from "../color-fields";

export const metadata = { title: "Producto nuevo" };

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin("/admin/productos/nuevo");
  const { ok, error } = await searchParams;
  const { db } = await import("@nitro/db");
  const all = await db.category.findMany({ where: { deletedAt: null }, orderBy: [{ path: "asc" }], include: { _count: { select: { children: true } } } });
  const palette = await getPalette();
  const names = new Map(all.map((c) => [c.id, c.name]));
  const leaves = all.filter((c) => c._count.children === 0).map((c) => ({ id: c.id, text: c.parentId ? `${names.get(c.parentId)} › ${c.name}` : c.name }));

  return (
    <>
      <p className="text-[14px]">
        <Link href="/admin/productos" className="text-[#6b6b80] hover:text-[#5b4fe0]">
          ← Productos
        </Link>
      </p>
      <PageTitle sub="Se crea oculto: después subes las fotos y lo haces visible.">Producto nuevo</PageTitle>
      <Notice ok={ok} error={error} />

      <form action={createProduct} className={`${card} mt-6`}>
        <CardHead title="Información" sub="Lo básico. Lo demás (especificaciones, lo principal, etiquetas…) se completa al editar." />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className={`${label} md:col-span-2`}>
            Nombre
            <input name="name" required minLength={2} maxLength={120} className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Categoría
            <select name="category" required defaultValue="" className={`${field} mt-1`}>
              <option value="" disabled>
                Elige una…
              </option>
              {leaves.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.text}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Marca <span className="font-normal text-[#a0a0b2]">— opcional</span>
            <input name="brand" maxLength={80} className={`${field} mt-1`} />
          </label>
          <label className={`${label} md:col-span-2`}>
            Frase corta (debajo del título)
            <input name="tagline" maxLength={200} className={`${field} mt-1`} />
          </label>
          <label className={`${label} md:col-span-2`}>
            Descripción
            <textarea name="description" required minLength={10} maxLength={5000} rows={5} className={`${field} mt-1`} />
          </label>
        </div>

        <h2 className="mt-8 text-[17px] font-semibold text-[#1d1b3a]">Primer color o versión</h2>
        <p className="text-[13px] text-[#6b6b80]">Precios en pesos, sin puntos. Más colores se agregan después, en la ficha del producto.</p>
        <ColorFields palette={palette} />
        <div className="mt-6">
          <button type="submit" className={primaryBtn}>
            Crear producto
          </button>
        </div>
      </form>
    </>
  );
}
