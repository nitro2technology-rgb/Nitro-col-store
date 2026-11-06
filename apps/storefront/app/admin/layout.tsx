import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const links = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div data-theme="light" className="relative z-10 min-h-screen bg-[#f5f5f7] text-ink">
      <div className="border-b border-ink/10 bg-white/80 backdrop-blur-md">
        <nav aria-label="Panel" className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 text-[15px]">
          <span className="font-semibold">Panel</span>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted hover:text-ink">
              {l.label}
            </Link>
          ))}
          <span className="ml-auto truncate text-[13px] text-muted">{user.email}</span>
        </nav>
      </div>
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-10">{children}</main>
    </div>
  );
}
