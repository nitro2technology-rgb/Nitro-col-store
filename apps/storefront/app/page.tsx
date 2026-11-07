import type { Product } from "@nitro/shared";
import { getProducts } from "@/lib/catalog";
import { commonFaq } from "@/lib/faq";
import { getLatestReviews } from "@/lib/reviews";
import { categories, featuredOf, productsIn, variantImages } from "@/lib/products";
import { HomeHero } from "@/components/home-hero";
import { CategoryCover } from "@/components/category-cover";
import { getCover } from "@/lib/covers";
import { getSettings } from "@/lib/site-settings";
import { HomeIgReviews, HomeInstagram } from "@/components/home-social";
import { HomeAfterHero, HomeBenefits, HomeFaq, HomeMarquee, HomePromos, HomeReviews, HomeStory, type Promo } from "@/components/home-blocks";
import { HomeShowcase, type ShowcaseGroup } from "@/components/home-showcase";

export const revalidate = 300;

const firstPhoto = (p?: Product) => (p ? variantImages(p)[0]?.src : undefined);

export default async function Home() {
  const all = await getProducts();
  const reviews = await getLatestReviews(5);
  const settings = await getSettings();
  const cover = await getCover("inicio"); // portada de inicio editada en el panel; sin ella, la tarjeta de siempre

  // Pestañas: los destacados y cada subcategoría que tenga productos (las creadas en el panel aparecen solas).
  // Los elegidos en el panel (Admin → Inicio) salen primero; si no hay, los destacados de siempre.
  const chosen = settings.featured.flatMap((slug) => all.filter((p) => p.slug === slug));
  const featured = chosen.length > 0 ? [...chosen, ...featuredOf(all).filter((p) => !chosen.includes(p))] : featuredOf(all);
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
      {cover ? <CategoryCover cover={cover} title="Nitro Col Store: todo lo que necesitas, en un solo lugar." home /> : <HomeHero />}
      <HomeAfterHero hasReviews={reviews.length > 0} />
      <HomeShowcase groups={groups} />
      <HomeMarquee />
      <HomePromos promos={promos} />
      <HomeBenefits />
      <HomeStory />
      <HomeIgReviews reviews={settings.reviews.filter((r) => r.places.includes("inicio"))} />
      <HomeReviews reviews={reviews} />
      <HomeInstagram posts={settings.posts} profileUrl={settings.instagramUrl} />
      <HomeFaq items={commonFaq.slice(0, 5)} />
    </main>
  );
}
