"use client";

import type { Product } from "@nitro/shared";
import { EditorialGallery } from "@/components/editorial-gallery";
import { ProductGallery } from "@/components/product-media";
import { useVariant } from "@/components/variant-context";
import { galleryImages, isEditorial } from "@/lib/products";

/** Galería de la ficha: solo las fotos del color que se está viendo. */
export function VariantGallery({ product, titleClass = "" }: { product: Product; titleClass?: string }) {
  const { sku } = useVariant();
  const images = galleryImages(product, sku);

  if (isEditorial(product)) {
    // Moda: sin fotos extra no hay galería. La foto de portada de la tarjeta no se repite aquí.
    if (images.length === 0) return null;
    return (
      <section className="px-6 pb-28">
        <h2 className={titleClass}>Galería.</h2>
        <div className="mt-10">
          <EditorialGallery key={sku} images={images} />
        </div>
      </section>
    );
  }
  return <ProductGallery key={sku} product={product} images={images} />;
}
