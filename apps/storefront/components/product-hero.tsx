"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatCOP, type Product } from "@nitro/shared";
import { Badge, Button } from "@nitro/ui";
import { ProductArt } from "@/components/art/product-art";
import { ImageCarousel } from "@/components/image-carousel";
import { categoryName, variantImages } from "@/lib/products";

export function ProductHero({ product }: { product: Product }) {
  const [sku, setSku] = useState(() => (product.variants.find((v) => v.stock > 0) ?? product.variants[0]!).sku);
  const variant = product.variants.find((v) => v.sku === sku)!;
  const images = variantImages(product, sku);
  const soldOut = variant.stock === 0;
  const lowStock = !soldOut && variant.stock <= 5;
  const discount = variant.compareAtCents
    ? Math.round((1 - variant.priceCents / variant.compareAtCents) * 100)
    : 0;

  const router = useRouter();
  const addToCart = useCart((s) => s.add);
  const [notice, setNotice] = useState<"added" | "max" | null>(null);

  const add = () => {
    setNotice(addToCart(variant.sku) > 0 ? "added" : "max");
  };
  const buyNow = () => {
    addToCart(variant.sku);
    router.push("/carrito");
  };

  // Al cambiar de variante se limpia el aviso anterior.
  useEffect(() => setNotice(null), [sku]);

  // La barra de compra móvil aparece cuando el botón principal sale de pantalla.
  const buyRef = useRef<HTMLDivElement>(null);
  const [barVisible, setBarVisible] = useState(false);
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setBarVisible(!e!.isIntersecting && e!.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="mx-auto max-w-[1440px] px-6 pt-10 md:pt-14">
      <div className="grid gap-10 pb-24 md:grid-cols-[1.25fr_1fr] md:items-start md:gap-16">
        {/* Izquierda: fotos y, debajo, nombre y descripción. */}
        <div>
          {images.length > 0 ? (
            <ImageCarousel images={images} className="mx-auto w-full max-w-[560px] md:mx-0" priority />
          ) : (
            <div className="flex justify-center">
              <ProductArt product={product} swatch={variant.swatch} className="h-[min(40vh,440px)] w-auto max-w-full" />
            </div>
          )}
        </div>

        {/* Derecha: nombre, descripción y, debajo, color, precio y compra. */}
        <div>
          <p className="text-[17px] font-semibold text-eyebrow">{categoryName(product.category)}</p>
          <h1 className="mt-3 text-[clamp(32px,4vw,52px)]">
            <span className="mb-3 block text-[21px] tracking-[-0.012em]">{product.name}</span>
            {product.tagline}
          </h1>
          <p className="mt-5 max-w-[34rem] text-[19px] leading-[1.47] text-muted">{product.description}</p>

          {product.variants.length > 1 && (
            <fieldset className="mt-9">
              <legend className="text-[17px]">
                {product.category === "smartwatch" ? "Tamaño" : "Color"}:{" "}
                <span className="font-semibold">{variant.label}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const selected = v.sku === sku;
                  return (
                    <button
                      key={v.sku}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSku(v.sku)}
                      className={`inline-flex items-center gap-2 rounded-chip px-4 py-2 text-[15px] transition-colors ${
                        selected ? "bg-ink text-canvas" : "bg-soft text-ink hover:bg-soft/70"
                      } ${v.stock === 0 ? "opacity-60" : ""}`}
                    >
                      {v.swatch && (
                        <span
                          aria-hidden="true"
                          className="size-3.5 rounded-full border border-muted/60"
                          style={{ background: v.swatch }}
                        />
                      )}
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[32px] font-semibold tracking-[-0.02em]">
              {formatCOP(variant.priceCents)}
            </span>
            {variant.compareAtCents && (
              <>
                <span className="text-[17px] text-muted line-through">
                  {formatCOP(variant.compareAtCents)}
                </span>
                <Badge>-{discount}%</Badge>
              </>
            )}
          </div>

          <p className="mt-2 text-[15px] text-muted" aria-live="polite">
            {notice === "added" ? (
              <>
                Agregado al carrito.{" "}
                <Link href="/carrito" className="text-link hover:underline">
                  Ver carrito
                </Link>
              </>
            ) : notice === "max" ? (
              "Ya tienes en el carrito todas las unidades disponibles."
            ) : soldOut ? (
              "Agotado por ahora."
            ) : lowStock ? (
              `Quedan ${variant.stock} unidades.`
            ) : (
              "Disponible. Envío calculado al pagar."
            )}
          </p>

          <div ref={buyRef} className="mt-6 flex flex-wrap gap-3">
            {soldOut ? (
              <Button variant="ghost">Avísame cuando llegue</Button>
            ) : (
              <>
                <Button onClick={buyNow}>Comprar ahora</Button>
                <Button variant="ghost" onClick={add}>
                  Agregar al carrito
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        data-theme={product.theme}
        aria-hidden={!barVisible}
        className={`fixed inset-x-0 bottom-0 z-20 glass transition-transform duration-300 md:hidden ${
          barVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{product.name}</p>
            <p className="text-[15px] text-muted">{formatCOP(variant.priceCents)}</p>
          </div>
          <Button disabled={soldOut} onClick={buyNow} tabIndex={barVisible ? 0 : -1}>
            {soldOut ? "Agotado" : "Comprar"}
          </Button>
        </div>
      </div>
    </section>
  );
}
