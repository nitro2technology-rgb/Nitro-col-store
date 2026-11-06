"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./ui";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Resumen", icon: "home" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "orders" },
  { href: "/admin/productos", label: "Productos", icon: "box" },
  { href: "/admin/categorias", label: "Categorías", icon: "box" },
  { href: "/admin/devoluciones", label: "Devoluciones", icon: "returns" },
];

/** Menú lateral en escritorio; en el celular se vuelve una fila deslizable arriba. */
export function Sidebar({ toShip, openReturns }: { toShip: number; openReturns: number }) {
  const path = usePathname();
  const badge: Record<string, number> = { "/admin/pedidos": toShip, "/admin/devoluciones": openReturns };
  return (
    <nav aria-label="Panel" className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:py-6">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex shrink-0 items-center gap-3 rounded-[10px] px-4 py-2.5 text-[15px] lg:rounded-none lg:px-6 lg:py-3 ${
              active ? "bg-[#efedfd] font-semibold text-[#4a3fd0]" : "text-[#3d3d55] hover:bg-[#f6f6fa]"
            }`}
          >
            {active && <span className="absolute inset-y-0 left-0 hidden w-[4px] rounded-r bg-[#5b4fe0] lg:block" />}
            <Icon name={l.icon} />
            {l.label}
            {badge[l.href] ? (
              <span className="ml-auto rounded-full bg-[#5b4fe0] px-2 py-0.5 text-[12px] font-semibold text-white">{badge[l.href]}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
