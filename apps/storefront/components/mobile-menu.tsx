"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CategoryNode } from "@/lib/products";

/** Menú de celular: botón de tres rayas a la izquierda que despliega Inicio y las categorías con sus subcategorías. */
export function MobileMenu({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div>
      <button type="button" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} aria-controls="mobile-panel" onClick={() => setOpen((v) => !v)} className="nav-fx grid size-10 place-items-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
        </svg>
      </button>
      {open && (
        <div id="mobile-panel" className="menu-in glass-nav absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-b-[24px]" style={{ background: "rgb(20 20 20 / 0.96)" }}>
          <ul className="px-6 py-4 text-ink">
            <li className="border-b border-ink/15">
              <Link href="/" className="block py-4 text-[18px] font-semibold">
                Inicio
              </Link>
            </li>
            {categories.map((parent) => (
              <li key={parent.slug} className="border-b border-ink/15 last:border-b-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[18px] font-semibold [&::-webkit-details-marker]:hidden">
                    {parent.name}
                    <svg width="14" height="14" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-open:rotate-180">
                      <path d="M2 3.5 5 6.5 8 3.5" />
                    </svg>
                  </summary>
                  <ul className="space-y-1 pb-4 pl-2">
                    <li>
                      <Link href={`/c/${parent.slug}`} className="block py-2 text-[16px] text-ink/90 underline underline-offset-4">
                        Ver todo {parent.name}
                      </Link>
                    </li>
                    {parent.children.map((child) => (
                      <li key={child.slug}>
                        <Link href={`/c/${child.slug}`} className="block py-2 text-[16px] text-ink/80">
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
