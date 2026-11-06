import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Foliage } from "@/components/foliage";
import { ProductHero } from "@/components/product-hero";
import { ProductVideo } from "@/components/product-media";
import { ProductStory } from "@/components/product-story";
import { Recommended } from "@/components/recommended";
import { Reviews } from "@/components/reviews";
import { ShowcaseCloseLook, ShowcaseHero, ShowcaseHighlights, ShowcaseNav, type ShowcaseTone } from "@/components/showcase";
import { ShowcaseInfo } from "@/components/showcase-info";
import { VariantProvider } from "@/components/variant-context";
import { getProducts } from "@/lib/catalog";
import { recommendationsFor } from "@/lib/gafas-promo";
import { getProduct, productsIn } from "@/lib/products";
import { getReviews } from "@/lib/reviews";

export const revalidate = 300;

const h2 = "text-[clamp(32px,5vw,56px)]";

// Fichas con el estilo de "Diseños frontend": el reloj en negro y los audífonos en gris niebla.
const SHOWCASE: Record<string, ShowcaseTone> = { smartwatch: "dark", audifonos: "light" };

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

  const reviews = await getReviews(product.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    ...(reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number((reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)),
        reviewCount: reviews.length,
      },
    }),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      priceCurrency: "COP",
      price: v.priceCents / 100,
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  const ld = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
  const recommended = (
    <Recommended
      groups={
        gafas
          ? [{ title: "Moda", products: moda }, { title: "Tecnología", products: tech }]
          : [{ title: "Tecnología", products: tech }, { title: "Moda", products: moda }]
      }
    />
  );

  const tone = SHOWCASE[product.category];
  if (tone) {
    const sections = [
      { id: "resumen", label: "Resumen" },
      { id: "de-cerca", label: "De cerca" },
      ...(product.videoUrl ? [{ id: "video", label: "Video" }] : []),
      { id: "resenas", label: "Reseñas" },
    ];
    return (
      <VariantProvider product={product}>
        {ld}
        <div data-theme={tone} className={`showcase-${tone} isolate bg-[var(--sc-page)] text-ink`}>
          <ShowcaseNav product={product} sections={sections} />
          <ShowcaseHero product={product} tone={tone} />
          <ShowcaseHighlights product={product} />
          <ShowcaseCloseLook product={product} />
          {product.videoUrl && (
            <section id="video" className="mx-auto max-w-[1024px] scroll-mt-28 px-6 py-24">
              <h2 className="text-[clamp(32px,5vw,56px)] font-semibold tracking-[-0.009em] text-[var(--sc-text)]">En acción.</h2>
              <div className="mt-10 overflow-hidden rounded-[28px] bg-black">
                <ProductVideo product={product} />
              </div>
            </section>
          )}
          {/* Reseñas y recomendados usan la misma columna de 1024 px que el resto de esta ficha. */}
          <div id="resenas" className="scroll-mt-28 pt-4 [&>section]:max-w-[1024px]">
            <Reviews reviews={reviews} slug={product.slug} titleClass={`${h2} font-semibold tracking-[-0.009em]`} />
          </div>
          <ShowcaseInfo />
          <div className="[&>section]:max-w-[1024px]">{recommended}</div>
        </div>
      </VariantProvider>
    );
  }

  return (
    <VariantProvider product={product}>
      {ld}

      {/* Escenario del producto en su tema (claro u oscuro): compra primero, detalle después. */}
      <div data-theme={product.theme} className={`text-ink ${product.theme === "dark" ? "stage-dark isolate" : ""}`}>
        {product.theme === "dark" && <Foliage tone="night" />}
        <ProductHero product={product} more={gafas ? recommendationsFor(product, products) : undefined} />

        <Reviews reviews={reviews} slug={product.slug} titleClass={h2} />
        <ProductStory product={product} />

        {product.videoUrl && (
          <section className="mx-auto max-w-[1440px] px-6 py-28">
            <h2 className={h2}>En acción.</h2>
            <div className="mx-auto mt-10 max-w-[1100px]">
              <ProductVideo product={product} />
            </div>
          </section>
        )}

        {recommended}
      </div>
    </VariantProvider>
  );
}
