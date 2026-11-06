import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCOP } from "@nitro/shared";
import { buttonClasses } from "@nitro/ui";
import { isAdmin } from "@/lib/admin";
import { dateFmt, ORDER_STATUS } from "@/lib/order-status";
import { ensureProfile } from "@/lib/profile";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/ingresar?next=/cuenta");

  const profile = await ensureProfile(user);
  const admin = await isAdmin(user);
  const { db } = await import("@nitro/db");
  const orders = profile
    ? await db.order.findMany({
        where: { profileId: user.id },
        orderBy: { number: "desc" },
        take: 50,
        select: { number: true, status: true, totalCents: true, createdAt: true },
      })
    : [];

  return (
    <main className="mx-auto max-w-[820px] px-6 pb-28 pt-16 md:pt-24">
      <h1 className="text-[clamp(40px,7vw,80px)]">Mi cuenta</h1>
      <p className="mt-4 text-[17px] text-muted">
        {profile?.fullName ? `${profile.fullName} · ` : ""}
        {user.email}
      </p>

      <h2 className="mt-12 text-[28px]">Mis pedidos</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-[17px] text-muted">Aún no tienes pedidos con esta cuenta.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.number}>
              <Link href={`/pedido/NC-${o.number}`} className="glass flex flex-wrap items-center justify-between gap-3 rounded-card p-5 hover:opacity-90">
                <span className="font-semibold">NC-{o.number}</span>
                <span className="text-muted">{dateFmt.format(o.createdAt)}</span>
                <span>{ORDER_STATUS[o.status] ?? o.status}</span>
                <span className="font-semibold">{formatCOP(Number(o.totalCents))}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {admin && (
        <p className="mt-12">
          <Link href="/admin" className={buttonClasses("buy")}>
            Panel de administración
          </Link>
        </p>
      )}

      <form action="/auth/salir" method="post" className="mt-12">
        <button type="submit" className={buttonClasses("ghost")}>
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
