import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/components/new-password-form";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewPasswordPage() {
  if (!(await currentUser())) redirect("/ingresar");
  return (
    <>
      <h1 className="text-[clamp(30px,4vw,44px)]">Contraseña</h1>
      <NewPasswordForm />
    </>
  );
}
