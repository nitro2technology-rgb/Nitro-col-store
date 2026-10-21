import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "Carrito" };

export default function CartPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-6 pb-28 pt-16 md:pt-24">
      <h1 className="text-[clamp(44px,8vw,96px)]">Tu carrito</h1>
      <CartView />
    </main>
  );
}
