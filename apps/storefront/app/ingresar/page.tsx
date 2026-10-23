import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@nitro/ui";

export const metadata: Metadata = { title: "Ingresar" };

const field = "mt-2 w-full rounded-button border border-ink/30 bg-transparent px-4 py-3 text-[17px] backdrop-blur-md";

/** Formulario sin conexión: se activa cuando exista Supabase Auth. */
export default function SignInPage() {
  return (
    <main className="mx-auto max-w-[480px] px-6 pb-28 pt-16 md:pt-24">
      <h1 className="text-[clamp(40px,7vw,64px)]">Ingresar</h1>
      <form className="glass mt-10 space-y-5 rounded-card p-6 md:p-8" aria-describedby="auth-soon">
        <label className="block text-sm">
          Correo
          <input type="email" autoComplete="email" className={field} disabled />
        </label>
        <label className="block text-sm">
          Contraseña
          <input type="password" autoComplete="current-password" className={field} disabled />
        </label>
        <button type="submit" className={buttonClasses("buy", "w-full")} disabled>
          Ingresar
        </button>
        <p id="auth-soon" className="text-sm text-muted">
          El ingreso con correo y Google estará disponible pronto.
        </p>
      </form>
      <p className="mt-6 text-sm text-muted">
        <Link href="/" className="hover:text-ink">Volver a la tienda</Link>
      </p>
    </main>
  );
}
