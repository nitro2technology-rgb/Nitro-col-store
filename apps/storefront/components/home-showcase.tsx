"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Product } from "@nitro/shared";
import { ProductTile } from "@/components/product-tile";

export type ShowcaseGroup = {
  key: string;
  label: string;
  lead: { title: string; subtitle: string; image?: string; href: string };
  products: Product[];
};

/**
 * Pestañas (Destacados, Audífonos, Smartwatch, Gafas) con una tarjeta de presentación y los productos en una fila
 * que se desliza, con flechas y barra de avance.
 */
export function HomeShowcase({ groups }: { groups: ShowcaseGroup[] }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const group = groups[active] ?? groups[0];
  if (!group) return null;

  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };
  const go = (i: number) => {
    setActive(Math.min(Math.max(i, 0), groups.length - 1));
    rail.current?.scrollTo({ left: 0 });
    setProgress(0);
  };
  const move = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * Math.max(320, (rail.current?.clientWidth ?? 600) * 0.8), behavior: "smooth" });

  // Un producto con varios colores aparece una vez por color (como en las listas), salvo en las gafas, que ya son una tarjeta por modelo.
  const cards = group.products.flatMap((p) =>
    p.variants.length > 1 && p.category !== "gafas"
      ? p.variants.map((v) => ({ p, sku: v.sku }))
      : [{ p, sku: (p.variants.find((v) => v.stock > 0) ?? p.variants[0]!).sku }],
  );

  return (
    <section aria-labelledby="coleccion" className="relative mx-auto max-w-[1440px] scroll-mt-16 px-4 pb-10 pt-12 md:px-8 md:pt-16">
      <h2 id="coleccion" className="mb-5 text-[clamp(26px,3.4vw,40px)] font-semibold">
        Productos destacados
      </h2>
      <div className="flex items-center gap-2">
      <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Colección anterior" className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/15 text-ink disabled:opacity-30">
        ‹
      </button>
      <div role="tablist" aria-label="Colecciones" className="flex min-w-0 flex-1 gap-6 overflow-x-auto whitespace-nowrap pb-2 [scrollbar-width:none] md:gap-9 [&::-webkit-scrollbar]:hidden">
        {groups.map((g, i) => (
          <button
            key={g.key}
            role="tab"
            aria-selected={i === active}
            ref={(el) => {
              if (el && i === active) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
            }}
            onClick={() => go(i)}
            className={`text-[clamp(18px,2.2vw,26px)] font-medium uppercase tracking-[0.02em] transition-colors ${i === active ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => go(active + 1)} disabled={active === groups.length - 1} aria-label="Colección siguiente" className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-canvas disabled:opacity-30">
        ›
      </button>
      </div>

      <div ref={rail} onScroll={onScroll} className="mt-5 flex snap-x gap-3 overflow-x-auto pb-3 md:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href={group.lead.href}
          className="relative hidden w-[300px] shrink-0 snap-start overflow-hidden rounded-[20px] bg-[#111827] md:block lg:w-[340px]"
        >
          {group.lead.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.lead.image} alt="" className="absolute inset-0 size-full object-cover" />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 p-6 text-white">
            <span className="block text-[clamp(28px,3vw,40px)] font-semibold uppercase leading-none">{group.lead.title}</span>
            <span className="mt-2 inline-block rounded bg-white/90 px-2 py-0.5 text-[15px] text-black">{group.lead.subtitle}</span>
          </span>
        </Link>
        {cards.map(({ p, sku }) => (
          <div key={`${group.key}-${sku}`} className="w-[72vw] max-w-[340px] shrink-0 snap-start sm:w-[300px] lg:w-[330px]">
            <ProductTile product={p} sku={sku} showColor />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="h-px flex-1 bg-ink/25" aria-hidden="true">
          <div className="h-[2px] -translate-y-px bg-ink transition-[margin] duration-150" style={{ width: "18%", marginLeft: `${progress * 82}%` }} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => move(-1)} aria-label="Anterior" className="grid size-10 place-items-center rounded-full bg-ink/20 text-ink hover:bg-ink/30">
            ‹
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Siguiente" className="grid size-10 place-items-center rounded-full bg-ink text-canvas hover:opacity-90">
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
