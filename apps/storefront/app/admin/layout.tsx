import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { Sidebar } from "./sidebar";
import { Icon } from "./ui";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const { db } = await import("@nitro/db");
  const [toShip, openReturns] = await Promise.all([
    db.order.count({ where: { status: { in: ["paid", "processing"] } } }),
    db.orderReturn.count({ where: { status: { in: ["requested", "received"] } } }),
  ]);
  const initials = (user.email ?? "?").slice(0, 2).toUpperCase();

  // Capa fija sobre el encabezado y el pie de la tienda: el panel es su propia aplicación.
  return (
    <div data-theme="light" className="fixed inset-0 z-[60] overflow-y-auto bg-white text-ink">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#ececf2] bg-white/95 px-5 backdrop-blur lg:px-8">
        <Link href="/admin" className="text-[22px] font-bold tracking-[-0.03em] text-[#1d1b3a]">
          Nitro<span className="text-[#5b4fe0]">.</span>
        </Link>
        <span className="hidden rounded-[8px] bg-[#f3f3f8] px-3 py-1 text-[13px] font-medium text-[#5c5c70] sm:inline">Panel de la tienda</span>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/" target="_blank" className="hidden items-center gap-2 rounded-[10px] border border-[#dcdce6] px-3 py-1.5 text-[14px] font-medium hover:border-[#5b4fe0] hover:text-[#5b4fe0] sm:inline-flex">
            <Icon name="store" className="size-[18px]" /> Ver tienda
          </Link>
          <Link href="/cuenta" title={user.email ?? ""} className="grid size-9 place-items-center rounded-full bg-[#5b4fe0] text-[13px] font-semibold text-white">
            {initials}
          </Link>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-[#ececf2] lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r">
          <Sidebar toShip={toShip} openReturns={openReturns} />
        </aside>
        <main className="min-w-0 px-4 pb-24 pt-8 sm:px-8 lg:px-10">
          <div className="max-w-[1320px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
