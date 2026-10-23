import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@nitro/ui";

export const metadata: Metadata = { title: "Mi cuenta" };

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-[820px] px-6 pb-28 pt-16 md:pt-24">
      <h1 className="text-[clamp(40px,7vw,80px)]">Mi cuenta</h1>
      <p className="mt-6 text-[20px] text-muted">Aquí verás tus pedidos y direcciones cuando inicies sesión.</p>
      <Link href="/ingresar" className={buttonClasses("buy", "mt-8")}>Ingresar</Link>
    </main>
  );
}
