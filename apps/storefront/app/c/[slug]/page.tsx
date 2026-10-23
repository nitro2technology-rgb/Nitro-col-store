import Link from "next/link";
import { notFound } from "next/navigation";
import { allCategorySlugs, findCategory, productsIn } from "@/lib/products";
import { CatalogGrid } from "@/components/catalog-grid";
import { ModaHero } from "@/components/moda-hero";

export const revalidate = 300;

export function generateStaticParams() {
  return allCategorySlugs.map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = findCategory(slug);
  if (!found) notFound();

  // Padre: sus hijas son los filtros. Hoja: las hermanas, con "Todo" que vuelve al padre.
  const parent = found.parent ?? found.node!;
  const chips = [
    { slug: parent.slug, name: `Todo ${parent.name}` },
    ...parent.children,
  ];
  const items = productsIn(slug);

  return (
    <main
      className={`relative px-6 pb-28 pt-16 md:pt-24 ${parent.byColor ? "" : "mx-auto max-w-[1440px] overflow-hidden"}`}
    >
      {parent.byColor ? (
        <ModaHero title={found.name} panels={parent.cover ?? []} />
      ) : (
        <h1 className="text-[clamp(44px,8vw,96px)]">{found.name}</h1>
      )}

      <div id="coleccion" className="scroll-mt-16 pt-10">
      <nav aria-label="Subcategorías" className="mt-8 flex flex-wrap gap-2">
        {chips.map((c) => {
          const active = c.slug === slug;
          return (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-chip px-4 py-2 text-[15px] transition-colors ${
                active ? "bg-ink text-canvas" : "glass text-ink hover:bg-white/80"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>

      <CatalogGrid products={items} byColor={parent.byColor} />
      </div>
    </main>
  );
}
