import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { authEnabled, currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ingresar", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/cuenta", error } = await searchParams;
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/cuenta";
  if (await currentUser()) redirect(dest);

  return (
    <main className="mx-auto max-w-[480px] px-6 pb-28 pt-16 md:pt-24">
      <h1 className="text-[clamp(40px,7vw,64px)]">Mi cuenta</h1>
      {error && (
        <p role="alert" className="mt-6 text-[15px] text-red-600">
          No se pudo completar el ingreso. Intenta de nuevo.
        </p>
      )}
      {authEnabled() ? (
        <AuthForm next={dest} />
      ) : (
        <p className="mt-8 text-[17px] text-muted">El ingreso con correo y Google estará disponible pronto.</p>
      )}
      <p className="mt-6 text-sm text-muted">
        No necesitas cuenta para comprar. <Link href="/" className="hover:text-ink">Volver a la tienda</Link>
      </p>
    </main>
  );
}
