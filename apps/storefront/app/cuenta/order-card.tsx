import Link from "next/link";
import { formatCOP } from "@nitro/shared";
import { dateFmt, ORDER_STATUS } from "@/lib/order-status";
import { smallPhoto } from "@/lib/order-photos";

type Row = { number: number; status: string; totalCents: bigint; createdAt: Date; items: { variantId: string; name: string; quantity: number }[] };

/** Tarjeta de un pedido con las fotos de lo que se compró. */
export function OrderCard({ order: o, photos }: { order: Row; photos: Map<string, string> }) {
  return (
    <Link href={`/cuenta/pedidos/${o.number}`} className="glass block rounded-card p-5 hover:opacity-90">
      <span className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-semibold">NC-{o.number}</span>
        <span className="text-muted">{dateFmt.format(o.createdAt)}</span>
        <span className="rounded-full bg-ink/10 px-3 py-1 text-[13px] font-semibold">{ORDER_STATUS[o.status] ?? o.status}</span>
        <span className="font-semibold">{formatCOP(Number(o.totalCents))}</span>
      </span>
      <span className="mt-4 flex gap-2 overflow-x-auto">
        {o.items.map((i, idx) => {
          const src = photos.get(i.variantId);
          return (
            <span key={idx} className="relative block size-16 shrink-0 overflow-hidden rounded-[12px] bg-white" title={`${i.quantity} × ${i.name}`}>
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={smallPhoto(src)} alt={i.name} loading="lazy" className="size-full object-contain p-1" />
              ) : null}
              {i.quantity > 1 && <span className="absolute bottom-0 right-0 rounded-tl-md bg-black px-1.5 text-[11px] text-white">×{i.quantity}</span>}
            </span>
          );
        })}
      </span>
    </Link>
  );
}
