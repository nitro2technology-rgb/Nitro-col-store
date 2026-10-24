import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCOP } from "@nitro/shared";
import { buttonClasses } from "@nitro/ui";
import { ClearCart } from "@/components/clear-cart";
import { applyTransaction, fetchTransaction, parseReference } from "@/lib/wompi";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };
export const dynamic = "force-dynamic";

const messages = {
  paid: { title: "¡Pago recibido!", body: "Gracias por tu compra. Te escribiremos al correo y al WhatsApp que dejaste para coordinar el envío." },
  pending_payment: { title: "Estamos esperando la confirmación del pago", body: "Si ya pagaste, puede tardar unos minutos. Recarga esta página en un momento." },
  other: { title: "Tu pedido", body: "Escríbenos si tienes dudas sobre este pedido." },
} as const;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { ref } = await params;
  const { id } = await searchParams;
  const number = parseReference(ref);
  if (number === null) notFound();

  // Wompi vuelve aquí con ?id=<transacción>. Se consulta a Wompi (no se confía en la URL) y se aplica el
  // resultado: sirve de respaldo por si el webhook tarda o no llega (por ejemplo, en pruebas locales).
  if (id) {
    const tx = await fetchTransaction(id);
    if (tx && tx.reference === ref) await applyTransaction(tx);
  }

  const { db } = await import("@nitro/db");
  const order = await db.order.findUnique({
    where: { number },
    select: { status: true, totalCents: true, payments: { select: { status: true }, take: 1 } },
  });
  if (!order) notFound();

  const paid = order.status === "paid";
  const declined = !paid && ["declined", "voided"].includes(order.payments[0]?.status ?? "");
  const msg = paid ? messages.paid : declined ? { title: "El pago no se completó", body: "No se cobró nada. Puedes intentarlo de nuevo desde tu carrito." } : order.status === "pending_payment" ? messages.pending_payment : messages.other;

  return (
    <main className="mx-auto max-w-[1440px] px-6 pb-28 pt-16 md:pt-24">
      {paid && <ClearCart />}
      <p className="text-[17px] font-semibold text-eyebrow">Pedido {ref}</p>
      <h1 className="mt-3 text-[clamp(36px,6vw,72px)]">{msg.title}</h1>
      <p className="mt-6 max-w-[40rem] text-[19px] leading-[1.47] text-muted">{msg.body}</p>
      <p className="mt-6 text-[19px]">Total: {formatCOP(Number(order.totalCents))}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className={buttonClasses("buy")}>
          Seguir comprando
        </Link>
        {!paid && (
          <Link href="/carrito" className={buttonClasses("ghost")}>
            Volver al carrito
          </Link>
        )}
      </div>
    </main>
  );
}
