import Link from "next/link";
import { formatCOP } from "@nitro/shared";
import { requireAdmin } from "@/lib/admin";
import { createManualSale } from "../../actions";
import { card, CardHead, field, label, Notice, PageTitle, primaryBtn } from "../../ui";

export const metadata = { title: "Registrar venta" };

const LINES = 6;

export default async function NewSale({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin("/admin/pedidos/nuevo");
  const { ok, error } = await searchParams;
  const { db } = await import("@nitro/db");
  const variants = await db.productVariant.findMany({
    where: { deletedAt: null, product: { deletedAt: null } },
    orderBy: [{ product: { name: "asc" } }, { label: "asc" }],
    select: { sku: true, label: true, priceCents: true, product: { select: { name: true } }, inventory: { select: { onHand: true } } },
  });

  return (
    <>
      <p className="text-[14px]">
        <Link href="/admin/pedidos" className="text-[#6b6b80] hover:text-[#5b4fe0]">
          ← Pedidos
        </Link>
      </p>
      <PageTitle sub="Para ventas que no pasaron por la página (efectivo, conocidos, transferencias). Se descuenta del inventario y queda en tus pedidos y ganancias.">
        Registrar una venta
      </PageTitle>
      <Notice ok={ok} error={error} />

      <form action={createManualSale} className="mt-6 space-y-6">
        <section className={card}>
          <CardHead title="Qué se vendió" sub="Elige el producto y el color, la cantidad y, si quieres, un precio distinto al de la página (por unidad, en pesos)." />
          <div className="mt-4 space-y-3">
            {Array.from({ length: LINES }, (_, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_72px] gap-3 sm:grid-cols-[minmax(0,1fr)_80px_150px]">
                <select name={`sku_${i}`} defaultValue="" aria-label={`Producto ${i + 1}`} className={`${field} col-span-2 sm:col-span-1`}>
                  <option value="">{i === 0 ? "— Elige un producto —" : "— (otro producto, opcional) —"}</option>
                  {variants.map((v) => (
                    <option key={v.sku} value={v.sku}>
                      {v.product.name} · {v.label} · {formatCOP(Number(v.priceCents))} · quedan {v.inventory?.onHand ?? 0}
                    </option>
                  ))}
                </select>
                <input name={`qty_${i}`} type="number" min={1} max={50} defaultValue={1} aria-label="Cantidad" className={field} />
                <input name={`price_${i}`} inputMode="numeric" placeholder="Precio c/u (opcional)" aria-label="Precio por unidad" className={field} />
              </div>
            ))}
          </div>
          <label className={`${label} mt-4 max-w-xs`}>
            Descuento total en pesos (opcional)
            <input name="discount" inputMode="numeric" placeholder="0" className={`${field} mt-1`} />
          </label>
        </section>

        <section className={card}>
          <CardHead title="Quién compró" sub="El contacto queda guardado en el pedido. El correo es necesario solo para enviarle el agradecimiento." />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Nombre
              <input name="name" required maxLength={120} className={`${field} mt-1`} />
            </label>
            <label className={label}>
              Teléfono o WhatsApp
              <input name="phone" required inputMode="tel" maxLength={20} className={`${field} mt-1`} />
            </label>
            <label className={label}>
              Correo (opcional)
              <input name="email" type="email" maxLength={160} className={`${field} mt-1`} />
            </label>
            <label className={label}>
              Ciudad (opcional)
              <input name="city" maxLength={80} className={`${field} mt-1`} />
            </label>
            <label className={`${label} sm:col-span-2`}>
              Dirección o nota (opcional)
              <input name="line" maxLength={200} className={`${field} mt-1`} />
            </label>
          </div>
        </section>

        <section className={card}>
          <CardHead title="Pago y entrega" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Cómo pagó
              <select name="method" defaultValue="Efectivo" className={`${field} mt-1`}>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Nequi o Daviplata</option>
                <option>Otro</option>
              </select>
            </label>
            <label className={label}>
              Estado
              <select name="state" defaultValue="delivered" className={`${field} mt-1`}>
                <option value="delivered">Ya se entregó</option>
                <option value="paid">Pagado, falta entregar</option>
              </select>
            </label>
          </div>
          <label className="mt-4 flex items-start gap-3 text-[14px] text-[#3d3d55]">
            <input type="checkbox" name="sendMail" defaultChecked className="mt-1 size-[18px]" />
            <span>
              Enviarle ahora el correo de «pedido entregado y gracias por tu compra» (solo si ya se entregó y escribiste su correo). Si falta entregar, el correo sale cuando
              lo marques como entregado.
            </span>
          </label>
        </section>

        <div className="sticky bottom-4 z-10 rounded-[14px] border border-[#e6e6ee] bg-white/95 p-4 shadow-lg backdrop-blur">
          <button type="submit" className={primaryBtn}>
            Registrar venta
          </button>
        </div>
      </form>
    </>
  );
}
