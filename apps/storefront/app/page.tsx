import Link from "next/link";
import { formatCOP, type Product } from "@nitro/shared";
import { HomeHero } from "@/components/home-hero";
import { ProductTile } from "@/components/product-tile";
import { ProductArt } from "@/components/art/product-art";
import {
  categories,
  categoryName,
  featuredProducts,
  fromPrice,
  getProduct,
  type CategoryNode,
} from "@/lib/products";

/** Dos destacados por fila; cada uno es un escenario con el tema de su producto. */
function Tile({ product }: { product: Product }) {
  return (
    <section className="flex justify-center">
      <ProductTile product={product} />
    </section>
  );
}

function Row({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <div className="mx-auto flex max-w-[1440px] flex-wrap justify-center gap-6 px-3 md:px-4">
      {products.map((p) => (
        <Tile key={p.slug} product={p} />
      ))}
    </div>
  );
}

// Productos que ilustran cada categoría en la bienvenida.
const sampleSlugs: Record<string, string[]> = {
  tecnologia: ["audifonos-aurafit-fw5", "smartwatch-x8-pro"],
};

function CategoryCard({ category }: { category: CategoryNode }) {
  const samples = (sampleSlugs[category.slug] ?? []).flatMap((s) => getProduct(s) ?? []);
  return (
    <section data-theme="light" className="glass rounded-card p-8 text-ink md:p-10">
      <div className="flex h-[170px] items-center justify-center gap-8">
        {samples.map((p) => (
          <ProductArt key={p.slug} product={p} swatch={p.variants[0]?.swatch} className="h-full w-auto" />
        ))}
      </div>
      <h3 className="mt-8 text-[clamp(32px,3.4vw,40px)]">{category.name}</h3>
      <p className="mt-2 text-[17px] text-muted">{category.description}</p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {category.children.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/c/${c.slug}`}
              className="inline-block rounded-chip border border-white/70 bg-white/55 px-4 py-2 text-[15px] backdrop-blur-md transition-colors hover:bg-white/80"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
      <Link href={`/c/${category.slug}`} className="mt-6 inline-block text-[17px] text-link hover:underline">
        Ver todo {category.name}
      </Link>
    </section>
  );
}

export default function Home() {
  // La portada siempre muestra tres destacados, en una sola fila.
  const featured = featuredProducts.slice(0, 3);

  return (
    <main>
      <HomeHero />

      <section aria-labelledby="destacados" className="relative overflow-hidden pb-16 pt-14 md:pt-20">
        <h2 id="destacados" className="relative px-6 text-center text-[clamp(36px,5vw,60px)]">
          Productos destacados
        </h2>
        <div className="relative mt-10">
          <Row products={featured} />
        </div>
      </section>

      {/* Bienvenida: invita a comprar y presenta las categorías. */}
      <section id="categorias" className="relative mx-auto max-w-[1440px] scroll-mt-16 overflow-hidden px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="text-[clamp(40px,6vw,72px)]">Todo lo que buscas, en un solo lugar.</h2>
          <p className="mt-6 text-[clamp(18px,2vw,21px)] leading-[1.47] text-muted">
            Audio y relojes inteligentes. Elige una categoría y encuentra lo tuyo.
          </p>
        </div>
        <div className="mt-16 grid gap-3 md:grid-cols-2 md:gap-4">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      <section data-theme="light" className="glass-band mt-3 text-ink md:mt-4">
        <div className="mx-auto grid max-w-[1024px] gap-12 px-6 py-24 md:grid-cols-[1fr_1.4fr] md:py-32">
          <h2 className="text-[clamp(32px,5vw,56px)]">Compra con calma.</h2>
          <div className="space-y-6 text-[20px] leading-[1.47] text-muted">
            <p>Paga con tarjeta, PSE, Nequi, Daviplata o efectivo.</p>
            <p>Si algo no te convence, tienes cinco días hábiles tras la entrega para devolverlo.</p>
            <p>Cada pedido llega con factura electrónica.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
