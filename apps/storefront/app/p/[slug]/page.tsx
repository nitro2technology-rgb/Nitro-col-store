import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/buy-cta";
import { ProductLanding } from "@/components/product-landing";
import { BenefitsMarquee, ProductAccordion, QualityMarquee, TrustStrip } from "@/components/product-extras";
import { Recommended } from "@/components/recommended";
import { Reviews } from "@/components/reviews";
import { VariantProvider } from "@/components/variant-context";
import { getProducts } from "@/lib/catalog";
import { findCategory, getProduct, productsIn } from "@/lib/products";
import { getReviews, getReviewsForProducts } from "@/lib/reviews";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { getSettings } from "@/lib/site-settings";
import { HomeIgReviews } from "@/components/home-social";
import { HomeReviews } from "@/components/home-blocks";

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
  const image = product.variants[0]?.images?.[0] ?? product.images?.[0];
  const description = product.description.slice(0, 200);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/p/${product.slug}` }, // ?color=… no crea otra página para Google
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `/p/${product.slug}`,
      ...(image && { images: [{ url: absoluteUrl(image.src), alt: image.alt }] }),
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const products = await getProducts();
  const product = getProduct((await params).slug, products);
  if (!product) notFound();

  const gafas = product.category === "gafas";
  // Recomendados: solo productos con stock (los agotados no se sugieren; se piden más para compensar los que se filtren)
  const others = products.filter((p) => p.slug !== product.slug && p.variants.some((v) => v.stock > 0 && v.priceCents > 0));
  // Recomendados: Moda y Tecnología. En las gafas, primero las del mismo tipo (casuales/deportivas).
  const moda = others
    .filter((p) => p.category === "gafas")
    .sort((a, b) => Number(b.tags?.[0] === product.tags?.[0]) - Number(a.tags?.[0] === product.tags?.[0]))
    .slice(0, 4);
  const tech = productsIn("tecnologia", others).slice(0, 3);

  const reviews = await getReviews(product.slug);
  // Reseñas de la categoría del producto (ej. todas las gafas): historias de Instagram marcadas para su categoría (o la
  // principal) y reseñas de clientes que compraron otros productos de ella. Cada bloque solo sale si tiene algo.
  const cat = findCategory(product.category);
  const topSlug = cat?.parent?.slug ?? product.category;
  const places = [product.category, topSlug];
  const igReviews = (await getSettings()).reviews.filter((r) => r.places.some((p) => places.includes(p)));
  const categoryName = cat?.parent?.name ?? cat?.name ?? "";
  const categoryReviews = await getReviewsForProducts(
    productsIn(topSlug, others).map((p) => p.slug),
    6,
  );
  const rating = reviews.length > 0 ? { avg: reviews.reduce((s, r) => s + r.stars, 0) / reviews.length, count: reviews.length } : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: `${SITE_URL}/p/${product.slug}`,
    brand: { "@type": "Brand", name: product.brand },
    image: [...new Set(product.variants.flatMap((v) => (v.images ?? []).slice(0, 2).map((i) => absoluteUrl(i.src))))].slice(0, 6),
    ...(rating && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: Number(rating.avg.toFixed(1)), reviewCount: rating.count },
    }),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: `${product.name} ${v.label}`,
      url: `${SITE_URL}/p/${product.slug}?color=${v.sku}`,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Nitro Col Store" },
      priceCurrency: "COP",
      price: v.priceCents / 100,
      priceValidUntil: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
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
        <HomeIgReviews reviews={igReviews} title={categoryName ? `Reseñas de ${categoryName} en Instagram` : "Reseñas en Instagram"} />
        <HomeReviews
          reviews={categoryReviews}
          title={categoryName ? `Más reseñas de ${categoryName}` : "Más reseñas"}
          sub="De clientes que compraron otros productos de esta categoría"
          id="resenas-categoria"
        />
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
