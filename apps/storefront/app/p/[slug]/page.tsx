import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/buy-cta";
import { ProductLanding } from "@/components/product-landing";
import { BenefitsMarquee, ProductAccordion, QualityMarquee, TrustStrip } from "@/components/product-extras";
import { Recommended } from "@/components/recommended";
import { Reviews } from "@/components/reviews";
import { VariantProvider } from "@/components/variant-context";
import { getProducts } from "@/lib/catalog";
import { getProduct, productsIn } from "@/lib/products";
import { getReviews } from "@/lib/reviews";

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

  const reviews = await getReviews(product.slug);
  const rating = reviews.length > 0 ? { avg: reviews.reduce((s, r) => s + r.stars, 0) / reviews.length, count: reviews.length } : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    ...(rating && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: Number(rating.avg.toFixed(1)), reviewCount: rating.count },
    }),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* La misma estructura para todos los productos; el tema (claro u oscuro) es el de cada producto. */}
      <div data-theme={product.theme} className={`text-ink ${product.theme === "dark" ? "stage-dark isolate" : ""}`}>
        <ProductLanding product={product} rating={rating} />

        <BenefitsMarquee product={product} />
        <CtaBand product={product} />
        <ProductAccordion product={product} />
        <TrustStrip />

        <div id="resenas" className="scroll-mt-28 pt-12">
          <Reviews reviews={reviews} slug={product.slug} titleClass={h2} />
        </div>
        <CtaBand product={product} />
        <QualityMarquee />

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
