"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "@nitro/shared";

type Ctx = { sku: string; setSku: (sku: string) => void };
const VariantContext = createContext<Ctx | null>(null);

/** Comparte el color elegido entre la cabecera del producto y la galería de más abajo. */
export function VariantProvider({ product, children }: { product: Product; children: ReactNode }) {
  const [sku, setSkuState] = useState(() => (product.variants.find((v) => v.stock > 0) ?? product.variants[0]!).sku);

  // `?color=SKU` (viene de los filtros de la categoría) preselecciona ese color.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("color");
    if (wanted && product.variants.some((v) => v.sku === wanted)) setSkuState(wanted);
  }, [product]);

  const setSku = useCallback((next: string) => setSkuState(next), []);
  return <VariantContext.Provider value={{ sku, setSku }}>{children}</VariantContext.Provider>;
}

export function useVariant() {
  const ctx = useContext(VariantContext);
  if (!ctx) throw new Error("useVariant debe usarse dentro de VariantProvider");
  return ctx;
}
