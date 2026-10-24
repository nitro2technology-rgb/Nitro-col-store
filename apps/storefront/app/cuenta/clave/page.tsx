import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/components/new-password-form";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewPasswordPage() {
  if (!(await currentUser())) redirect("/ingresar");
  return (
    <main className="mx-auto max-w-[820px] px-6 pb-28 pt-16 md:pt-24">
      <h1 className="text-[clamp(40px,7vw,64px)]">Nueva contraseña</h1>
      <NewPasswordForm />
    </main>
  );
}
