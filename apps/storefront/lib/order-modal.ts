"use client";

import { create } from "zustand";

/** Ventana «Completa tu pedido»: cualquier botón «Quiero el mío ahora» la abre con el color elegido. */
export const useOrderModal = create<{ sku: string | null; open: (sku: string) => void; close: () => void }>((set) => ({
  sku: null,
  open: (sku) => set({ sku }),
  close: () => set({ sku: null }),
}));
