"use client";

import Image from "next/image";
import type { Product, ProductImage } from "@nitro/shared";
import { useVariant } from "@/components/variant-context";
import { mainPhotos } from "@/lib/gafas-promo";
import { galleryImages } from "@/lib/products";

type Panel = { title: string; paragraphs: string[]; lead?: string };

// Textos provisionales: el dueño los revisa o reemplaza.
const gafasPanels: [Panel, Panel] = [
  {
    title: "Sofisticación & estilo",
    lead: "Estilo y sofisticación sin gastar una fortuna.",
    paragraphs: [
      "Las gafas de Nitro Col ofrecen una sensación premium a un precio accesible.",
      "Elige entre una variedad de colores y estilos para complementar tu look.",
    ],
  },
  {
    title: "Lentes con protección UV400",
    paragraphs: [
      "Las gafas de Nitro Col fueron creadas para quienes buscan algo más que protección: reflejan tu personalidad. Con un diseño que combina modernidad y funcionalidad, sus monturas livianas ofrecen comodidad durante todo el día, mientras los lentes con protección UV400 cuidan tus ojos.",
      "Perfectas para cualquier ocasión, en la ciudad o bajo el sol.",
    ],
  },
];

/** Otros productos: primero lo principal del producto y, en el segundo panel, sus especificaciones. */
function techPanels(product: Product): [Panel, Panel] {
  const [first, second] = product.highlights;
  return [
    first
      ? { title: first.title, paragraphs: [first.body, product.description] }
      : { title: product.tagline, paragraphs: [product.description] },
    second
      ? { title: second.title, paragraphs: [second.body, ...specLines(product)] }
      : { title: "Lo esencial", paragraphs: specLines(product) },
  ];
}
const specLines = (p: Product) => Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`);

/**
 * Dos fotos para la cuadrícula. Solo las del color elegido (nunca las de otro color): primero las que la
 * cabecera no muestra y, si faltan, se repiten las que haya. Un producto de un solo color suma las del producto.
 */
function storyPhotos(product: Product, sku: string): ProductImage[] {
  const gafas = product.category === "gafas";
  const shown = new Set((gafas ? mainPhotos(product, sku) : galleryImages(product, sku).slice(0, 6)).map((i) => i.src));
  const v = product.variants.find((x) => x.sku === sku) ?? product.variants[0];
  const pool = [
    ...(v?.gallery ?? []),
    ...(gafas ? [] : (v?.images ?? [])),
    ...(product.variants.length === 1 ? (product.images ?? []) : []),
  ];
  const unique = pool.filter((im, i) => pool.findIndex((x) => x.src === im.src) === i);
  return [...unique.filter((im) => !shown.has(im.src)), ...unique.filter((im) => shown.has(im.src))].slice(0, 2);
}

const panelTitle = "text-[clamp(22px,2.4vw,34px)] font-light uppercase tracking-[0.02em]";
const panelBody = "mt-6 max-w-[52ch] space-y-4 text-[15px] leading-[1.6] text-muted";

function Photo({ image }: { image?: ProductImage }) {
  return (
    <div className="relative aspect-[4/5] bg-soft md:aspect-auto md:min-h-[520px]">
      {image && (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      )}
    </div>
  );
}

function Text({ panel, dark = false, className = "" }: { panel: Panel; dark?: boolean; className?: string }) {
  return (
    <div
      data-theme={dark ? "dark" : undefined}
      className={`flex flex-col justify-center p-8 text-ink md:p-16 ${dark ? "bg-canvas" : "bg-soft"} ${className}`}
    >
      <h2 className={panelTitle}>{panel.title}</h2>
      <div className={panelBody}>
        {panel.paragraphs.map((t, i) => (
          <p key={t}>
            {i === 0 && panel.lead && <b className="text-ink">{panel.lead} </b>}
            {t}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Cuadrícula 2×2: foto y texto en damero, a todo el ancho y sin separación. */
export function ProductStory({ product }: { product: Product }) {
  const { sku } = useVariant();
  const [a, b] = storyPhotos(product, sku);
  if (!a) return null;
  const gafas = product.category === "gafas";
  const [one, two] = gafas ? gafasPanels : techPanels(product);

  return (
    <section aria-label="Sobre este producto" className="grid md:grid-cols-2">
      <Photo image={a} />
      <Text panel={one} />
      <Text panel={two} dark className="order-4 md:order-none" />
      <div className="order-3 md:order-none">
        <Photo image={b ?? a} />
      </div>
    </section>
  );
}
