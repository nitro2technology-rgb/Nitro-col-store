import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Foliage } from "@/components/foliage";
import { ProductHero } from "@/components/product-hero";
import { ProductVideo } from "@/components/product-media";
import { ProductStory } from "@/components/product-story";
import { Recommended } from "@/components/recommended";
import { Reviews } from "@/components/reviews";
import { VariantProvider } from "@/components/variant-context";
import { getProducts } from "@/lib/catalog";
import { recommendationsFor } from "@/lib/gafas-promo";
import { getProduct, productsIn } from "@/lib/products";
import { reviewsFor } from "@/lib/reviews";

export const revalidate = 300;

const h2 = "text-[clamp(32px,5vw,56px)]";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = getProduct((await params).slug, await getProducts());
  if (!product) return {};
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const products = await getProducts();
  const product = getProduct((await params).slug, products);
  if (!product) notFound();

  const gafas = product.category === "gafas";
  const others = products.filter((p) => p.slug !== product.slug);
  // Recomendados: Moda y Tecnología. En las gafas, primero las del mismo tipo (casuales/deportivas).
  const moda = others
    .filter((p) => p.category === "gafas")
    .sort((a, b) => Number(b.tags?.[0] === product.tags?.[0]) - Number(a.tags?.[0] === product.tags?.[0]))
    .slice(0, 4);
  const tech = productsIn("tecnologia", others).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      priceCurrency: "COP",
      price: v.priceCents / 100,
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <VariantProvider product={product}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Escenario del producto en su tema (claro u oscuro): compra primero, detalle después. */}
      <div data-theme={product.theme} className={`text-ink ${product.theme === "dark" ? "stage-dark isolate" : ""}`}>
        {product.theme === "dark" && <Foliage tone="night" />}
        <ProductHero product={product} more={gafas ? recommendationsFor(product, products) : undefined} />

        <Reviews reviews={reviewsFor(product)} titleClass={h2} />
        <ProductStory product={product} />

        {product.videoUrl && (
          <section className="mx-auto max-w-[1440px] px-6 py-28">
            <h2 className={h2}>En acción.</h2>
            <div className="mx-auto mt-10 max-w-[1100px]">
              <ProductVideo product={product} />
            </div>
          </section>
        )}

        <Recommended
          groups={
            gafas
              ? [{ title: "Moda", products: moda }, { title: "Tecnología", products: tech }]
              : [{ title: "Tecnología", products: tech }, { title: "Moda", products: moda }]
          }
        />
      </div>
    </VariantProvider>
  );
}
