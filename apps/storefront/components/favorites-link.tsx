"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@nitro/shared";
import { useCatalog } from "@/lib/catalog-client";
import { useFavoriteRows } from "@/lib/favorite-rows";
import { useFavorites } from "@/lib/favorites";
import { variantImages } from "@/lib/products";

/** Corazón del menú: con un clic muestra los productos (cada color) que la persona marcó como favoritos. */
export function FavoritesLink() {
  const rows = useFavoriteRows();
  const items = useFavorites((s) => s.items);
  const toggle = useFavorites((s) => s.toggle);
  const { products } = useCatalog();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  // Valores antiguos (slug del producto) se convierten una sola vez al SKU del primer color disponible.
  useEffect(() => {
    if (products.length === 0 || items.length === 0) return;
    const skus = new Set(products.flatMap((p) => p.variants.map((v) => v.sku)));
    if (items.every((i) => skus.has(i) || !products.some((p) => p.slug === i))) return;
    useFavorites.getState().set(
      items.map((i) => {
        if (skus.has(i)) return i;
        const p = products.find((x) => x.slug === i);
        const v = p && (p.variants.find((x) => x.stock > 0 && x.priceCents > 0) ?? p.variants[0]);
        return v ? v.sku : i;
      }),
    );
  }, [products, items]);

  return (
    <div ref={box} className="relative flex h-14 items-center">
      <button
        type="button"
        aria-label={rows.length ? `Mis favoritos, ${rows.length}` : "Mis favoritos"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="nav-fx relative block"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={rows.length ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.4 5 6.6 5c1.9 0 3.5 1 5.4 3 1.9-2 3.5-3 5.4-3 3.2 0 5.1 3.1 3.9 6.3-1.8 4.6-9.3 9.2-9.3 9.2Z" />
        </svg>
        {rows.length > 0 && (
          <span className="absolute -right-2.5 -top-2 flex min-w-4 items-center justify-center rounded-full bg-action px-1 text-[10px] font-semibold leading-4 text-on-action">
            {rows.length}
          </span>
        )}
      </button>

      {open && (
        <div className="menu-in glass-nav absolute right-0 top-full z-50 w-[min(380px,92vw)] rounded-b-[24px] text-ink" role="dialog" aria-label="Mis favoritos" style={{ background: "rgb(20 20 20 / 0.95)" }}>
          <div className="p-5">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink/70">Mis favoritos</p>
            {rows.length === 0 ? (
              <p className="mt-3 text-[15px] text-ink/80">Aún no has guardado nada. Toca el corazón de un producto para verlo aquí.</p>
            ) : (
              <ul className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto">
                {rows.map(({ key, product, variant }) => {
                  const photo = variantImages(product, variant.sku)[0];
                  return (
                    <li key={key} className="flex items-center gap-3">
                      <Link href={`/p/${product.slug}?color=${variant.sku}`} className="flex min-w-0 flex-1 items-center gap-3">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo.src} alt="" className="size-12 shrink-0 rounded-[12px] bg-white object-contain" />
                        ) : (
                          <span className="size-12 shrink-0 rounded-[12px] bg-ink/10" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{product.name}</span>
                          <span className="block truncate text-[12px] text-ink/70">
                            {product.variants.length > 1 ? `${variant.label} · ` : ""}
                            {variant.priceCents > 0 ? formatPrice(variant.priceCents) : "Precio por definir"}
                            {variant.stock === 0 ? " · Agotado" : ""}
                          </span>
                        </span>
                      </Link>
                      <button type="button" aria-label={`Quitar ${product.name} de favoritos`} onClick={() => toggle(key)} className="shrink-0 rounded-full p-2 text-ink/70 hover:text-ink">
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link href="/cuenta/favoritos" className="mt-4 block rounded-button bg-action px-4 py-2.5 text-center text-[14px] text-on-action transition-opacity hover:opacity-90">
              Ver todos en mi cuenta
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
