"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatCOP } from "@nitro/shared";
import { useCart, useHydrated } from "@/lib/cart";
import { useVariantLookup } from "@/lib/catalog-client";
import { priceCart } from "@/lib/pricing";
import { variantImages } from "@/lib/products";

const MAX_ROWS = 4;

/** Carrito del menú: al pasar el mouse se despliega un resumen; al hacer clic se abre el carrito completo. */
export function CartLink() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const findVariant = useVariantLookup();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const hoverOpen = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  // Se ignoran SKU que ya no existen en el catálogo.
  const rows = lines.flatMap((l) => {
    const found = findVariant(l.sku);
    return found ? [{ ...found, qty: Math.min(l.qty, found.variant.stock) }] : [];
  });
  const shown = hydrated ? rows.reduce((n, r) => n + r.qty, 0) : 0;
  const priced = priceCart(rows.map((r) => ({ category: r.product.category, priceCents: r.variant.priceCents, qty: r.qty })));
  const total = priced.subtotalCents - priced.discountCents;

  return (
    <div className="relative flex h-14 items-center" onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
      <Link
        href="/carrito"
        aria-label={shown ? `Carrito de compras, ${shown} unidades` : "Carrito de compras"}
        aria-expanded={open}
        onFocus={hoverOpen}
        className="nav-fx relative block"
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

      {open && hydrated && (
        <div className="menu-in glass-nav absolute right-0 top-full w-[min(360px,92vw)] rounded-b-[24px] text-ink" role="dialog" aria-label="Resumen del carrito" style={{ background: "rgb(20 20 20 / 0.95)" }}>
          <div className="p-5">
            {rows.length === 0 ? (
              <p className="text-[15px] text-ink/80">Tu carrito está vacío.</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {rows.slice(0, MAX_ROWS).map(({ product, variant, qty }) => {
                    const photo = variantImages(product, variant.sku)[0];
                    return (
                      <li key={variant.sku} className="flex items-center gap-3">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo.src} alt="" className="size-12 shrink-0 rounded-[12px] bg-white object-contain" />
                        ) : (
                          <span className="size-12 shrink-0 rounded-[12px] bg-ink/10" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{product.name}</span>
                          <span className="block truncate text-[12px] text-ink/70">
                            {variant.label} · {qty} {qty === 1 ? "unidad" : "unidades"}
                          </span>
                        </span>
                        <span className="shrink-0 text-[13px]">{formatCOP(variant.priceCents * qty)}</span>
                      </li>
                    );
                  })}
                </ul>
                {rows.length > MAX_ROWS && (
                  <p className="mt-3 text-[12px] text-ink/70">Y {rows.length - MAX_ROWS} producto(s) más.</p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-ink/15 pt-4 text-[14px]">
                  <span className="text-ink/80">Total</span>
                  <span className="text-[16px] font-semibold">{formatCOP(total)}</span>
                </div>
              </>
            )}
            <Link
              href="/carrito"
              className="mt-4 block rounded-button bg-action px-4 py-2.5 text-center text-[14px] text-on-action transition-opacity hover:opacity-90"
            >
              Ver carrito
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
