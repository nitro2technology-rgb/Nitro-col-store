"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavoriteRows } from "@/lib/favorite-rows";

const LINKS = [
  { href: "/cuenta", label: "Resumen", exact: true },
  { href: "/cuenta/pedidos", label: "Mis pedidos" },
  { href: "/cuenta/favoritos", label: "Mis favoritos" },
  { href: "/cuenta/datos", label: "Datos y direcciones" },
  { href: "/cuenta/clave", label: "Contraseña" },
];

export function AccountNav({ active, admin }: { active: number; admin: boolean }) {
  const path = usePathname();
  const favs = useFavoriteRows().length;
  const badge: Record<string, number> = { "/cuenta/pedidos": active, "/cuenta/favoritos": favs };
  return (
    <nav aria-label="Mi cuenta" className="-mx-1 mt-4 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {LINKS.map((l) => {
        const on = l.exact ? path === l.href : path === l.href || path.startsWith(`${l.href}/`);
        const n = badge[l.href] ?? 0;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center justify-between gap-3 rounded-[12px] px-3.5 py-2.5 text-[15px] ${on ? "bg-ink font-semibold text-canvas" : "hover:bg-ink/10"}`}
          >
            <span>{l.label}</span>
            {n > 0 && <span className={`rounded-full px-2 text-[12px] font-semibold ${on ? "bg-canvas/25" : "bg-ink/10"}`}>{n}</span>}
          </Link>
        );
      })}
      {admin && (
        <Link href="/admin" className="shrink-0 rounded-[12px] px-3.5 py-2.5 text-[15px] hover:bg-ink/10">
          Panel de administración
        </Link>
      )}
      <form action="/auth/salir" method="post" className="shrink-0 lg:mt-3 lg:border-t lg:border-ink/15 lg:pt-3">
        <button type="submit" className="w-full rounded-[12px] px-3.5 py-2.5 text-left text-[15px] text-muted hover:bg-ink/10">
          Cerrar sesión
        </button>
      </form>
    </nav>
  );
}
