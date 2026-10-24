"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Vacía el carrito del navegador cuando el pedido ya quedó pagado. */
export function ClearCart() {
  const clear = useCart((s) => s.clear);
  useEffect(() => clear(), [clear]);
  return null;
}
