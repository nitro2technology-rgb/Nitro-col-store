import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-6 pb-28 pt-16 md:pt-24">
      <h1 className="text-[clamp(44px,8vw,96px)]">Finalizar compra</h1>
      <CheckoutForm />
    </main>
  );
}
