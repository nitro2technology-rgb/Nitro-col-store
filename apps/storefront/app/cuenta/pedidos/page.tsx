import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCOP } from "@nitro/shared";
import { OrderCard } from "../order-card";
import { photosForVariants } from "@/lib/order-photos";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mis pedidos", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/ingresar?next=/cuenta/pedidos");
  const { db } = await import("@nitro/db");
  const orders = await db.order.findMany({
    where: { profileId: user.id },
    orderBy: { number: "desc" },
    take: 50,
    select: { number: true, status: true, totalCents: true, createdAt: true, items: { select: { variantId: true, name: true, quantity: true } } },
  });
  const photos = await photosForVariants([...new Set(orders.flatMap((o) => o.items.map((i) => i.variantId)))]);
  const spent = orders.filter((o) => !["pending_payment", "cancelled", "refunded"].includes(o.status)).reduce((s, o) => s + Number(o.totalCents), 0);

  return (
    <>
      <h1 className="text-[clamp(30px,4vw,44px)]">Mis pedidos</h1>
      {orders.length === 0 ? (
        <p className="mt-4 text-[17px] text-muted">
          Aún no tienes pedidos con esta cuenta.{" "}
          <Link href="/" className="text-link hover:underline">Ir a la tienda</Link>
        </p>
      ) : (
        <>
          <p className="mt-2 text-[15px] text-muted">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} · {formatCOP(spent)} en compras
          </p>
          <ul className="mt-6 space-y-3">
            {orders.map((o) => (
              <li key={o.number}>
                <OrderCard order={o} photos={photos} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
