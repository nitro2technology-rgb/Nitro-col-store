import Link from "next/link";
import { formatCOP } from "@nitro/shared";
import { requireAdmin } from "@/lib/admin";
import { card } from "./ui";

export const metadata = { title: "Resumen" };

const SOLD = ["paid", "processing", "shipped", "delivered"] as const;

/** Primer día del mes actual en Colombia (UTC-5, sin horario de verano). */
function monthStart() {
  const now = new Date(Date.now() - 5 * 3600_000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 5));
}

export default async function AdminHome() {
  await requireAdmin("/admin");
  const { db } = await import("@nitro/db");
  const [toShip, month, lowStock] = await Promise.all([
    db.order.count({ where: { status: { in: ["paid", "processing"] } } }),
    db.order.aggregate({ where: { status: { in: [...SOLD] }, createdAt: { gte: monthStart() } }, _sum: { totalCents: true }, _count: true }),
    db.inventoryItem.findMany({
      where: { onHand: { lte: 3 }, variant: { deletedAt: null, product: { status: "published", deletedAt: null } } },
      orderBy: { onHand: "asc" },
      take: 12,
      select: { onHand: true, variant: { select: { sku: true, label: true, product: { select: { name: true } } } } },
    }),
  ]);

  const stats = [
    { label: "Pedidos por enviar", value: String(toShip), href: "/admin/pedidos?estado=por-enviar" },
    { label: "Ventas del mes", value: formatCOP(Number(month._sum.totalCents ?? 0n)), href: "/admin/pedidos?estado=todos" },
    { label: "Pedidos pagados del mes", value: String(month._count), href: "/admin/pedidos?estado=todos" },
  ];

  return (
    <>
      <h1 className="text-[clamp(32px,5vw,48px)]">Resumen</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`${card} hover:border-ink/30`}>
            <p className="text-[15px] text-muted">{s.label}</p>
            <p className="mt-2 text-[32px] font-semibold tracking-[-0.02em]">{s.value}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 text-[24px]">Poco stock (3 o menos)</h2>
      {lowStock.length === 0 ? (
        <p className="mt-3 text-[15px] text-muted">Todo tiene más de 3 unidades.</p>
      ) : (
        <ul className={`${card} mt-4 divide-y divide-ink/10 p-0`}>
          {lowStock.map((i) => (
            <li key={i.variant.sku} className="flex items-center justify-between gap-4 px-5 py-3 text-[15px]">
              <span>
                {i.variant.product.name} · {i.variant.label} <span className="text-muted">({i.variant.sku})</span>
              </span>
              <span className={`font-semibold ${i.onHand === 0 ? "text-red-700" : ""}`}>{i.onHand === 0 ? "Agotado" : `${i.onHand} und.`}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[15px]">
        <Link href="/admin/productos" className="underline underline-offset-4">
          Editar precios y stock
        </Link>
      </p>
    </>
  );
}
