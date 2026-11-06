"use client";

// Ficha de tecnología con el estilo de "Diseños frontend": tono oscuro (smartwatch, "Para los smartwathc") o claro
// (audífonos, "Para los audifonos"). Titulares grandes, tarjetas de 28 px sin sombra y color solo en las cifras.
// Los colores de cada tono son variables --sc-* definidas en globals.css (.showcase-dark / .showcase-light).
// Compra, carrito y precios son los de la tienda.
import { PriceTag } from "./price-tag";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice, type Product, type ProductImage } from "@nitro/shared";
import { Button } from "@nitro/ui";
import { useVariant } from "@/components/variant-context";
import { useCart } from "@/lib/cart";
import { FREE_SHIPPING_FROM_CENTS } from "@/lib/pricing";

export type ShowcaseTone = "dark" | "light";

// Textos provisionales (salen de la caja del producto); el dueño los revisa. La clave es el nombre de la especificación.
const DETAILS: Record<string, string> = {
  Pantalla: "Pantalla HD de gran resolución y colores vibrantes, fácil de leer de un vistazo.",
  Llamadas: "Recibe y realiza llamadas por Bluetooth desde tu muñeca, sin sacar el celular.",
  Notificaciones: "Mensajes y avisos de tu celular llegan directo al reloj.",
  Correas: "Siete correas extra además de la del reloj: cambia de estilo cuando quieras.",
  Conectividad: "Se conectan por Bluetooth a tu celular para escuchar música y contestar llamadas.",
};

const heading = "text-[clamp(32px,5vw,56px)] font-semibold tracking-[-0.009em] text-[var(--sc-text)]";

/**
 * Fotos del color elegido: solo las principales (escena oscura), nunca de otro color. Las de catálogo (`gallery`)
 * traen textos del fabricante, a veces con colores que no vendemos: solo se usan si el color no tiene principales.
 */
function useShowcase(product: Product) {
  const { sku, setSku } = useVariant();
  const variant = product.variants.find((v) => v.sku === sku) ?? product.variants[0]!;
  const photos = variant.images?.length ? variant.images : variant.gallery?.length ? variant.gallery : (product.images ?? []);
  return { variant, photos, setSku };
}

function useBuy(sku: string) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [notice, setNotice] = useState<"added" | "max" | null>(null);
  return {
    notice,
    add: () => setNotice(add(sku) > 0 ? "added" : "max"),
    buyNow: () => {
      add(sku);
      router.push("/carrito");
    },
  };
}

/** Barra del producto, fija bajo el menú: nombre, secciones y compra. */
export function ShowcaseNav({ product, sections }: { product: Product; sections: { id: string; label: string }[] }) {
  const { variant } = useShowcase(product);
  const { buyNow } = useBuy(variant.sku);
  const canBuy = variant.priceCents > 0 && variant.stock > 0;
  return (
    <nav
      aria-label={`Secciones de ${product.name}`}
      className="sticky top-14 z-20 border-b border-[var(--sc-line)] bg-[var(--sc-nav)] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[52px] max-w-[1024px] items-center gap-6 pl-16 pr-4 lg:px-4">
        <p className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-[-0.374px] text-[var(--sc-soft-text)]">{product.name}</p>
        <ul className="hidden items-center gap-6 text-[12px] tracking-[-0.12px] text-[var(--sc-soft-text)] md:flex">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:text-[var(--sc-text)]">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <Button onClick={buyNow} disabled={!canBuy} className="!px-3 !py-1 !text-[12px]">
          {canBuy ? "Comprar" : variant.priceCents > 0 ? "Agotado" : "Próximamente"}
        </Button>
      </div>
    </nav>
  );
}

/** Portada: nombre pequeño, titular enorme, el producto y la compra centrada debajo. */
export function ShowcaseHero({ product, tone }: { product: Product; tone: ShowcaseTone }) {
  const { variant, photos, setSku } = useShowcase(product);
  const { notice, add, buyNow } = useBuy(variant.sku);
  const hero = photos[0];
  const soldOut = variant.stock === 0;
  const priced = variant.priceCents > 0;

  return (
    <section id="resumen" className="scroll-mt-28 overflow-hidden bg-[var(--sc-stage)] px-6 pb-20 pt-14 text-center md:pt-20">
      <p className="text-[clamp(17px,1.6vw,21px)] font-semibold tracking-[-0.374px] text-[var(--sc-soft-text)]">{product.name}</p>
      <h1 className="mx-auto mt-4 max-w-[16ch] text-[clamp(40px,7vw,72px)] font-semibold leading-[1.06] tracking-[-0.009em] text-[var(--sc-text)] data-[tone=dark]:uppercase" data-tone={tone}>
        {product.tagline}
      </h1>

      {hero &&
        (tone === "dark" ? (
          <div className="relative mx-auto mt-8 aspect-square w-full max-w-[640px]">
            {/* El borde de la foto se funde con el negro para que el producto parezca flotar. */}
            <Image
              key={hero.src}
              src={hero.src}
              alt={hero.alt}
              fill
              priority
              sizes="(min-width: 768px) 640px, 100vw"
              className="watch-fade object-cover [mask-image:radial-gradient(closest-side,#000_62%,transparent_100%)]"
            />
          </div>
        ) : (
          <div className="relative mx-auto mt-10 w-full max-w-[640px]">
            {/* Halo iridiscente de la referencia: solo decora detrás del producto, nunca en controles. */}
            <div aria-hidden="true" className="showcase-halo absolute inset-[6%] rounded-full" />
            <div className="relative aspect-square overflow-hidden rounded-[28px] bg-white">
              <Image key={hero.src} src={hero.src} alt={hero.alt} fill priority sizes="(min-width: 768px) 640px, 100vw" className="watch-fade object-cover" />
            </div>
          </div>
        ))}

      {product.variants.length > 1 && (
        <fieldset className="mt-8">
          <legend className="mx-auto text-[17px] text-[var(--sc-text)]">
            Color: <span className="font-semibold">{variant.label}</span>
          </legend>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {product.variants.map((v) => {
              const selected = v.sku === variant.sku;
              return (
                <button
                  key={v.sku}
                  type="button"
                  aria-pressed={selected}
                  aria-label={v.label}
                  title={v.label}
                  onClick={() => setSku(v.sku)}
                  className={`grid size-9 place-items-center rounded-full transition-shadow ${
                    selected ? "ring-2 ring-[var(--sc-text)] ring-offset-2 ring-offset-[var(--sc-stage)]" : "ring-1 ring-[var(--sc-line-strong)] hover:ring-[var(--sc-soft-text)]"
                  } ${v.stock === 0 ? "opacity-50" : ""}`}
                >
                  <span className="size-7 rounded-full" style={{ background: v.swatch ?? "#86868b" }} />
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-3">
          {!priced ? (
            <Button disabled>Próximamente</Button>
          ) : soldOut ? (
            <Button variant="ghost">Avísame cuando llegue</Button>
          ) : (
            <>
              <Button onClick={buyNow}>Comprar</Button>
              <Button variant="ghost" onClick={add}>
                Agregar al carrito
              </Button>
            </>
          )}
        </div>
        <div className="text-[14px] font-semibold leading-[18px] text-[var(--sc-text)]" aria-live="polite">
          <p>{priced ? <PriceTag priceCents={variant.priceCents} compareAtCents={variant.compareAtCents} /> : "Precio por definir"}</p>
          <p className="mt-1 font-normal text-[var(--sc-muted)]">
            {notice === "added" ? (
              <>
                Agregado al carrito.{" "}
                <Link href="/carrito" className="text-[var(--sc-text)] underline-offset-4 hover:underline">
                  Ver carrito
                </Link>
              </>
            ) : notice === "max" ? (
              "Ya tienes en el carrito todas las unidades disponibles."
            ) : soldOut ? (
              "Agotado por ahora."
            ) : variant.stock <= 5 ? (
              `Quedan ${variant.stock} unidades.`
            ) : (
              `Envío gratis desde ${formatPrice(FREE_SHIPPING_FROM_CENTS)}.`
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

/** "Lo principal": foto grande con texto encima y las cifras del producto. */
export function ShowcaseHighlights({ product }: { product: Product }) {
  const { photos } = useShowcase(product);
  const tile = photos[2] ?? photos[1] ?? photos[0];
  const [first, second] = product.highlights;
  // Cifras: especificaciones con un valor corto que se lea como dato (no "Sí" ni listas como los colores).
  const metrics = Object.entries(product.specs)
    .map(([k, v]) => [k, String(v)] as const)
    .filter(([, v]) => !/^(sí|si|no)$/i.test(v) && !/,\s/.test(v) && v.length <= 14);

  return (
    <section className="mx-auto max-w-[1024px] px-6 py-24">
      <h2 className={heading}>Lo principal.</h2>
      {tile && (
        <div className="relative mt-10 aspect-[4/5] overflow-hidden rounded-[28px] bg-black md:aspect-[16/10]">
          <Image src={tile.src} alt={tile.alt} fill sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 pt-24 md:p-10 md:pt-32">
            <p className="max-w-[40ch] text-[17px] leading-[25px] text-[#f5f5f7]">
              {first && <b className="font-semibold">{first.title}. </b>}
              {first?.body ?? product.description}
              {second && (
                <>
                  {" "}
                  <b className="font-semibold">{second.title}. </b>
                  {second.body}
                </>
              )}
            </p>
          </div>
        </div>
      )}
      {metrics.length > 0 && (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(([k, v]) => (
            <div key={k} className="rounded-[28px] bg-[var(--sc-tile)] p-8">
              <dt className="text-[17px] text-[var(--sc-muted)]">{k}</dt>
              <dd className="mt-2 text-[clamp(40px,5vw,48px)] font-semibold leading-none tracking-[-0.144px] text-[var(--sc-metric)]">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/** "Míralo de cerca": píldoras a la izquierda que cambian la foto grande de la derecha. */
export function ShowcaseCloseLook({ product }: { product: Product }) {
  const { variant, photos } = useShowcase(product);
  const items = Object.entries(product.specs).map(([k, v], i) => ({
    key: k,
    title: `${k}: ${String(v)}`,
    body: DETAILS[k],
    // Empieza por la última foto para no repetir la de la portada en la primera píldora.
    image: photos.length > 0 ? photos[(i + photos.length - 1) % photos.length] : undefined,
  }));
  const [open, setOpen] = useState(0);
  if (items.length === 0) return null;
  const current = items[open] ?? items[0]!;
  const image: ProductImage | undefined = current.image;

  return (
    <section id="de-cerca" className="scroll-mt-28 bg-[var(--sc-stage)] py-24">
      <div className="mx-auto max-w-[1024px] px-6">
        <h2 className={heading}>Míralo de cerca.</h2>
        <div className="mt-10 grid items-center gap-8 md:grid-cols-[minmax(0,320px)_1fr]">
          <ul className="flex flex-col items-start gap-3">
            {items.map((it, i) => {
              const active = i === open;
              return (
                <li key={it.key} className="max-w-full">
                  <button
                    type="button"
                    aria-expanded={active}
                    onClick={() => setOpen(i)}
                    className={`flex max-w-full items-start gap-3 rounded-[36px] px-5 py-3 text-left text-[17px] transition-colors ${
                      active
                        ? "bg-[var(--sc-chip-active)] text-[var(--sc-text)]"
                        : "bg-[var(--sc-chip)] text-[var(--sc-soft-text)] hover:bg-[var(--sc-chip-active)]"
                    }`}
                  >
                    <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-current text-[15px] leading-none">
                      {active ? "−" : "+"}
                    </span>
                    <span>
                      <span className="font-semibold">{it.title}</span>
                      {active && it.body && <span className="mt-1 block text-[15px] leading-[1.47] text-[var(--sc-soft-text)]">{it.body}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="relative aspect-square overflow-hidden rounded-[28px] bg-[var(--sc-tile)]">
            {image && (
              <Image
                key={`${variant.sku}-${image.src}`}
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 680px, 100vw"
                className="watch-fade object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
