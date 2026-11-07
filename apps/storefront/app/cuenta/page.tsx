import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dateFmt } from "@/lib/order-status";
import { photosForVariants } from "@/lib/order-photos";
import { ensureProfile } from "@/lib/profile";
import { returnDeadline, canRequestReturn, deliveredAt } from "@/lib/returns-policy";
import { currentUser } from "@/lib/supabase/server";
import { OrderCard } from "./order-card";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };
export const dynamic = "force-dynamic";

const tile = "glass block rounded-card p-5 hover:opacity-90";

export default async function AccountHome() {
  const user = await currentUser();
  if (!user) redirect("/ingresar?next=/cuenta");
  const profile = await ensureProfile(user);
  const { db } = await import("@nitro/db");

  const orders = profile
    ? await db.order.findMany({
        where: { profileId: user.id },
        orderBy: { number: "desc" },
        take: 30,
        select: {
          number: true,
          status: true,
          totalCents: true,
          createdAt: true,
          updatedAt: true,
          items: { select: { variantId: true, name: true, quantity: true } },
          history: { select: { toStatus: true, createdAt: true } },
        },
      })
    : [];
  const addressCount = profile ? await db.address.count({ where: { profileId: user.id } }) : 0;

  const inProgress = orders.filter((o) => ["pending_payment", "paid", "processing", "shipped", "return_requested"].includes(o.status));
  // Entregados con tiempo todavía para pedir devolución
  const returnable = orders.filter((o) => o.status === "delivered" && canRequestReturn(deliveredAt(o.history, o.updatedAt)));
  const recent = orders.slice(0, 3);
  const photos = await photosForVariants([...new Set(recent.flatMap((o) => o.items.map((i) => i.variantId)))]);
  const first = (profile?.fullName ?? "").split(" ")[0];

  return (
    <>
      <h1 className="text-[clamp(30px,4vw,44px)]">{first ? `Hola, ${first}` : "Mi cuenta"}</h1>
      <p className="mt-2 text-[16px] text-muted">Desde aquí sigues tus pedidos, guardas tus datos y revisas tus favoritos.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/cuenta/pedidos" className={tile}>
          <span className="block text-[13px] uppercase tracking-[0.08em] text-muted">Pedidos en curso</span>
          <span className="mt-1 block text-[34px] font-semibold leading-none">{inProgress.length}</span>
          <span className="mt-2 block text-[14px] text-muted">{orders.length} en total</span>
        </Link>
        <Link href="/cuenta/favoritos" className={tile}>
          <span className="block text-[13px] uppercase tracking-[0.08em] text-muted">Favoritos</span>
          <span className="mt-1 block text-[18px] font-semibold">Ver mi lista</span>
          <span className="mt-2 block text-[14px] text-muted">Productos que guardaste con el corazón</span>
        </Link>
        <Link href="/cuenta/datos" className={tile}>
          <span className="block text-[13px] uppercase tracking-[0.08em] text-muted">Direcciones</span>
          <span className="mt-1 block text-[34px] font-semibold leading-none">{addressCount}</span>
          <span className="mt-2 block text-[14px] text-muted">{addressCount === 0 ? "Guarda una para comprar más rápido" : "guardadas para tus compras"}</span>
        </Link>
      </div>

      {returnable.length > 0 && (
        <div className="glass mt-6 rounded-card p-5 text-[15px]">
          <p className="font-semibold">Tienes tiempo para pedir una devolución</p>
          <ul className="mt-2 space-y-1 text-muted">
            {returnable.map((o) => (
              <li key={o.number}>
                <Link href={`/cuenta/pedidos/${o.number}`} className="text-link hover:underline">NC-{o.number}</Link> · hasta el {dateFmt.format(returnDeadline(deliveredAt(o.history, o.updatedAt)))}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 flex items-baseline justify-between">
        <h2 className="text-[24px]">Últimos pedidos</h2>
        {orders.length > 3 && <Link href="/cuenta/pedidos" className="text-[15px] text-link hover:underline">Ver todos</Link>}
      </div>
      {recent.length === 0 ? (
        <p className="mt-3 text-[16px] text-muted">
          Aún no tienes pedidos con esta cuenta. <Link href="/" className="text-link hover:underline">Ir a la tienda</Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {recent.map((o) => (
            <li key={o.number}>
              <OrderCard order={o} photos={photos} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
