import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buttonClasses } from "@nitro/ui";
import { ensureProfile } from "@/lib/profile";
import { currentUser } from "@/lib/supabase/server";
import { deleteAddress, saveAddress, saveProfileData, setDefaultAddress } from "../actions";

export const metadata: Metadata = { title: "Datos y direcciones", robots: { index: false } };
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

export default async function DataPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; v?: string }> }) {
  const { ok, error, v } = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/ingresar?next=/cuenta/datos");
  const profile = await ensureProfile(user);
  const { db } = await import("@nitro/db");
  const addresses = profile ? await db.address.findMany({ where: { profileId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : [];

  return (
    <>
      {(ok || error) && (
        <div role="status" className="mb-6 space-y-2">
          {ok && <p className="glass rounded-card px-5 py-3 text-[15px]">{ok}</p>}
          {error && <p className="rounded-card border border-red-300 bg-red-50 px-5 py-3 text-[15px] text-red-800">{error}</p>}
        </div>
      )}
      <h1 className="text-[clamp(30px,4vw,44px)]">Datos y direcciones</h1>
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

    </>
  );
}
