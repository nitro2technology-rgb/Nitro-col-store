import type { Product } from "@nitro/shared";
import { ProductTile } from "@/components/product-tile";

/** Recomendados al final de la ficha: grupos (Moda, Tecnología) con la tarjeta de lista por color. */
export function Recommended({ groups }: { groups: { title: string; products: Product[] }[] }) {
  const shown = groups.filter((g) => g.products.length > 0);
  if (shown.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-24">
      <h2 className="text-[clamp(28px,4vw,40px)]">También te puede interesar</h2>
      {shown.map((g, i) => (
        <div key={g.title}>
          <h3 className={`${i === 0 ? "mt-10" : "mt-14"} text-[13px] font-semibold uppercase tracking-[0.1em] text-muted`}>{g.title}</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {g.products.map((p) => {
              const v = p.variants.find((x) => x.stock > 0 && x.priceCents > 0) ?? p.variants[0]!;
              return <ProductTile key={p.slug} product={p} sku={v.sku} showColor />;
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
