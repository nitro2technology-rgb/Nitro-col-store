import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await currentUser();
  const name = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "");
  return (
    <main className="mx-auto max-w-[1440px] px-6 pb-28 pt-16 md:pt-24">
      <h1 className="text-[clamp(44px,8vw,96px)]">Finalizar compra</h1>
      <CheckoutForm defaultEmail={user?.email ?? ""} defaultName={name} />
    </main>
  );
}
