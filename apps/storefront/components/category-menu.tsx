"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CategoryNode } from "@/lib/products";

export function CategoryMenu({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  // Se abre al pasar el mouse y se cierra poco después de salir (el retraso permite bajar al panel).
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hoverOpen = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={wrapRef} onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="category-panel"
        onClick={() => setOpen((v) => !v)}
        onFocus={hoverOpen}
        className="nav-fx nav-link inline-flex items-center gap-1.5"
      >
        Categorías
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5 5 6.5 8 3.5" />
        </svg>
      </button>

      {open && (
        <div
          id="category-panel"
          className="menu-in glass-nav absolute inset-x-0 top-full rounded-b-[28px]"
        >
          <div className="mx-auto grid max-w-[1024px] gap-10 px-6 py-10 sm:grid-cols-2">
            {categories.map((parent) => (
              <div key={parent.slug}>
                <Link
                  href={`/c/${parent.slug}`}
                  className="text-[28px] font-semibold tracking-[-0.02em] hover:opacity-80"
                >
                  {parent.name}
                </Link>
                <ul className="mt-4 space-y-3">
                  {parent.children.map((child) => (
                    <li key={child.slug}>
                      <Link
                        href={`/c/${child.slug}`}
                        className="text-[17px] text-ink/80 transition-colors hover:text-ink"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
