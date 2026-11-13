import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { Intro, INTRO_SCRIPT } from "@/components/intro";
import { Foliage } from "@/components/foliage";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FavoritesSection } from "@/components/favorites-section";
import { FavoritesSync } from "@/components/favorites-sync";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Analytics } from "@/components/analytics";
import { OrderModal } from "@/components/order-modal";
import { CatalogProvider } from "@/lib/catalog-client";
import { SITE_URL } from "@/lib/site";
import { getCartCatalog, getExtraCategories, getSearchIndex } from "@/lib/catalog";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["500", "600", "700"],
  display: "swap",
});

// El catálogo que ve el navegador (carrito, buscador) se regenera igual que las páginas de producto.
export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Nitro Col Store", template: "%s | Nitro Col Store" },
  description: "Tecnología y moda con envío a toda Colombia: audífonos, smartwatch y gafas. Paga seguro con Wompi.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Nitro Col Store",
    url: "/",
    title: "Nitro Col Store",
    description: "Tecnología y moda con envío a toda Colombia.",
    images: [{ url: "/brand/compartir-1200x630.png", width: 1200, height: 630, alt: "Nitro Col Store" }],
  },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const extraCategories = await getExtraCategories();
  const [products, searchIndex] = await Promise.all([getCartCatalog(), getSearchIndex()]);
  return (
    <html lang="es-CO" className={`${inter.variable} ${interTight.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <CatalogProvider products={products} searchIndex={searchIndex} extraCategories={extraCategories}>
          <Intro />
          <Foliage />
          <AnnouncementBar />
          <SiteHeader />
          {children}
          <FavoritesSync />
          <FavoritesSection />
          <SiteFooter />
          <OrderModal />
          <Analytics />
        </CatalogProvider>
      </body>
    </html>
  );
}
