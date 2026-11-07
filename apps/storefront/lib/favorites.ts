"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Favoritos de quien visita la tienda, guardados en su navegador. Cada favorito es UN color de UN modelo (su SKU), no el
 * producto entero. Versiones anteriores guardaban el slug del producto: esos valores se siguen entendiendo (se muestran con
 * el primer color disponible) y `FavoritesLink` los convierte a SKU.
 */
type FavState = {
  items: string[];
  toggle: (sku: string) => void;
  set: (items: string[]) => void;
};

export const useFavorites = create<FavState>()(
  persist(
    (set) => ({
      items: [],
      set: (items) => set({ items: [...new Set(items)].slice(0, 60) }),
      toggle: (sku) => set((s) => ({ items: s.items.includes(sku) ? s.items.filter((x) => x !== sku) : [sku, ...s.items].slice(0, 60) })),
    }),
    {
      name: "nitro-favoritos",
      version: 2,
      migrate: (old) => ({ items: Array.isArray((old as { slugs?: unknown })?.slugs) ? ((old as { slugs: string[] }).slugs) : [] }),
    },
  ),
);
