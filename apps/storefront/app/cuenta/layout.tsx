import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { ensureProfile } from "@/lib/profile";
import { currentUser } from "@/lib/supabase/server";
import { AccountNav } from "./account-nav";

export const dynamic = "force-dynamic";

/** Panel de la persona que compra: menú lateral (en celular, una fila deslizable) y la página elegida a la derecha. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/ingresar?next=/cuenta");
  const [profile, admin] = await Promise.all([ensureProfile(user), isAdmin(user)]);

  let active = 0;
  try {
    const { db } = await import("@nitro/db");
    // Pedidos "en curso": pagados que aún no llegan o con una devolución abierta
    active = await db.order.count({ where: { profileId: user.id, status: { in: ["paid", "processing", "shipped", "return_requested"] } } });
  } catch {
    /* el menú se muestra igual */
  }

  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-28 pt-12 md:px-6 md:pt-20">
      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-24">
          <div className="glass rounded-card p-4 lg:p-5">
            <p className="truncate text-[17px] font-semibold">{profile?.fullName || "Mi cuenta"}</p>
            <p className="truncate text-[13px] text-muted">{user.email}</p>
            <AccountNav active={active} admin={admin} />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
