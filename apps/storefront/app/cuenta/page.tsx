import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCOP } from "@nitro/shared";
import { buttonClasses } from "@nitro/ui";
import { isAdmin } from "@/lib/admin";
import { dateFmt, ORDER_STATUS } from "@/lib/order-status";
import { photosForVariants, smallPhoto } from "@/lib/order-photos";
import { ensureProfile } from "@/lib/profile";
import { currentUser } from "@/lib/supabase/server";
import { deleteAddress, saveAddress, saveProfileData, setDefaultAddress } from "./actions";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };
export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded-button border border-ink/30 bg-transparent px-3 py-2.5 text-[16px] text-ink";
const lbl = "block text-[13px] text-muted";

function AddressFields({ a }: { a?: { fullName: string; phone: string; department: string; city: string; line1: string; notes: string | null } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className={lbl}>
        Nombre de quien recibe
        <input name="fullName" required minLength={2} maxLength={120} defaultValue={a?.fullName} className={input} />
      </label>
      <label className={lbl}>
        Teléfono / WhatsApp
        <input name="phone" type="tel" required minLength={7} maxLength={20} defaultValue={a?.phone} className={input} />
      </label>
      <label className={lbl}>
        Departamento
        <input name="department" required minLength={2} maxLength={80} defaultValue={a?.department} className={input} />
      </label>
      <label className={lbl}>
        Ciudad
        <input name="city" required minLength={2} maxLength={80} defaultValue={a?.city} className={input} />
      </label>
      <label className={`${lbl} sm:col-span-2`}>
        Dirección
        <input name="line1" required minLength={5} maxLength={200} defaultValue={a?.line1} className={input} />
      </label>
      <label className={`${lbl} sm:col-span-2`}>
        Indicaciones (opcional)
        <input name="notes" maxLength={300} defaultValue={a?.notes ?? ""} className={input} />
      </label>
    </div>
  );
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; v?: string }> }) {
  const { ok, error, v } = await searchParams;
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
        select: { number: true, status: true, totalCents: true, createdAt: true, items: { select: { variantId: true, name: true, quantity: true } } },
      })
    : [];
  const addresses = profile ? await db.address.findMany({ where: { profileId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : [];
  const photos = await photosForVariants([...new Set(orders.flatMap((o) => o.items.map((i) => i.variantId)))]);

  return (
    <main className="mx-auto max-w-[900px] px-6 pb-28 pt-16 md:pt-24">
      <h1 className="text-[clamp(40px,7vw,80px)]">Mi cuenta</h1>
      <p className="mt-4 text-[17px] text-muted">
        {profile?.fullName ? `${profile.fullName} · ` : ""}
        {user.email}
      </p>
      <nav aria-label="Secciones" className="mt-6 flex flex-wrap gap-2 text-[14px]">
        <a href="#pedidos" className="rounded-full border border-ink/30 px-4 py-1.5 hover:border-ink">Mis pedidos</a>
        <a href="#datos" className="rounded-full border border-ink/30 px-4 py-1.5 hover:border-ink">Mis datos y direcciones</a>
        <a href="#favoritos" className="rounded-full border border-ink/30 px-4 py-1.5 hover:border-ink">Mis favoritos</a>
      </nav>

      {(ok || error) && (
        <div role="status" className="mt-6 space-y-2">
          {ok && <p className="glass rounded-card px-5 py-3 text-[15px]">{ok}</p>}
          {error && <p className="rounded-card border border-red-300 bg-red-50 px-5 py-3 text-[15px] text-red-800">{error}</p>}
        </div>
      )}

      <h2 id="pedidos" className="mt-12 scroll-mt-24 text-[28px]">Mis pedidos</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-[17px] text-muted">Aún no tienes pedidos con esta cuenta.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.number}>
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
            </li>
          ))}
        </ul>
      )}

      <h2 id="datos" className="mt-14 scroll-mt-24 text-[28px]">Mis datos y direcciones</h2>
      <p className="mt-2 text-[15px] text-muted">Se usan para llenar tus próximos pedidos sin que tengas que escribirlos otra vez.</p>
      <form key={`p-${v}`} action={saveProfileData} className="glass mt-5 rounded-card p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={lbl}>
            Nombre completo
            <input name="fullName" required minLength={2} maxLength={120} defaultValue={profile?.fullName ?? ""} className={input} />
          </label>
          <label className={lbl}>
            Celular / WhatsApp
            <input name="phone" type="tel" maxLength={20} defaultValue={profile?.phone ?? ""} className={input} />
          </label>
        </div>
        <button type="submit" className={buttonClasses("buy", "mt-4")}>Guardar mis datos</button>
      </form>

      <ul className="mt-5 space-y-3">
        {addresses.map((a) => (
          <li key={a.id} className="glass rounded-card p-5">
            <p className="font-semibold">
              {a.fullName} {a.isDefault && <span className="ml-2 rounded-full bg-ink px-2.5 py-0.5 text-[12px] text-canvas">Principal</span>}
            </p>
            <p className="mt-1 text-[15px] text-muted">
              {a.line1}, {a.city}, {a.department} · {a.phone}
              {a.notes ? ` · ${a.notes}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!a.isDefault && (
                <form action={setDefaultAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className={buttonClasses("ghost")}>Hacer principal</button>
                </form>
              )}
              <form action={deleteAddress}>
                <input type="hidden" name="id" value={a.id} />
                <button className={buttonClasses("ghost")}>Borrar</button>
              </form>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-[14px] text-link">Editar</summary>
              <form key={`e-${a.id}-${v}`} action={saveAddress} className="mt-3">
                <input type="hidden" name="id" value={a.id} />
                <AddressFields a={a} />
                <button type="submit" className={buttonClasses("buy", "mt-3")}>Guardar cambios</button>
              </form>
            </details>
          </li>
        ))}
      </ul>
      <details className="glass mt-3 rounded-card p-5">
        <summary className="cursor-pointer font-semibold">+ Agregar una dirección</summary>
        <form key={`n-${v}`} action={saveAddress} className="mt-4">
          <AddressFields />
          <button type="submit" className={buttonClasses("buy", "mt-3")}>Guardar dirección</button>
        </form>
      </details>

      <p id="favoritos" className="mt-14 scroll-mt-24 text-[28px] font-semibold">Mis favoritos</p>
      <p className="mt-2 text-[15px] text-muted">Los productos que guardas con el corazón quedan ligados a tu cuenta y aparecen abajo, en todos tus dispositivos.</p>

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
