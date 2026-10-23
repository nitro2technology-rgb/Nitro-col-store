"use client";

import { createContext, useContext } from "react";
import type { Product } from "@nitro/shared";
import { findVariant as findIn, type SearchEntry } from "./products";

type ClientCatalog = { products: Product[]; searchIndex: SearchEntry[] };

const CatalogContext = createContext<ClientCatalog>({ products: [], searchIndex: [] });

// El store del carrito vive fuera de React y necesita el stock para limitar cantidades.
let current: Product[] = [];

/** Catálogo mínimo del navegador, calculado en el servidor (ver lib/catalog.ts). */
export function CatalogProvider({ products, searchIndex, children }: ClientCatalog & { children: React.ReactNode }) {
  current = products;
  return <CatalogContext.Provider value={{ products, searchIndex }}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);

/** Para código fuera de React (store del carrito). */
export const findCatalogVariant = (sku: string) => findIn(sku, current);

/** Producto y variante por SKU, o undefined si el SKU ya no existe. */
export function useVariantLookup() {
  const { products } = useCatalog();
  return (sku: string) => findIn(sku, products);
}
