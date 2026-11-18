import { requireAdmin } from "@/lib/admin";
import { createCoupon, deleteCoupon, toggleCoupon } from "../actions";
import { card, CardHead, cop, field, label, Notice, PageTitle } from "../ui";
import { SaveButton } from "../save-button";

export const metadata = { title: "Cupones" };

const TYPE: Record<string, string> = { percentage: "Porcentaje", fixed: "Valor fijo", free_shipping: "Envío gratis" };

export default async function CouponsAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; v?: string }> }) {
  await requireAdmin("/admin/cupones");
  const { ok, error, v } = await searchParams;
  const { db } = await import("@nitro/db");
  const rows = await db.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { redemptions: true } } }, take: 200 });

  const valueText = (c: (typeof rows)[number]) => (c.type === "percentage" ? `${c.value} %` : c.type === "fixed" ? cop(c.value) : "—");

  return (
    <>
      <PageTitle sub="Códigos que la persona escribe al pagar. El descuento se valida siempre en el servidor.">Cupones</PageTitle>
      <Notice ok={ok} error={error} />

      <form key={v ?? "0"} action={createCoupon} className={`${card} mt-6`}>
        <CardHead title="Crear códigos" sub="Deja el código vacío para que se genere uno aleatorio (NITRO-XXXXXX)." />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className={label}>
            Tipo
            <select name="type" defaultValue="free_shipping" className={`${field} mt-1`}>
              <option value="free_shipping">Envío gratis</option>
              <option value="percentage">Porcentaje</option>
              <option value="fixed">Valor fijo (pesos)</option>
            </select>
          </label>
          <label className={label}>
            Valor (% o pesos; no aplica a envío gratis)
            <input name="value" inputMode="numeric" placeholder="10" className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Código propio (opcional)
            <input name="code" maxLength={30} placeholder="BIENVENIDO" className={`${field} mt-1 uppercase`} />
          </label>
          <label className={label}>
            Cuántos generar
            <input name="count" inputMode="numeric" defaultValue="1" className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Usos totales (vacío = ilimitado)
            <input name="max" inputMode="numeric" placeholder="1" className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Usos por cliente (vacío = ilimitado)
            <input name="perCustomer" inputMode="numeric" placeholder="1" className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Compra mínima en pesos (opcional)
            <input name="min" inputMode="numeric" placeholder="0" className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Vence el (opcional)
            <input name="ends" type="date" className={`${field} mt-1`} />
          </label>
        </div>
        <div className="mt-5">
          <SaveButton requireChange={false} pendingText="Creando…">
            Crear
          </SaveButton>
        </div>
      </form>

      <section className={`${card} mt-8`}>
        <CardHead title="Códigos" sub={`${rows.length} en total`} />
        <ul className="mt-4 divide-y divide-[#f0f0f5]">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-[15px]">
              <span className="font-mono font-semibold text-[#1d1b3a]">{c.code}</span>
              <span className="text-[#6b6b80]">
                {TYPE[c.type]} {valueText(c)}
              </span>
              <span className="text-[13px] text-[#6b6b80]">
                {c._count.redemptions}
                {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""} usos
              </span>
              {c.endsAt && <span className="text-[13px] text-[#6b6b80]">vence {c.endsAt.toLocaleDateString("es-CO")}</span>}
              <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${c.active ? "bg-emerald-100 text-emerald-900" : "bg-[#ececf2] text-[#6b6b80]"}`}>
                {c.active ? "Activo" : "Inactivo"}
              </span>
              <div className="ml-auto flex gap-2">
                <form action={toggleCoupon}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="rounded-[8px] border border-[#dcdce6] px-3 py-1 text-[13px] font-semibold hover:border-[#5b4fe0]">
                    {c.active ? "Desactivar" : "Activar"}
                  </button>
                </form>
                <form action={deleteCoupon}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="rounded-[8px] border border-[#dcdce6] px-3 py-1 text-[13px] font-semibold text-red-700 hover:border-red-400">
                    Borrar
                  </button>
                </form>
              </div>
            </li>
          ))}
          {rows.length === 0 && <li className="py-3 text-[14px] text-[#a0a0b2]">Todavía no hay códigos.</li>}
        </ul>
      </section>
    </>
  );
}
