import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { dateFmt } from "@/lib/order-status";
import { loadSummary, RANGES, type Bucket, type RangeKey } from "./stats";
import { card, CardHead, cop, Icon, PageTitle, pct, Stat, StatusBadge } from "./ui";

export const metadata = { title: "Resumen" };

/** "$1,2 M" / "$350 mil" para los ejes, donde no cabe la cifra completa. */
function short(cents: number) {
  const pesos = cents / 100;
  if (pesos >= 1_000_000) return `$${(pesos / 1_000_000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
  if (pesos >= 1000) return `$${Math.round(pesos / 1000)} mil`;
  return `$${Math.round(pesos)}`;
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ rango?: string }> }) {
  await requireAdmin("/admin");
  const { rango } = await searchParams;
  const range: RangeKey = RANGES.some((r) => r.key === rango) ? (rango as RangeKey) : "mes";
  const s = await loadSummary(range);
  const rangeLabel = RANGES.find((r) => r.key === range)!.label.toLowerCase();
  const best = s.buckets.reduce<Bucket | null>((b, x) => (x.cents > (b?.cents ?? 0) ? x : b), null);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle sub={`Cifras de ${rangeLabel}. El inventario siempre es el de hoy.`}>Resumen</PageTitle>
        <nav aria-label="Periodo" className="flex rounded-[10px] border border-[#e6e6ee] bg-[#f6f6fa] p-1 text-[14px]">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin?rango=${r.key}`}
              aria-current={r.key === range ? "true" : undefined}
              className={`rounded-[8px] px-3 py-1.5 ${r.key === range ? "bg-white font-semibold text-[#1d1b3a] shadow-sm" : "text-[#6b6b80] hover:text-[#1d1b3a]"}`}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </div>

      {(s.toShip.length > 0 || s.openReturns > 0) && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-[14px] bg-[#efedfd] px-5 py-4">
          <span className="grid size-10 place-items-center rounded-full bg-white text-[#5b4fe0]">
            <Icon name="truck" />
          </span>
          <p className="flex-1 text-[15px] text-[#1d1b3a]">
            {s.toShip.length > 0 && (
              <>
                Tienes <strong>{s.toShip.length === 8 ? "8 o más" : s.toShip.length}</strong> {s.toShip.length === 1 ? "pedido" : "pedidos"} por enviar
              </>
            )}
            {s.toShip.length > 0 && s.openReturns > 0 && " y "}
            {s.openReturns > 0 && (
              <>
                <strong>{s.openReturns}</strong> {s.openReturns === 1 ? "devolución abierta" : "devoluciones abiertas"}
              </>
            )}
            .
          </p>
          {s.toShip.length > 0 && (
            <Link href="/admin/pedidos?estado=por-enviar" className="rounded-[10px] bg-[#5b4fe0] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#4a3fd0]">
              Ver pedidos
            </Link>
          )}
          {s.openReturns > 0 && (
            <Link href="/admin/devoluciones" className="rounded-[10px] bg-white px-4 py-2 text-[14px] font-semibold text-[#4a3fd0] hover:bg-[#fafafc]">
              Ver devoluciones
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[300px_1fr_320px]">
        {/* Columna de cifras, como la de la referencia */}
        <section aria-label="Cifras de ventas" className="overflow-hidden rounded-[14px] border border-l-4 border-[#e6e6ee] border-l-[#c9c3f7] bg-white">
          <div className="divide-y divide-[#f0f0f5]">
            <Stat icon="cash" value={cop(s.sales.sales)} label="Vendido" hint="Lo que pagaron los clientes, con envío" />
            <Stat icon="trend" value={s.sales.profit == null ? "Falta el costo" : cop(s.sales.profit)} label={`Ganancia${s.sales.margin != null ? ` · ${pct(s.sales.margin)}` : ""}`} hint="Productos vendidos − lo que te costaron − reembolsos. No resta comisión de pago ni envío." />
            <Stat icon="coins" value={cop(s.sales.cost)} label="Costo de lo vendido" />
            <Stat icon="orders" value={`${s.sales.orders} ${s.sales.orders === 1 ? "pedido" : "pedidos"} · ${s.sales.units} und.`} label="Pedidos y unidades" />
            <Stat icon="truck" value={cop(s.sales.shipping)} label="Envíos cobrados" />
            <Stat icon="returns" value={cop(s.sales.refunds)} label="Reembolsado" />
          </div>
          {s.sales.unitsNoCost > 0 && (
            <p className="border-t border-[#f0f0f5] bg-amber-50 px-5 py-3 text-[13px] text-amber-900">
              {s.sales.profit == null
                ? "Las ventas de este periodo no tienen costo registrado. Pon el costo de cada producto para ver la ganancia de las ventas nuevas."
                : `${s.sales.unitsNoCost} ${s.sales.unitsNoCost === 1 ? "unidad vendida no tiene" : "unidades vendidas no tienen"} costo registrado, así que la ganancia sale más alta de lo real.`}
            </p>
          )}
        </section>

        <section className={`${card} min-w-0`}>
          <CardHead title="Ventas" sub={s.monthly ? "Por mes" : "Por día"} action={<span className="text-[22px] font-bold text-[#1d1b3a]">{cop(s.sales.sales)}</span>} />
          <SalesChart buckets={s.buckets} />
          {s.sales.orders > 0 && (
            <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-[#f0f0f5] pt-4">
              <Metric value={cop(s.sales.sales / s.sales.orders)} term="Ticket promedio" />
              <Metric value={best ? cop(best.cents) : "—"} term={best ? `Mejor ${s.monthly ? "mes" : "día"}: ${best.label}` : "Mejor día"} />
              <Metric value={String(s.sales.units)} term="Unidades vendidas" />
            </dl>
          )}
        </section>

        <section className={card}>
          <CardHead title="Inventario" sub="Lo que tienes hoy en bodega" />
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6">
            <Metric value={cop(s.inventory.invested)} term="Invertido" />
            <Metric value={cop(s.inventory.potential)} term="Ganancia si vendes todo" good />
            <Metric value={cop(s.inventory.retail)} term="Valor a precio de venta" />
            <Metric value={String(s.inventory.stockUnits)} term="Unidades en stock" />
          </dl>
          {s.inventory.noCostVariants > 0 && (
            <Link
              href="/admin/productos?ver=sin-costo"
              className="mt-6 flex items-center gap-3 rounded-[10px] border border-[#e6e6ee] px-4 py-3 text-[14px] hover:border-[#5b4fe0]"
            >
              <Icon name="alert" className="size-[18px] text-amber-600" />
              <span className="flex-1">
                <strong>{s.inventory.noCostVariants}</strong> {s.inventory.noCostVariants === 1 ? "color con stock no tiene" : "colores con stock no tienen"} costo
              </span>
              <span aria-hidden>›</span>
            </Link>
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className={card}>
          <CardHead
            title="Por enviar"
            sub="Los más antiguos primero"
            action={
              <Link href="/admin/pedidos?estado=por-enviar" className="text-[14px] font-semibold text-[#5b4fe0] underline-offset-4 hover:underline">
                Ver todos
              </Link>
            }
          />
          {s.toShip.length === 0 ? (
            <p className="mt-4 text-[15px] text-[#6b6b80]">Nada pendiente. 🎉</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#f0f0f5]">
              {s.toShip.map((o) => {
                const a = (o.shippingAddress ?? {}) as Record<string, string>;
                const days = Math.floor((Date.now() - o.createdAt.getTime()) / 86_400_000);
                return (
                  <li key={o.number}>
                    <Link href={`/admin/pedidos/${o.number}`} className="-mx-2 grid grid-cols-[70px_1fr_auto] items-center gap-3 rounded-[8px] px-2 py-3 text-[15px] hover:bg-[#fafafc] sm:grid-cols-[80px_1fr_110px_auto]">
                      <span className="font-semibold">NC-{o.number}</span>
                      <span className="min-w-0 truncate">
                        {a.name} <span className="text-[#6b6b80]">· {a.city}</span>
                      </span>
                      <span className={`hidden text-[13px] sm:block ${days >= 2 ? "font-semibold text-amber-700" : "text-[#6b6b80]"}`}>
                        {days === 0 ? "Hoy" : days === 1 ? "Ayer" : `Hace ${days} días`}
                      </span>
                      <StatusBadge status={o.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={card}>
          <CardHead title="Más vendidos" sub={`Por ventas, ${rangeLabel}`} />
          {s.top.length === 0 ? (
            <p className="mt-4 text-[15px] text-[#6b6b80]">Aún no hay ventas en este periodo.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {s.top.map((p) => (
                <li key={p.slug}>
                  <div className="flex items-baseline justify-between gap-3 text-[14px]">
                    <Link href={`/admin/productos/${p.slug}`} className="min-w-0 truncate font-semibold text-[#1d1b3a] hover:text-[#5b4fe0]">
                      {p.name}
                    </Link>
                    <span className="shrink-0 text-[#6b6b80]">
                      {p.units} und. · <span className="font-semibold text-[#1d1b3a]">{cop(p.cents)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-[#efedfd]">
                    <div className="h-2 rounded-full bg-[#5b4fe0]" style={{ width: `${Math.max(3, (p.cents / s.top[0]!.cents) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={`${card} mt-5`}>
        <CardHead
          title="Poco stock"
          sub="Productos visibles en o por debajo de su aviso"
          action={
            <Link href="/admin/productos?ver=poco" className="text-[14px] font-semibold text-[#5b4fe0] underline-offset-4 hover:underline">
              Ver productos
            </Link>
          }
        />
        {s.low.length === 0 ? (
          <p className="mt-4 text-[15px] text-[#6b6b80]">Todo tiene stock suficiente.</p>
        ) : (
          <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
            {s.low.map((i) => (
              <li key={i.sku} className="border-b border-[#f0f0f5] last:border-0 sm:[&:nth-last-child(2)]:border-0">
                <Link href={`/admin/productos/${i.slug}`} className="flex items-center justify-between gap-3 py-2.5 text-[15px] hover:text-[#5b4fe0]">
                  <span className="min-w-0 truncate">
                    {i.name} <span className="text-[#6b6b80]">· {i.label}</span>
                  </span>
                  <span className={`shrink-0 font-semibold ${i.onHand === 0 ? "text-red-700" : "text-amber-700"}`}>{i.onHand === 0 ? "Agotado" : `${i.onHand} und.`}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-6 text-[13px] text-[#a0a0b2]">Actualizado {dateFmt.format(new Date())}.</p>
    </>
  );
}

function Metric({ value, term, good }: { value: string; term: string; good?: boolean }) {
  return (
    <div>
      <dd className={`text-[20px] font-bold tracking-[-0.01em] ${good ? "text-emerald-700" : "text-[#1d1b3a]"}`}>{value}</dd>
      <dt className="text-[13px] text-[#6b6b80]">{term}</dt>
    </div>
  );
}

/** Barras de un solo color; al pasar el mouse (o con el teclado) se ve la cifra exacta. */
function SalesChart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(...buckets.map((b) => b.cents), 0);
  if (max === 0) return <p className="mt-10 pb-10 text-center text-[15px] text-[#6b6b80]">Sin ventas en este periodo.</p>;
  const ticks = [1, 0.5];
  const labelEvery = Math.ceil(buckets.length / 6);
  return (
    <>
      <div className="relative mt-6 h-[220px] pl-14">
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-dashed border-[#ececf2] pl-0" style={{ bottom: `${t * 100}%` }}>
            <span className="absolute -top-2.5 left-0 text-[11px] text-[#a0a0b2]">{short(max * t)}</span>
          </div>
        ))}
        <div className="relative flex h-full items-end gap-[2px] border-b border-[#dcdce6]">
          {buckets.map((b) => (
            <div key={b.key} tabIndex={0} aria-label={`${b.label}: ${cop(b.cents)}, ${b.orders} pedidos`} className="group relative flex h-full flex-1 items-end outline-none">
              <div
                className="w-full rounded-t-[4px] bg-[#5b4fe0] transition-colors group-hover:bg-[#3d32b8] group-focus:bg-[#3d32b8]"
                style={{ height: b.cents > 0 ? `max(2px, ${(b.cents / max) * 100}%)` : 0 }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-[#1d1b3a] px-3 py-2 text-[12px] text-white shadow-lg group-hover:block group-focus:block">
                <p className="font-semibold">{cop(b.cents)}</p>
                <p className="text-white/70">
                  {b.label} · {b.orders} {b.orders === 1 ? "pedido" : "pedidos"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-[2px] pl-14 text-[11px] text-[#a0a0b2]">
        {buckets.map((b, i) => (
          <span key={b.key} className="flex-1 overflow-visible whitespace-nowrap text-center">
            {i % labelEvery === 0 ? b.label : ""}
          </span>
        ))}
      </div>
      <details className="mt-4 text-[13px]">
        <summary className="cursor-pointer text-[#6b6b80]">Ver como tabla</summary>
        <table className="mt-2 w-full text-left">
          <tbody>
            {buckets
              .filter((b) => b.cents > 0)
              .map((b) => (
                <tr key={b.key} className="border-t border-[#f0f0f5]">
                  <td className="py-1">{b.label}</td>
                  <td className="py-1 text-right">{b.orders}</td>
                  <td className="py-1 text-right font-semibold">{cop(b.cents)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
