"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Favoritos de quien visita la tienda: se guardan en su navegador (sin cuenta) por el slug del producto. */
type FavState = {
  slugs: string[];
  toggle: (slug: string) => void;
  set: (slugs: string[]) => void;
};

export const useFavorites = create<FavState>()(
  persist(
    (set) => ({
      slugs: [],
      set: (slugs) => set({ slugs: slugs.slice(0, 60) }),
      toggle: (slug) => set((s) => ({ slugs: s.slugs.includes(slug) ? s.slugs.filter((x) => x !== slug) : [slug, ...s.slugs].slice(0, 60) })),
    }),
    { name: "nitro-favoritos" },
  ),
);
