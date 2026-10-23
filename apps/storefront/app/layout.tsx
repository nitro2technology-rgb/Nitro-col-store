import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { Intro, INTRO_SCRIPT } from "@/components/intro";
import { Foliage } from "@/components/foliage";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackButton } from "@/components/back-button";
import { CatalogProvider } from "@/lib/catalog-client";
import { getCartCatalog, getSearchIndex } from "@/lib/catalog";

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
  title: { default: "Nitro Col Store", template: "%s | Nitro Col Store" },
  description: "Tecnología con envío a toda Colombia.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [products, searchIndex] = await Promise.all([getCartCatalog(), getSearchIndex()]);
  return (
    <html lang="es-CO" className={`${inter.variable} ${interTight.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <CatalogProvider products={products} searchIndex={searchIndex}>
          <Intro />
          <Foliage />
          <SiteHeader />
          {children}
          <SiteFooter />
          <BackButton />
        </CatalogProvider>
      </body>
    </html>
  );
}
