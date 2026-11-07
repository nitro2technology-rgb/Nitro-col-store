import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatCOP } from "@nitro/shared";
import { buttonClasses } from "@nitro/ui";
import { dateFmt, dateTimeFmt, ORDER_STATUS } from "@/lib/order-status";
import { photosForVariants, smallPhoto } from "@/lib/order-photos";
import { canRequestReturn, CANCELLABLE, deliveredAt, RETURN_DAYS, returnDeadline } from "@/lib/returns-policy";
import { currentUser } from "@/lib/supabase/server";
import { cancelMyOrder, requestMyReturn } from "../../actions";

export const metadata: Metadata = { title: "Mi pedido", robots: { index: false } };
export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded-button border border-ink/30 bg-transparent px-3 py-2.5 text-[16px] text-ink";
const RETURN_STATUS: Record<string, string> = {
  requested: "Esperando el producto",
  received: "Producto recibido, estamos revisándolo",
  refunded: "Cerrada",
  rejected: "Rechazada",
};

export default async function MyOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ ok?: string; error?: string; v?: string }>;
}) {
  const { number: raw } = await params;
  const { ok, error, v } = await searchParams;
  const number = Number(raw);
  if (!Number.isInteger(number)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/ingresar?next=/cuenta/pedidos/${number}`);

  const { db } = await import("@nitro/db");
  const order = await db.order.findFirst({
    where: { number, profileId: user.id },
    include: { items: true, history: { orderBy: { createdAt: "asc" } }, shipments: { orderBy: { createdAt: "desc" } }, returns: { orderBy: { createdAt: "desc" } }, payments: { select: { status: true } } },
  });
  if (!order) notFound();
  const photos = await photosForVariants(order.items.map((i) => i.variantId));
  const a = (order.shippingAddress ?? {}) as Record<string, string>;

  const canCancel = (CANCELLABLE as readonly string[]).includes(order.status);
  const delivered = order.status === "delivered" ? deliveredAt(order.history, order.updatedAt) : null;
  const returnOpen = delivered ? canRequestReturn(delivered) : false;
  const returnedQty = (variantId: string) =>
    order.returns.filter((r) => r.status !== "rejected").flatMap((r) => r.items as { variantId: string; quantity: number }[]).filter((i) => i.variantId === variantId).reduce((s, i) => s + i.quantity, 0);
  const shipment = order.shipments[0];

  return (
    <main className="mx-auto max-w-[900px] px-6 pb-28 pt-16 md:pt-24">
      <Link href="/cuenta" className="text-[15px] text-link hover:underline">← Mi cuenta</Link>
      <h1 className="mt-3 text-[clamp(36px,6vw,64px)]">Pedido NC-{order.number}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-3 text-[17px] text-muted">
        <span>{dateFmt.format(order.createdAt)}</span>
        <span className="rounded-full bg-ink/10 px-3 py-1 text-[14px] font-semibold text-ink">{ORDER_STATUS[order.status] ?? order.status}</span>
      </p>

      {(ok || error) && (
        <div role="status" className="mt-6 space-y-2">
          {ok && <p className="glass rounded-card px-5 py-3 text-[15px]">{ok}</p>}
          {error && <p className="rounded-card border border-red-300 bg-red-50 px-5 py-3 text-[15px] text-red-800">{error}</p>}
        </div>
      )}

      <section className="glass mt-8 rounded-card p-6">
        <h2 className="text-[22px]">Lo que compraste</h2>
        <ul className="mt-4 divide-y divide-ink/10">
          {order.items.map((i) => {
            const src = photos.get(i.variantId);
            const left = i.quantity - returnedQty(i.variantId);
            return (
              <li key={i.id} className="py-4">
                <div className="flex items-center gap-4">
                  <span className="block size-20 shrink-0 overflow-hidden rounded-[14px] bg-white">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={smallPhoto(src)} alt={i.name} loading="lazy" className="size-full object-contain p-1" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{i.name}</span>
                    <span className="block text-[14px] text-muted">{i.quantity} × {formatCOP(i.unitCents)}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatCOP(Number(i.totalCents))}</span>
                </div>
                {delivered && returnOpen && order.status === "delivered" && left > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[14px] font-semibold text-link">Pedir devolución</summary>
                    <form key={`${i.id}-${v}`} action={requestMyReturn} className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="number" value={order.number} />
                      <input type="hidden" name="itemId" value={i.id} />
                      <label className="block text-[13px] text-muted">
                        Motivo
                        <select name="kind" required className={input} defaultValue="">
                          <option value="" disabled>Elige…</option>
                          <option value="retracto">Me arrepentí de la compra</option>
                          <option value="garantia">Llegó dañado o con falla</option>
                          <option value="otro">Otro</option>
                        </select>
                      </label>
                      <label className="block text-[13px] text-muted">
                        Unidades a devolver
                        <input name="qty" type="number" min={1} max={left} defaultValue={1} required className={input} />
                      </label>
                      <label className="block text-[13px] text-muted sm:col-span-2">
                        Cuéntanos qué pasó
                        <textarea name="reason" required minLength={5} maxLength={1000} rows={3} className={input} />
                      </label>
                      <div className="sm:col-span-2">
                        <button type="submit" className={buttonClasses("buy")}>Enviar solicitud</button>
                      </div>
                    </form>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-ink/15 pt-4 text-[16px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatCOP(Number(order.subtotalCents))}</dd></div>
          {order.discountCents > 0n && <div className="flex justify-between"><dt className="text-muted">Descuento</dt><dd>−{formatCOP(Number(order.discountCents))}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd>{order.shippingCents > 0n ? formatCOP(Number(order.shippingCents)) : "Gratis"}</dd></div>
          <div className="flex justify-between text-[19px] font-semibold"><dt>Total</dt><dd>{formatCOP(Number(order.totalCents))}</dd></div>
        </dl>
      </section>

      {delivered && order.status === "delivered" && (
        <p className="mt-4 text-[14px] text-muted">
          {returnOpen
            ? `Puedes pedir la devolución de un producto hasta el ${dateFmt.format(returnDeadline(delivered))} (${RETURN_DAYS} días después de la entrega).`
            : `Ya pasaron ${RETURN_DAYS} días desde la entrega, por eso no se puede pedir la devolución desde aquí. Si tu producto tiene una falla, escríbenos por WhatsApp.`}
        </p>
      )}

      {order.returns.length > 0 && (
        <section className="glass mt-6 rounded-card p-6">
          <h2 className="text-[22px]">Devoluciones</h2>
          <ul className="mt-3 space-y-2 text-[15px]">
            {order.returns.map((r) => (
              <li key={r.id}>
                {(r.items as { quantity: number; name: string }[]).map((i) => `${i.quantity} × ${i.name}`).join(", ")} ·{" "}
                <strong>{RETURN_STATUS[r.status] ?? r.status}</strong> <span className="text-muted">({dateFmt.format(r.createdAt)})</span>
                {r.status === "refunded" && r.refundCents > 0n && <span> · Reembolso: {formatCOP(Number(r.refundCents))}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="glass mt-6 rounded-card p-6">
        <h2 className="text-[22px]">Envío</h2>
        <p className="mt-3 text-[15px] leading-relaxed">
          {a.name}<br />
          {a.line}<br />
          {a.city}, {a.department}
          {a.notes ? <><br /><span className="text-muted">{a.notes}</span></> : null}
        </p>
        {shipment && (
          <p className="mt-3 text-[15px]">
            {shipment.carrier}
            {shipment.trackingNumber ? ` · guía ${shipment.trackingNumber}` : ""}{" "}
            {shipment.trackingUrl && (
              <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">Rastrear</a>
            )}
          </p>
        )}
      </section>

      <section className="glass mt-6 rounded-card p-6">
        <h2 className="text-[22px]">Historial</h2>
        <ul className="mt-3 space-y-1.5 text-[15px]">
          <li className="text-muted">{dateTimeFmt.format(order.createdAt)} · Pedido creado</li>
          {order.history.map((h) => (
            <li key={h.id}>
              <span className="text-muted">{dateTimeFmt.format(h.createdAt)} ·</span> {ORDER_STATUS[h.toStatus] ?? h.toStatus}
            </li>
          ))}
        </ul>
      </section>

      {canCancel && (
        <section className="glass mt-6 rounded-card p-6">
          <h2 className="text-[22px]">Cancelar el pedido</h2>
          <p className="mt-2 text-[15px] text-muted">
            {order.status === "pending_payment"
              ? "Aún no pagas: puedes cancelarlo y no se cobra nada."
              : "Todavía no ha sido enviado, así que puedes cancelarlo. Te devolveremos el dinero y te avisaremos cómo y cuándo (depende de tu medio de pago)."}
          </p>
          <form action={cancelMyOrder} className="mt-4">
            <input type="hidden" name="number" value={order.number} />
            <label className="mb-3 flex items-start gap-3 text-[15px]">
              <input type="checkbox" required className="mt-1 size-4" />
              <span>Sí, quiero cancelar este pedido.</span>
            </label>
            <button type="submit" className={buttonClasses("ghost")}>Cancelar pedido</button>
          </form>
        </section>
      )}
    </main>
  );
}
