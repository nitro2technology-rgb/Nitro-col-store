import Link from "next/link";
import type { ReturnStatus } from "@nitro/db";
import { requireAdmin } from "@/lib/admin";
import { dateTimeFmt } from "@/lib/order-status";
import { closeReturn, receiveReturn, rejectReturn } from "../actions";
import { card, cop, field, ghostBtn, label, Notice, PageTitle, primaryBtn } from "../ui";

export const metadata = { title: "Devoluciones" };

const FILTERS: { key: string; label: string; statuses?: ReturnStatus[] }[] = [
  { key: "abiertas", label: "Abiertas", statuses: ["requested", "received"] },
  { key: "cerradas", label: "Cerradas", statuses: ["refunded", "rejected"] },
  { key: "todas", label: "Todas" },
];
const KIND: Record<string, string> = { retracto: "Retracto", garantia: "Garantía", otro: "Otro" };
const STATUS: Record<ReturnStatus, { text: string; tone: string }> = {
  requested: { text: "Esperando el producto", tone: "bg-amber-100 text-amber-900" },
  received: { text: "Recibida · falta cerrar", tone: "bg-orange-100 text-orange-900" },
  refunded: { text: "Cerrada", tone: "bg-emerald-100 text-emerald-900" },
  rejected: { text: "Rechazada", tone: "bg-[#ececf2] text-ink" },
};
type Line = { variantId: string; sku: string; name: string; quantity: number };

export default async function ReturnsPage({ searchParams }: { searchParams: Promise<{ ver?: string; ok?: string; error?: string }> }) {
  await requireAdmin("/admin/devoluciones");
  const { ver = "abiertas", ok, error } = await searchParams;
  const filter = FILTERS.find((f) => f.key === ver) ?? FILTERS[0]!;

  const { db } = await import("@nitro/db");
  const returns = await db.orderReturn.findMany({
    where: filter.statuses ? { status: { in: filter.statuses } } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { order: { select: { number: true, email: true, phone: true, totalCents: true, shippingAddress: true, items: { select: { sku: true, unitCents: true } } } } },
  });

  return (
    <>
      <PageTitle sub="Registra una devolución desde el pedido (botón «Registrar devolución»). Aquí la sigues hasta cerrarla.">Devoluciones</PageTitle>
      <Notice ok={ok} error={error} />

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/devoluciones?ver=${f.key}`}
            className={`rounded-full px-4 py-1.5 text-[14px] ${f.key === filter.key ? "bg-[#5b4fe0] font-semibold text-white" : "border border-[#e6e6ee] bg-white text-[#3d3d55] hover:border-[#5b4fe0]"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {returns.length === 0 ? (
        <div className={`${card} mt-6 text-[15px] text-[#6b6b80]`}>
          No hay devoluciones {filter.key === "abiertas" ? "abiertas" : "aquí"}. Para registrar una, abre el pedido en{" "}
          <Link href="/admin/pedidos?estado=entregados" className="font-semibold text-[#5b4fe0] underline-offset-4 hover:underline">
            Pedidos entregados
          </Link>
          .
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {returns.map((r) => {
            const items = r.items as Line[];
            const a = (r.order.shippingAddress ?? {}) as Record<string, string>;
            const price = new Map(r.order.items.map((i) => [i.sku, i.unitCents]));
            const suggested = items.reduce((s, i) => s + (price.get(i.sku) ?? 0) * i.quantity, 0);
            const st = STATUS[r.status];
            return (
              <li key={r.id} className={card}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[17px] font-semibold text-[#1d1b3a]">
                      <Link href={`/admin/pedidos/${r.order.number}`} className="hover:text-[#5b4fe0]">
                        NC-{r.order.number}
                      </Link>{" "}
                      · {KIND[r.kind] ?? r.kind}
                    </p>
                    <p className="text-[13px] text-[#6b6b80]">
                      {dateTimeFmt.format(r.createdAt)} · {a.name ?? r.order.email} · {r.order.phone}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${st.tone}`}>{st.text}</span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-[13px] font-medium text-[#5c5c70]">Productos que devuelve</p>
                    <ul className="mt-1 text-[15px]">
                      {items.map((i) => (
                        <li key={i.sku}>
                          {i.quantity} × {i.name} <span className="text-[#a0a0b2]">({i.sku})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#5c5c70]">Motivo</p>
                    <p className="mt-1 text-[15px]">{r.reason}</p>
                    {r.notes && <p className="mt-2 text-[14px] italic text-[#6b6b80]">Nota: {r.notes}</p>}
                    {r.status === "refunded" && (
                      <p className="mt-2 text-[15px] font-semibold">{r.refundCents > 0n ? `Reembolsado ${cop(r.refundCents)}` : "Sin reembolso (cambio o reparación)"}</p>
                    )}
                    {r.status !== "requested" && r.status !== "rejected" && (
                      <p className="text-[13px] text-[#6b6b80]">{r.restocked ? "Las unidades volvieron al inventario." : "No volvió al inventario."}</p>
                    )}
                  </div>
                </div>

                {r.status === "requested" && (
                  <div className="mt-5 grid gap-4 border-t border-[#f0f0f5] pt-5 lg:grid-cols-2">
                    <form action={receiveReturn} className="space-y-3">
                      <input type="hidden" name="id" value={r.id} />
                      <p className="text-[15px] font-semibold">¿Ya te llegó el producto?</p>
                      <label className="flex items-center gap-2 text-[14px]">
                        <input type="checkbox" name="restock" className="size-4 accent-[#5b4fe0]" />
                        Está en buen estado: devolverlo al stock
                      </label>
                      <input name="notes" maxLength={1000} placeholder="Nota (opcional): estado, empaque…" className={field} />
                      <button type="submit" className={primaryBtn}>
                        Marcar recibido
                      </button>
                    </form>
                    <form action={rejectReturn} className="space-y-3">
                      <input type="hidden" name="id" value={r.id} />
                      <p className="text-[15px] font-semibold">¿No procede?</p>
                      <input name="notes" required minLength={3} maxLength={1000} placeholder="Por qué se rechaza" className={field} />
                      <button type="submit" className={ghostBtn}>
                        Rechazar devolución
                      </button>
                    </form>
                  </div>
                )}

                {r.status === "received" && (
                  <form action={closeReturn} className="mt-5 grid gap-3 border-t border-[#f0f0f5] pt-5 sm:grid-cols-[220px_1fr_auto] sm:items-end">
                    <input type="hidden" name="id" value={r.id} />
                    <label className={label}>
                      Valor reembolsado (pesos)
                      <input name="refund" inputMode="numeric" defaultValue={Math.round(suggested / 100)} className={`${field} mt-1`} />
                    </label>
                    <label className={label}>
                      Nota (opcional)
                      <input name="notes" maxLength={1000} placeholder="Ej.: reembolso por Wompi el 6 nov" className={`${field} mt-1`} />
                    </label>
                    <button type="submit" className={primaryBtn}>
                      Cerrar devolución
                    </button>
                    <p className="text-[13px] text-[#6b6b80] sm:col-span-3">
                      El reembolso se hace en Wompi o por transferencia; aquí solo se anota. Escribe 0 si fue un cambio o una reparación: la venta se mantiene.
                    </p>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
