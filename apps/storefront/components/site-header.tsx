import Link from "next/link";
import { categories } from "@/lib/products";
import { CategoryMenu } from "@/components/category-menu";
import { CartLink } from "@/components/cart-link";
import { FavoritesLink } from "@/components/favorites-link";
import { SiteSearch } from "@/components/site-search";
import { BrandMark } from "@/components/brand-mark";
import { AccountLink } from "@/components/account-link";
import { MobileMenu } from "@/components/mobile-menu";

/** Barra de vidrio empañado a todo el ancho; el panel de categorías cuelga de ella. */
export function SiteHeader() {
  return (
    <header className="glass-nav sticky top-0 z-30 w-full" data-theme="dark">
      <nav
        aria-label="Principal"
        className="mx-auto hidden h-14 max-w-[1024px] items-center justify-between px-4 text-xs text-ink md:flex"
      >
        <Link href="/" aria-label="Nitro Col, inicio">
          <BrandMark className="h-9 w-[62px]" />
        </Link>
        <div className="flex items-center gap-7">
          <Link href="/" className="nav-fx nav-link">
            Inicio
          </Link>
          <CategoryMenu categories={categories} />
        </div>
        <div className="flex items-center gap-5">
          <SiteSearch />
          <AccountLink />
          <FavoritesLink />
          <CartLink />
        </div>
      </nav>

      {/* Celular, como la referencia: menú y búsqueda a la izquierda, logo al centro, cuenta y carrito a la derecha. */}
      <nav aria-label="Principal (celular)" className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-3 text-ink md:hidden [&_svg]:!size-[23px]">
        <div className="flex items-center gap-1">
          <MobileMenu categories={categories} />
          <div className="[&_button]:p-2.5">
            <SiteSearch />
          </div>
        </div>
        <Link href="/" aria-label="Nitro Col, inicio">
          <BrandMark className="h-10 w-[68px]" />
        </Link>
        <div className="flex items-center justify-end gap-2">
          <AccountLink icon />
          <FavoritesLink />
          <CartLink />
        </div>
      </nav>
    </header>
  );
}
