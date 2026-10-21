import Link from "next/link";
import { categories } from "@/lib/products";
import { CategoryMenu } from "@/components/category-menu";
import { CartLink } from "@/components/cart-link";
import { BrandMark } from "@/components/brand-mark";

/** Barra de vidrio empañado a todo el ancho; el panel de categorías cuelga de ella. */
export function SiteHeader() {
  return (
    <header className="glass-nav sticky top-0 z-30 w-full" data-theme="dark">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-14 max-w-[1024px] items-center justify-between px-4 text-xs text-ink"
      >
        <Link href="/" aria-label="Nitro Col, inicio">
          <BrandMark className="h-9 w-[62px]" />
        </Link>
        <CategoryMenu categories={categories} />
        <CartLink />
      </nav>
    </header>
  );
}
