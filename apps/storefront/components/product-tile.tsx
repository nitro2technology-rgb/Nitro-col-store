import Link from "next/link";
import { formatCOP, type Product } from "@nitro/shared";
import { ProductArt } from "@/components/art/product-art";
import { fromPrice } from "@/lib/products";

export function ProductTile({ product }: { product: Product }) {
  const first = product.variants[0]!;
  const dark = product.theme === "dark";
  return (
    <Link
      href={`/p/${product.slug}`}
      data-theme={product.theme}
      className={`group flex flex-col rounded-card p-7 text-ink ${dark ? "stage-dark border border-white/10" : "glass"}`}
    >
      <div className="flex h-[280px] items-center justify-center">
        <ProductArt
          product={product}
          swatch={first.swatch}
          className="h-full w-auto max-w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-6">
        <h3 className="text-[28px]">{product.name}</h3>
        <p className="mt-1 text-[17px] text-muted">{product.tagline}</p>
        <p className="mt-5 text-[17px]">Desde {formatCOP(fromPrice(product))}</p>
      </div>
    </Link>
  );
}
