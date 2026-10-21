"use client";

import Link from "next/link";
import { useCart, useHydrated } from "@/lib/cart";

export function CartLink() {
  const hydrated = useHydrated();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const shown = hydrated ? count : 0;

  return (
    <Link
      href="/carrito"
      aria-label={shown ? `Carrito de compras, ${shown} unidades` : "Carrito de compras"}
      className="relative opacity-90 transition-opacity hover:opacity-100"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      </svg>
      {shown > 0 && (
        <span className="absolute -right-2.5 -top-2 flex min-w-4 items-center justify-center rounded-full bg-action px-1 text-[10px] font-semibold leading-4 text-on-action">
          {shown}
        </span>
      )}
    </Link>
  );
}
