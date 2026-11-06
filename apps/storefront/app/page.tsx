import type { Product } from "@nitro/shared";
import { getProducts } from "@/lib/catalog";
import { commonFaq } from "@/lib/faq";
import { getLatestReviews } from "@/lib/reviews";
import { categories, featuredOf, productsIn, variantImages } from "@/lib/products";
import { HomeHero } from "@/components/home-hero";
import { HomeAfterHero, HomeBenefits, HomeFaq, HomeMarquee, HomePromos, HomeReviews, HomeStory, type Promo } from "@/components/home-blocks";
import { HomeShowcase, type ShowcaseGroup } from "@/components/home-showcase";

export const revalidate = 300;

const firstPhoto = (p?: Product) => (p ? variantImages(p)[0]?.src : undefined);

export default async function Home() {
  const all = await getProducts();
  const reviews = await getLatestReviews(8);

  // Pestañas: los destacados y cada subcategoría que tenga productos (las creadas en el panel aparecen solas).
  const featured = featuredOf(all);
  const groups: ShowcaseGroup[] = [
    {
      key: "destacados",
      label: "Destacados",
      lead: {
        title: "Destacados",
        subtitle: "Lo que más se está llevando",
        image: firstPhoto(featured[0]),
        href: "/c/tecnologia",
      },
      products: [...featured, ...all.filter((p) => !featured.includes(p))].slice(0, 8),
    },
    ...categories.flatMap((parent) =>
      parent.children.flatMap((c) => {
        const items = productsIn(c.slug, all);
        if (items.length === 0) return [];
        return [
          {
            key: c.slug,
            label: c.name,
            lead: { title: c.name, subtitle: parent.description, image: parent.cover?.[0]?.src ?? firstPhoto(items[0]), href: `/c/${c.slug}` },
            products: items.slice(0, 12),
          },
        ];
      }),
    ),
  ];

  const promos: Promo[] = categories.map((c) => ({
    title: c.name,
    text: c.description,
    cta: `Ver ${c.name}`,
    href: `/c/${c.slug}`,
    image: c.cover?.[0]?.src ?? firstPhoto(productsIn(c.slug, all)[0]),
  }));

  return (
    <main>
      <HomeHero />
      <HomeAfterHero hasReviews={reviews.length > 0} />
      <HomeShowcase groups={groups} />
      <HomeMarquee />
      <HomePromos promos={promos} />
      <HomeBenefits />
      <HomeReviews reviews={reviews} />
      <HomeStory />
      <HomeFaq items={commonFaq.slice(0, 5)} />
    </main>
  );
}
