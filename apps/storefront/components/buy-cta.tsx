"use client";

import type { Product } from "@nitro/shared";
import { useVariant } from "@/components/variant-context";
import { useOrderModal } from "@/lib/order-modal";

/** Botón principal de compra: palpita cada 3 segundos y abre «Completa tu pedido» con el color elegido. */
export function BuyCta({
  product,
  className = "",
  children = "Quiero el mío ahora",
}: {
  product: Product;
  className?: string;
  children?: React.ReactNode;
}) {
  const { sku } = useVariant();
  const open = useOrderModal((s) => s.open);
  const variant = product.variants.find((v) => v.sku === sku) ?? product.variants[0]!;
  const unavailable = variant.priceCents <= 0 || variant.stock <= 0;
  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={() => open(variant.sku)}
      className={`inline-flex items-center justify-center rounded-button bg-action px-7 py-3.5 text-[16px] font-bold uppercase tracking-[0.06em] text-on-action transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:opacity-40 ${unavailable ? "" : "cta-pulse"} ${className}`}
    >
      {variant.priceCents <= 0 ? "Próximamente" : variant.stock <= 0 ? "Agotado" : children}
    </button>
  );
}

/** Franja de ancho completo con el botón de compra, para repetirla entre secciones de la ficha. */
export function CtaBand({ product }: { product: Product }) {
  return (
    <div className="px-6 py-8 text-center">
      <BuyCta product={product} className="w-full max-w-[560px]" />
      <p className="mt-3 text-[13px] text-muted">Pago seguro con Wompi · Envío a toda Colombia</p>
    </div>
  );
}
