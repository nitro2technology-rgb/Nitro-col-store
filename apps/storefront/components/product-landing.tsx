"use client";

// Ficha de producto con la estructura de «Diseños frontend/PARA CATALOGOS» (computador y celular), igual para gafas,
// relojes y audífonos: a la izquierda la foto principal fija con miniaturas; a la derecha título, valoración real,
// precio con ahorro, color, botón «Quiero el mío ahora» que palpita, despacho y, debajo, las demás fotos en columna con
// el botón repetido entre ellas. En celular, una sola columna y una barra de compra fija al pie.
// Los textos son los del producto y de la tienda; las valoraciones solo aparecen si hay reseñas reales.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatCOP, formatPrice, type Product, type ProductImage } from "@nitro/shared";
import { BuyCta } from "@/components/buy-cta";
import { PriceTag } from "@/components/price-tag";
import { ProductPhotos } from "@/components/product-photos";
import { ProductVideo } from "@/components/product-media";
import { useVariant } from "@/components/variant-context";
import { useCart } from "@/lib/cart";
import { useOrderModal } from "@/lib/order-modal";
import { FREE_SHIPPING_FROM_CENTS } from "@/lib/pricing";
import { BUSINESS } from "@/lib/business";
import { findCategory } from "@/lib/products";

function Stars({ avg }: { avg: number }) {
  const full = Math.round(avg);
  return (
    <span className="tracking-[0.15em] text-[#c9a24d]" role="img" aria-label={`${avg.toFixed(1)} de 5 estrellas`}>
      {"★".repeat(full)}
      <span className="opacity-30">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export function ProductLanding({ product, rating }: { product: Product; rating?: { avg: number; count: number } }) {
  const { sku, setSku } = useVariant();
  const variant = product.variants.find((v) => v.sku === sku) ?? product.variants[0]!;
  const moda = findCategory(product.category)?.parent?.slug === "moda";
  const openOrder = useOrderModal((s) => s.open);
  const addToCart = useCart((s) => s.add);
  const [notice, setNotice] = useState<"added" | "max" | null>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [barVisible, setBarVisible] = useState(false);

  useEffect(() => setNotice(null), [sku]);
  // La barra de compra del celular aparece cuando el botón principal sale de la pantalla.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBarVisible(!!e && !e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Todas las fotos del color, sin repetir; si el color no tiene, las generales del producto.
  const seen = new Set<string>();
  const own = [...(variant.images ?? []), ...(variant.gallery ?? [])].filter((p) => !seen.has(p.src) && seen.add(p.src));
  const photos: ProductImage[] = own.length > 0 ? own : (product.images ?? []);
  const stacked = photos.slice(1);
  const soldOut = variant.stock === 0;
  const priced = variant.priceCents > 0;
  const saving = variant.compareAtCents && variant.compareAtCents > variant.priceCents ? variant.compareAtCents - variant.priceCents : 0;

  return (
    <section className="mx-auto max-w-[1100px] px-4 pb-10 pt-6 md:px-6 md:pt-10">
      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        {/* Izquierda: foto principal fija mientras se recorre la columna derecha */}
        <div className="md:sticky md:top-24 md:self-start">
          {photos.length > 0 ? (
            <ProductPhotos key={variant.sku} images={photos.slice(0, 6)} cover={moda} />
          ) : (
            <div className="aspect-square rounded-[20px] bg-soft/30" />
          )}
        </div>

        {/* Derecha: información y compra */}
        <div className="min-w-0">
          <h1 className="text-[clamp(26px,3.2vw,38px)] font-semibold leading-[1.1] tracking-[-0.01em]">{product.name}</h1>
          {rating && rating.count > 0 && (
            <p className="mt-2 flex items-center gap-2 text-[15px]">
              <Stars avg={rating.avg} />
              <span className="font-semibold">
                {rating.avg.toFixed(1)} · {rating.count} {rating.count === 1 ? "reseña verificada" : "reseñas verificadas"}
              </span>
            </p>
          )}

          <div className="mt-3 rounded-[12px] border border-ink/20 px-4 py-3 text-[14px] leading-snug">
            {product.tagline && <p className="text-muted">{product.tagline}</p>}
            <p className="mt-1 font-semibold">
              Aquí: {formatPrice(variant.priceCents)} · Pago seguro con Wompi
              {variant.priceCents < FREE_SHIPPING_FROM_CENTS ? ` · Envío gratis desde ${formatCOP(FREE_SHIPPING_FROM_CENTS)}` : " · Envío gratis"}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <PriceTag priceCents={variant.priceCents} compareAtCents={variant.compareAtCents} badge={false} className="text-[clamp(28px,3.4vw,38px)] font-bold tracking-[-0.01em]" />
            {saving > 0 && <span className="rounded-[6px] bg-ink px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.04em] text-canvas">Hoy ahorras {formatCOP(saving)}</span>}
          </div>

          {product.variants.length > 1 && (
            <fieldset className="mt-5">
              <legend className="text-[13px] font-extrabold uppercase tracking-[0.06em]">
                Color – {variant.label}
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const selected = v.sku === variant.sku;
                  return (
                    <button
                      key={v.sku}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSku(v.sku)}
                      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[14px] font-medium uppercase tracking-[0.04em] transition-colors ${
                        selected ? "border-ink bg-ink text-canvas" : "border-ink/40 hover:border-ink"
                      } ${v.stock === 0 ? "opacity-50" : ""}`}
                    >
                      {v.swatch && <span aria-hidden="true" className="size-3.5 rounded-full border border-current/40" style={{ background: v.swatch }} />}
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div ref={ctaRef} className="mt-6">
            <BuyCta product={product} className="w-full">
              Quiero el mío ahora | Compra segura
            </BuyCta>
            {priced && !soldOut && (
              <button
                type="button"
                onClick={() => setNotice(addToCart(variant.sku) > 0 ? "added" : "max")}
                className="mt-3 w-full rounded-button border border-ink/40 px-5 py-2.5 text-[14px] font-medium hover:bg-ink hover:text-canvas"
              >
                Agregar al carrito
              </button>
            )}
            <p className="mt-2 text-[13px] text-muted" aria-live="polite">
              {notice === "added" ? (
                <>
                  Agregado al carrito. <a href="/carrito" className="underline">Ver carrito</a>
                </>
              ) : notice === "max" ? (
                "Ya tienes en el carrito todas las unidades disponibles."
              ) : soldOut ? (
                "Agotado por ahora."
              ) : variant.stock <= 5 ? (
                `Quedan ${variant.stock} unidades.`
              ) : null}
            </p>
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-x-2 rounded-[12px] bg-soft/25 px-4 py-3 text-[14px]">
            <span aria-hidden="true">🚚</span>
            <span>Despacho inmediato —</span>
            <b>Recibe en {BUSINESS.deliveryTime}</b>
          </p>

          {/* Demás fotos en columna, con el botón repetido */}
          {stacked.length > 0 && (
            <div className="mt-6 space-y-3">
              {stacked.map((p, i) => (
                <div key={`${variant.sku}-${p.src}`}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-soft/20 md:aspect-square">
                    <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 520px, 100vw" className={moda ? "object-cover" : "object-contain"} />
                  </div>
                  {i === 1 && (
                    <div className="py-4">
                      <BuyCta product={product} className="w-full">
                        Quiero el mío ahora | Compra segura
                      </BuyCta>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {product.videoUrl && (
            <div className="mt-6 overflow-hidden rounded-[20px] bg-black">
              <ProductVideo product={product} />
            </div>
          )}
        </div>
      </div>

      {/* Barra de compra fija en el celular */}
      <div
        data-theme={product.theme}
        aria-hidden={!barVisible}
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-canvas/95 p-3 backdrop-blur-md transition-transform duration-300 md:hidden ${
          barVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <button
          type="button"
          tabIndex={barVisible ? 0 : -1}
          disabled={!priced || soldOut}
          onClick={() => openOrder(variant.sku)}
          className="w-full rounded-button bg-action px-5 py-3.5 text-[15px] font-bold uppercase tracking-[0.05em] text-on-action disabled:opacity-40"
        >
          {!priced ? "Próximamente" : soldOut ? "Agotado" : `Quiero el mío ahora · ${formatPrice(variant.priceCents)}`}
        </button>
      </div>
    </section>
  );
}
