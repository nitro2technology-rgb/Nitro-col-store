import Link from "next/link";
import type { OrderStatus } from "@nitro/db";
import { formatCOP } from "@nitro/shared";
import { requireAdmin } from "@/lib/admin";
import { dateTimeFmt } from "@/lib/order-status";
import { card, StatusBadge } from "../ui";

export const metadata = { title: "Pedidos" };

const FILTERS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "por-enviar", label: "Por enviar", statuses: ["paid", "processing"] },
  { key: "enviados", label: "Enviados", statuses: ["shipped"] },
  { key: "entregados", label: "Entregados", statuses: ["delivered"] },
  { key: "pendientes", label: "Pago pendiente", statuses: ["pending_payment"] },
  { key: "cancelados", label: "Cancelados", statuses: ["cancelled", "refunded", "returned", "return_requested"] },
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
      <h1 className="text-[clamp(32px,5vw,48px)]">Pedidos</h1>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/pedidos?estado=${f.key}`}
            className={`rounded-full px-4 py-1.5 text-[14px] ${f.key === filter.key ? "bg-ink text-canvas" : "bg-white/80 text-ink hover:bg-white"}`}
          >
            {f.label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2" action="/admin/pedidos">
          <input type="hidden" name="estado" value="todos" />
          <input name="q" defaultValue={search} placeholder="NC-12 o correo" aria-label="Buscar pedido" className="w-48 rounded-full border border-ink/20 bg-white/80 px-4 py-1.5 text-[14px]" />
        </form>
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-[17px] text-muted">No hay pedidos aquí.</p>
      ) : (
        <ul className={`${card} mt-6 divide-y divide-ink/10 p-0`}>
          {orders.map((o) => {
            const a = (o.shippingAddress ?? {}) as Record<string, string>;
            return (
              <li key={o.number}>
                <Link href={`/admin/pedidos/${o.number}`} className="grid grid-cols-2 items-center gap-x-4 gap-y-1 px-5 py-4 text-[15px] hover:bg-white md:grid-cols-[90px_150px_1fr_140px_130px]">
                  <span className="font-semibold">NC-{o.number}</span>
                  <span className="text-muted md:order-none">{dateTimeFmt.format(o.createdAt)}</span>
                  <span className="col-span-2 truncate md:col-span-1">
                    {a.name ?? o.email} <span className="text-muted">· {a.city ?? ""} · {o._count.items} {o._count.items === 1 ? "producto" : "productos"}</span>
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
