import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductHero } from "@/components/product-hero";
import { ProductGallery, ProductVideo } from "@/components/product-media";
import { ProductTile } from "@/components/product-tile";
import { commonFaq } from "@/lib/faq";
import { categoryName, getProduct, products } from "@/lib/products";

export const revalidate = 300;

const h2 = "text-[clamp(32px,5vw,56px)]";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  const related = products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, 2);
  const faq = [...(product.faq ?? []), ...commonFaq];

  const jsonLd = [
    {
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
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Escenario del producto en su tema (claro u oscuro): compra primero, detalle después. */}
      <div data-theme={product.theme} className={`text-ink ${product.theme === "dark" ? "stage-dark" : ""}`}>
        <ProductHero product={product} />

        <section className="mx-auto max-w-[1440px] px-6 pb-28">
          <h2 className={h2}>Lo principal.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {product.highlights.map((h) => (
              <article
                key={h.title}
                className="flex min-h-[320px] flex-col justify-end glass rounded-card p-8 md:min-h-[440px] md:p-10"
              >
                <h3 className="max-w-[16ch] text-[clamp(28px,3.4vw,40px)]">{h.title}</h3>
                <p className="mt-4 max-w-[34ch] text-[17px] leading-[1.47] text-muted">{h.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] overflow-hidden px-6 pb-28">
          <h2 className={h2}>Galería.</h2>
          <div className="mt-10">
            <ProductGallery product={product} />
          </div>
        </section>

        {(product.videoUrl || process.env.NODE_ENV !== "production") && (
          <section className="mx-auto max-w-[1440px] px-6 pb-32">
            <h2 className={h2}>En acción.</h2>
            <div className="mt-10 mx-auto max-w-[1100px]">
              <ProductVideo product={product} />
            </div>
          </section>
        )}
      </div>

      {/* Banda clara: especificaciones, contenido de la caja y preguntas. */}
      <section data-theme="light" className="glass-band text-ink">
        <div className="mx-auto max-w-[1024px] px-6 py-24 md:py-32">
          <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="text-[17px] font-semibold text-eyebrow" data-theme={product.theme}>
                {categoryName(product.category)}
              </p>
              <h2 className={`mt-3 ${h2}`}>Especificaciones</h2>
            </div>
            <dl className="self-end">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-4 text-[17px]">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {product.inBox && product.inBox.length > 0 && (
            <div className="mt-24 grid gap-12 md:grid-cols-[1fr_1.4fr]">
              <h2 className="text-[clamp(28px,4vw,40px)]">En la caja</h2>
              <ul className="space-y-3 text-[17px]">
                {product.inBox.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-24 grid gap-12 md:grid-cols-[1fr_1.4fr]">
            <h2 className="text-[clamp(28px,4vw,40px)]">Preguntas frecuentes</h2>
            <div>
              {faq.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[19px] font-semibold marker:content-none">
                    {f.q}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      aria-hidden="true"
                      className="shrink-0 transition-transform group-open:rotate-45"
                    >
                      <path d="M7 1v12M1 7h12" />
                    </svg>
                  </summary>
                  <p className="mt-3 max-w-[52ch] text-[17px] leading-[1.47] text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-24">
        <h2 className="text-[clamp(28px,4vw,40px)]">También te puede gustar</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {related.map((p) => (
            <ProductTile key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
