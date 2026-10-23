"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findCatalogVariant } from "@/lib/catalog-client";

/** El carrito solo guarda SKU y cantidad; precio y nombre se leen siempre del catálogo. */
export type CartLine = { sku: string; qty: number };

type CartState = {
  lines: CartLine[];
  /** Devuelve cuántas unidades se agregaron realmente (0 si ya no queda stock). */
  add: (sku: string, qty?: number) => number;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
};

const maxFor = (sku: string) => findCatalogVariant(sku)?.variant.stock ?? 0;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (sku, qty = 1) => {
        const current = get().lines.find((l) => l.sku === sku)?.qty ?? 0;
        const next = Math.min(current + qty, maxFor(sku));
        const added = next - current;
        if (added <= 0) return 0;
        set((s) => ({
          lines: current
            ? s.lines.map((l) => (l.sku === sku ? { ...l, qty: next } : l))
            : [...s.lines, { sku, qty: next }],
        }));
        return added;
      },
      setQty: (sku, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.sku !== sku)
              : s.lines.map((l) => (l.sku === sku ? { ...l, qty: Math.min(qty, maxFor(sku)) } : l)),
        })),
      remove: (sku) => set((s) => ({ lines: s.lines.filter((l) => l.sku !== sku) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "nitro-cart", version: 1 },
  ),
);

/** El carrito vive en localStorage: hasta montar en el cliente, el servidor no sabe qué hay. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
