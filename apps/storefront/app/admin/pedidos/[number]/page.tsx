import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCOP } from "@nitro/shared";
import { buttonClasses } from "@nitro/ui";
import { requireAdmin } from "@/lib/admin";
import { dateTimeFmt, ORDER_STATUS } from "@/lib/order-status";
import { setOrderStatus, shipOrder } from "../../actions";
import { card, field, Notice, StatusBadge } from "../../ui";

const PAYMENT: Record<string, string> = { pending: "Pendiente", approved: "Aprobado", declined: "Rechazado", voided: "Anulado", refunded: "Reembolsado" };
const cop = (cents: bigint | number) => formatCOP(Number(cents));

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }) {
  return { title: `NC-${(await params).number}` };
}

export default async function OrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const raw = (await params).number;
  await requireAdmin(`/admin/pedidos/${raw}`);
  const number = Number(raw);
  if (!Number.isInteger(number) || number <= 0) notFound();
  const { ok, error } = await searchParams;

  const { db } = await import("@nitro/db");
  const order = await db.order.findUnique({
    where: { number },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      shipments: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();
  const a = (order.shippingAddress ?? {}) as Record<string, string>;
  const canShip = order.status === "paid" || order.status === "processing";
  const whatsapp = order.phone.replace(/\D/g, "");

  return (
    <>
      <p className="text-[15px]">
        <Link href="/admin/pedidos" className="text-muted hover:text-ink">
          ← Pedidos
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <h1 className="text-[clamp(32px,5vw,48px)]">NC-{order.number}</h1>
        <StatusBadge status={order.status} />
        <span className="text-[15px] text-muted">{dateTimeFmt.format(order.createdAt)}</span>
      </div>
      <Notice ok={ok} error={error} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="text-[19px] font-semibold">Productos</h2>
            <ul className="mt-3 divide-y divide-ink/10 text-[15px]">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-2">
                  <span>
                    {i.quantity} × {i.name} <span className="text-muted">({i.sku})</span>
                  </span>
                  <span>{cop(i.totalCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{cop(order.subtotalCents)}</dd>
              </div>
              {order.discountCents > 0n && (
                <div className="flex justify-between">
                  <dt className="text-muted">Descuento</dt>
                  <dd>−{cop(order.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Envío</dt>
                <dd>{order.shippingCents > 0n ? cop(order.shippingCents) : "Gratis"}</dd>
              </div>
              <div className="flex justify-between text-[17px] font-semibold">
                <dt>Total</dt>
                <dd>{cop(order.totalCents)}</dd>
              </div>
            </dl>
          </section>

          <section className={card}>
            <h2 className="text-[19px] font-semibold">Qué sigue</h2>
            {canShip && (
              <form action={shipOrder} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="number" value={order.number} />
                <label className="text-[14px] text-muted">
                  Transportadora
                  <input name="carrier" required minLength={2} maxLength={80} placeholder="Servientrega, Interrapidísimo…" className={`${field} mt-1`} />
                </label>
                <label className="text-[14px] text-muted">
                  Número de guía
                  <input name="trackingNumber" required minLength={3} maxLength={80} className={`${field} mt-1`} />
                </label>
                <label className="text-[14px] text-muted sm:col-span-2">
                  Enlace de rastreo (opcional)
                  <input name="trackingUrl" type="url" placeholder="https://…" maxLength={500} className={`${field} mt-1`} />
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" className={buttonClasses("buy")}>
                    Marcar enviado y avisar al cliente
                  </button>
                </div>
              </form>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {order.status === "paid" && <StatusButton number={order.number} to="processing" label="Marcar preparando" />}
              {order.status === "shipped" && <StatusButton number={order.number} to="delivered" label="Marcar entregado" />}
              {order.status === "pending_payment" && <StatusButton number={order.number} to="cancelled" label="Cancelar pedido" ghost />}
            </div>
            {order.status === "pending_payment" && (
              <p className="mt-3 text-[14px] text-muted">
                El pago aún no se confirma. Si el cliente pagó, Wompi lo marcará como pagado solo; cancela solo pedidos abandonados.
              </p>
            )}
            {(order.status === "delivered" || order.status === "cancelled") && <p className="mt-3 text-[15px] text-muted">Este pedido está cerrado.</p>}
          </section>

          <section className={card}>
            <h2 className="text-[19px] font-semibold">Historial</h2>
            <ol className="mt-3 space-y-2 text-[15px]">
              <li className="text-muted">{dateTimeFmt.format(order.createdAt)} · Pedido creado</li>
              {order.history.map((h) => (
                <li key={h.id}>
                  <span className="text-muted">{dateTimeFmt.format(h.createdAt)} ·</span> {ORDER_STATUS[h.toStatus] ?? h.toStatus}
                  {h.reason && <span className="text-muted"> — {h.reason}</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="text-[19px] font-semibold">Enviar a</h2>
            <p className="mt-3 text-[15px] leading-[1.6]">
              {a.name}
              <br />
              {a.line}
              <br />
              {a.city}, {a.department}
            </p>
            {a.notes && <p className="mt-2 text-[15px] italic text-muted">{a.notes}</p>}
          </section>

          <section className={card}>
            <h2 className="text-[19px] font-semibold">Contacto</h2>
            <p className="mt-3 text-[15px] leading-[1.8]">
              <a href={`mailto:${order.email}`} className="underline underline-offset-4">
                {order.email}
              </a>
              <br />
              {order.phone}
              {whatsapp && (
                <>
                  {" · "}
                  <a href={`https://wa.me/${whatsapp.length === 10 ? `57${whatsapp}` : whatsapp}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    WhatsApp
                  </a>
                </>
              )}
            </p>
          </section>

          <section className={card}>
            <h2 className="text-[19px] font-semibold">Pago</h2>
            {order.payments.length === 0 ? (
              <p className="mt-3 text-[15px] text-muted">Sin pagos registrados.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-[15px]">
                {order.payments.map((p) => (
                  <li key={p.id}>
                    {p.provider} · {PAYMENT[p.status] ?? p.status} · {cop(p.amountCents)}
                    <span className="block text-[13px] text-muted">
                      {p.method}
                      {p.providerRef ? ` · ref. ${p.providerRef}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {order.shipments.length > 0 && (
            <section className={card}>
              <h2 className="text-[19px] font-semibold">Envío</h2>
              <ul className="mt-3 space-y-2 text-[15px]">
                {order.shipments.map((s) => (
                  <li key={s.id}>
                    {s.carrier} · guía{" "}
                    {s.trackingUrl ? (
                      <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                        {s.trackingNumber}
                      </a>
                    ) : (
                      s.trackingNumber
                    )}
                    <span className="block text-[13px] text-muted">{dateTimeFmt.format(s.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function StatusButton({ number, to, label, ghost = false }: { number: number; to: string; label: string; ghost?: boolean }) {
  return (
    <form action={setOrderStatus}>
      <input type="hidden" name="number" value={number} />
      <input type="hidden" name="to" value={to} />
      <button type="submit" className={buttonClasses(ghost ? "ghost" : "buy")}>
        {label}
      </button>
    </form>
  );
}
