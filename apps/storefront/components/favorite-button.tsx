"use client";

import { useHydrated } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";

const heart = (filled: boolean) => (
  <svg viewBox="0 0 24 24" className="size-[18px]" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.4 5 6.6 5c1.9 0 3.5 1 5.4 3 1.9-2 3.5-3 5.4-3 3.2 0 5.1 3.1 3.9 6.3-1.8 4.6-9.3 9.2-9.3 9.2Z" />
  </svg>
);

/**
 * Corazón para guardar UN color de un modelo (su SKU) en favoritos; otros colores del mismo producto no se marcan.
 * Con `label` es un botón con texto (ficha); sin él, un círculo sobre la tarjeta.
 */
export function FavoriteButton({ sku, name, label = false, className = "" }: { sku: string; name: string; label?: boolean; className?: string }) {
  const hydrated = useHydrated();
  const on = useFavorites((s) => s.items.includes(sku)) && hydrated;
  const toggle = useFavorites((s) => s.toggle);
  const text = on ? "Quitar de favoritos" : "Guardar en favoritos";
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${text}: ${name}`}
      title={text}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(sku);
      }}
      className={
        label
          ? `inline-flex items-center gap-2 rounded-full border border-ink/30 px-4 py-2 text-[14px] font-medium hover:border-ink ${on ? "bg-ink text-canvas" : ""} ${className}`
          : `grid size-9 place-items-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur hover:scale-105 ${on ? "text-red-600" : ""} ${className}`
      }
    >
      {heart(on)}
      {label && <span>{on ? "En tus favoritos" : "Guardar en favoritos"}</span>}
    </button>
  );
}
