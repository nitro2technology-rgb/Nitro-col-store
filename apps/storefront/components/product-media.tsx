import Image from "next/image";
import type { Product } from "@nitro/shared";
import { ProductArt } from "@/components/art/product-art";

const isDev = process.env.NODE_ENV !== "production";

// Recortes de la ilustración que hacen de "fotos" mientras no haya imágenes reales.
const crops = ["50% 50%", "50% 12%", "50% 88%"];

/** Carrusel de imágenes. Usa `product.images`; sin ellas, muestra recortes de la ilustración. */
export function ProductGallery({ product }: { product: Product }) {
  const images = product.images ?? [];
  const card =
    "relative aspect-[4/5] w-[84vw] max-w-[860px] shrink-0 glass overflow-hidden rounded-card md:aspect-[16/11] md:w-[62vw]";

  return (
    <div className="snap-row -mx-6 flex gap-4 overflow-x-auto px-6 pb-2" tabIndex={0} aria-label="Galería de imágenes">
      {images.length > 0
        ? images.map((img, i) => (
            <div key={img.src} className={card}>
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(min-width: 768px) 62vw, 84vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))
        : crops.map((origin, i) => (
            <div key={origin} className={card}>
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ transform: `scale(${i === 0 ? 0.9 : 1.7})`, transformOrigin: origin }}
              >
                <ProductArt
                  product={product}
                  swatch={product.variants[0]?.swatch}
                  className="h-full w-auto"
                />
              </div>
              {isDev && (
                <p className="absolute bottom-4 left-5 rounded-chip bg-soft px-3 py-1 text-xs text-muted">
                  Imagen de ejemplo. Agrega fotos en `images`.
                </p>
              )}
            </div>
          ))}
    </div>
  );
}

/** Video del producto. Sin `videoUrl` no se muestra, salvo un aviso en desarrollo. */
export function ProductVideo({ product }: { product: Product }) {
  if (product.videoUrl) {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        poster={product.videoPoster}
        className="aspect-video w-full rounded-card bg-black"
      >
        <source src={product.videoUrl} />
        Tu navegador no puede reproducir este video.
      </video>
    );
  }
  if (!isDev) return null;
  return (
    <div className="flex aspect-video w-full items-center justify-center glass rounded-card p-8 text-center">
      <p className="max-w-sm text-[17px] text-muted">
        Aquí va el video del producto. Súbelo a `public/products` y agrega `videoUrl` en los datos.
      </p>
    </div>
  );
}
