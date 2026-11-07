import Link from "next/link";
import type { OrderStatus } from "@nitro/db";
import { formatCOP } from "@nitro/shared";
import { requireAdmin } from "@/lib/admin";
import { dateTimeFmt } from "@/lib/order-status";
import { card, PageTitle, StatusBadge } from "../ui";

export const metadata = { title: "Pedidos" };

const FILTERS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "por-enviar", label: "Por enviar", statuses: ["paid", "processing"] },
  { key: "enviados", label: "Enviados", statuses: ["shipped"] },
  { key: "entregados", label: "Entregados", statuses: ["delivered"] },
  { key: "pendientes", label: "Pago pendiente", statuses: ["pending_payment"] },
  { key: "devoluciones", label: "Con devolución", statuses: ["return_requested", "returned", "refunded"] },
  { key: "cancelados", label: "Cancelados", statuses: ["cancelled"] },
  { key: "todos", label: "Todos" },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  await requireAdmin("/admin/pedidos");
  const { estado = "por-enviar", q = "" } = await searchParams;
  const filter = FILTERS.find((f) => f.key === estado) ?? FILTERS[0]!;
  const search = q.trim().slice(0, 80);
  const number = Number(search.replace(/^NC-/i, ""));

  const { db } = await import("@nitro/db");
  const orders = await db.order.findMany({
    where: {
      ...(filter.statuses ? { status: { in: filter.statuses } } : {}),
      ...(search
        ? { OR: [...(Number.isInteger(number) && number > 0 ? [{ number }] : []), { email: { contains: search, mode: "insensitive" as const } }] }
        : {}),
    },
    orderBy: { number: "desc" },
    take: 100,
    select: { number: true, status: true, email: true, totalCents: true, createdAt: true, shippingAddress: true, _count: { select: { items: true } } },
  });

  return (
    <>
      <PageTitle sub="Los pedidos pagados quedan en «Por enviar» hasta que les pongas la guía.">Pedidos</PageTitle>
      <p className="mt-4">
        <Link href="/admin/pedidos/nuevo" className="inline-flex items-center gap-2 rounded-[10px] bg-[#5b4fe0] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#4a3fd0]">
          + Registrar una venta por fuera de la página
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/pedidos?estado=${f.key}`}
            className={`rounded-full px-4 py-1.5 text-[14px] ${f.key === filter.key ? "bg-[#5b4fe0] font-semibold text-white" : "border border-[#e6e6ee] bg-white text-[#3d3d55] hover:border-[#5b4fe0]"}`}
          >
            {f.label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2" action="/admin/pedidos">
          <input type="hidden" name="estado" value="todos" />
          <input name="q" defaultValue={search} placeholder="NC-12 o correo" aria-label="Buscar pedido" className="w-48 rounded-[10px] border border-[#dcdce6] bg-white px-4 py-2 text-[14px]" />
        </form>
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-[17px] text-[#6b6b80]">No hay pedidos aquí.</p>
      ) : (
        <ul className={`${card} mt-6 divide-y divide-[#f0f0f5] p-0`}>
          {orders.map((o) => {
            const a = (o.shippingAddress ?? {}) as Record<string, string>;
            return (
              <li key={o.number}>
                <Link href={`/admin/pedidos/${o.number}`} className="grid grid-cols-2 items-center gap-x-4 gap-y-1 px-5 py-4 text-[15px] hover:bg-[#fafafc] md:grid-cols-[90px_150px_1fr_140px_130px]">
                  <span className="font-semibold">NC-{o.number}</span>
                  <span className="text-[#6b6b80] md:order-none">{dateTimeFmt.format(o.createdAt)}</span>
                  <span className="col-span-2 truncate md:col-span-1">
                    {a.name ?? o.email} <span className="text-[#6b6b80]">· {a.city ?? ""} · {o._count.items} {o._count.items === 1 ? "producto" : "productos"}</span>
                  </span>
                  <span className="font-semibold">{formatCOP(Number(o.totalCents))}</span>
                  <span className="justify-self-end">
                    <StatusBadge status={o.status} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
