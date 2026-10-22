import Link from "next/link";
import { formatCOP, type Product } from "@nitro/shared";
import { ImageCarousel } from "@/components/image-carousel";
import { ProductArt } from "@/components/art/product-art";
import { fromPrice, variantImages } from "@/lib/products";

/** Tarjeta de producto: carrusel con las fotos principales, nombre, descripción y precio. */
export function ProductTile({ product }: { product: Product }) {
  const first = product.variants[0]!;
  const dark = product.theme === "dark";
  const images = variantImages(product);
  return (
    <Link
      href={`/p/${product.slug}`}
      data-theme={product.theme}
      className={`flex w-full max-w-[420px] flex-col rounded-card p-4 text-ink ${dark ? "stage-dark border border-white/10" : "glass"}`}
    >
      {images.length > 0 ? (
        <ImageCarousel images={images} />
      ) : (
        <div className="flex aspect-square items-center justify-center">
          <ProductArt product={product} swatch={first.swatch} className="h-full w-auto max-w-full" />
        </div>
      )}
      <div className="px-3 pb-3 pt-5">
        <h3 className="text-[26px]">{product.name}</h3>
        <p className="mt-1 text-[17px] text-muted">{product.tagline}</p>
        <p className="mt-2 line-clamp-2 text-[15px] leading-[1.45] text-muted">{product.description}</p>
        <p className="mt-4 text-[19px] font-semibold">Desde {formatCOP(fromPrice(product))}</p>
      </div>
    </Link>
  );
}
