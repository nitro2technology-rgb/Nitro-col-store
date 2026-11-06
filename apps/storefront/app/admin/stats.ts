// Cifras del resumen. Todo en centavos (como la base) salvo los conteos.

/** Pedidos que cuentan como venta: pagados, aunque luego tengan devolución (el reembolso se resta aparte). */
const SOLD = ["paid", "processing", "shipped", "delivered", "return_requested", "returned", "refunded"] as const;

export const RANGES = [
  { key: "mes", label: "Este mes" },
  { key: "30d", label: "30 días" },
  { key: "ano", label: "Este año" },
  { key: "todo", label: "Todo" },
] as const;
export type RangeKey = (typeof RANGES)[number]["key"];

const BOGOTA = 5 * 3600_000; // UTC-5, sin horario de verano

/** Fecha local de Colombia como "2026-11-06". */
const dayKey = (d: Date) => new Date(d.getTime() - BOGOTA).toISOString().slice(0, 10);

function rangeStart(key: RangeKey): Date | null {
  const now = new Date(Date.now() - BOGOTA);
  if (key === "mes") return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) + BOGOTA);
  if (key === "ano") return new Date(Date.UTC(now.getUTCFullYear(), 0, 1) + BOGOTA);
  if (key === "30d") return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29) + BOGOTA);
  return null;
}

export type Bucket = { key: string; label: string; cents: number; orders: number };

export async function loadSummary(range: RangeKey) {
  const { db } = await import("@nitro/db");
  const start = rangeStart(range);
  const since = start ? { gte: start } : undefined;

  const [orders, returns, inventory, toShip, openReturns] = await Promise.all([
    db.order.findMany({
      where: { status: { in: [...SOLD] }, createdAt: since },
      select: {
        createdAt: true,
        subtotalCents: true,
        discountCents: true,
        shippingCents: true,
        totalCents: true,
        items: { select: { quantity: true, totalCents: true, unitCostCents: true, variant: { select: { product: { select: { slug: true, name: true } } } } } },
      },
    }),
    db.orderReturn.findMany({
      where: { status: "refunded", createdAt: since },
      select: { refundCents: true, restocked: true, items: true, order: { select: { items: { select: { sku: true, unitCostCents: true } } } } },
    }),
    db.inventoryItem.findMany({
      where: { variant: { deletedAt: null, product: { deletedAt: null } } },
      select: {
        onHand: true,
        lowStockAt: true,
        unitCostCents: true,
        variant: { select: { sku: true, label: true, priceCents: true, product: { select: { slug: true, name: true, status: true } } } },
      },
    }),
    db.order.findMany({
      where: { status: { in: ["paid", "processing"] } },
      orderBy: { createdAt: "asc" },
      take: 8,
      select: { number: true, status: true, createdAt: true, totalCents: true, shippingAddress: true, _count: { select: { items: true } } },
    }),
    db.orderReturn.count({ where: { status: { in: ["requested", "received"] } } }),
  ]);

  // ── Ventas del periodo
  let sales = 0, net = 0, shipping = 0, cost = 0, units = 0, unitsNoCost = 0;
  const byProduct = new Map<string, { name: string; slug: string; cents: number; units: number }>();
  for (const o of orders) {
    sales += Number(o.totalCents);
    net += Number(o.subtotalCents - o.discountCents);
    shipping += Number(o.shippingCents);
    for (const i of o.items) {
      units += i.quantity;
      if (i.unitCostCents == null) unitsNoCost += i.quantity;
      else cost += i.unitCostCents * i.quantity;
      const p = i.variant.product;
      const row = byProduct.get(p.slug) ?? { name: p.name, slug: p.slug, cents: 0, units: 0 };
      row.cents += Number(i.totalCents);
      row.units += i.quantity;
      byProduct.set(p.slug, row);
    }
  }
  let refunds = 0, recovered = 0;
  for (const r of returns) {
    refunds += Number(r.refundCents);
    if (!r.restocked) continue;
    const costBySku = new Map(r.order.items.map((i) => [i.sku, i.unitCostCents ?? 0]));
    for (const i of r.items as { sku: string; quantity: number }[]) recovered += (costBySku.get(i.sku) ?? 0) * i.quantity;
  }
  // Sin ningún costo registrado la "ganancia" sería el total vendido: mejor no mostrarla.
  const profit = units > 0 && unitsNoCost === units ? null : net - cost - refunds + recovered;

  // ── Barras por día (rangos cortos) o por mes (año / todo)
  const monthly = range === "ano" || range === "todo";
  const buckets = new Map<string, Bucket>();
  const first = start ?? (orders.length ? new Date(Math.min(...orders.map((o) => o.createdAt.getTime()))) : new Date());
  const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const name = (d: Date) => (monthly ? `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}` : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`);
  // d es la medianoche UTC del día local: su fecha ISO ya es el día de Colombia.
  for (let d = new Date(dayKey(first) + "T00:00:00Z"), end = dayKey(new Date()); ; ) {
    const day = d.toISOString().slice(0, 10);
    const k = monthly ? day.slice(0, 7) : day;
    if (!buckets.has(k)) buckets.set(k, { key: k, label: name(d), cents: 0, orders: 0 });
    if (day >= end) break;
    d = new Date(d.getTime() + 86_400_000);
  }
  for (const o of orders) {
    const b = buckets.get(monthly ? dayKey(o.createdAt).slice(0, 7) : dayKey(o.createdAt));
    if (b) {
      b.cents += Number(o.totalCents);
      b.orders += 1;
    }
  }

  // ── Inventario (hoy, no depende del periodo)
  let invested = 0, retail = 0, stockUnits = 0, noCostVariants = 0, potential = 0;
  const low: { sku: string; name: string; label: string; slug: string; onHand: number }[] = [];
  for (const i of inventory) {
    stockUnits += i.onHand;
    retail += i.onHand * i.variant.priceCents;
    if (i.unitCostCents == null) {
      if (i.onHand > 0) noCostVariants += 1;
    } else {
      invested += i.onHand * i.unitCostCents;
      potential += i.onHand * (i.variant.priceCents - i.unitCostCents);
    }
    if (i.variant.product.status === "published" && i.onHand <= i.lowStockAt)
      low.push({ sku: i.variant.sku, name: i.variant.product.name, label: i.variant.label, slug: i.variant.product.slug, onHand: i.onHand });
  }
  low.sort((a, b) => a.onHand - b.onHand);

  return {
    sales: { sales, net, shipping, cost, units, unitsNoCost, refunds, recovered, profit, orders: orders.length, margin: profit != null && net > 0 ? (profit / net) * 100 : null },
    buckets: [...buckets.values()],
    monthly,
    top: [...byProduct.values()].sort((a, b) => b.cents - a.cents).slice(0, 6),
    inventory: { invested, retail, potential, stockUnits, noCostVariants },
    low: low.slice(0, 10),
    toShip,
    openReturns,
  };
}
