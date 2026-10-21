import type { Product } from "@nitro/shared";
import { HeadphonesArt } from "./headphones";
import { WatchArt } from "./watch";
import { CandlesArt, LampArt, VaseArt } from "./home";

/** Ilustración provisional del producto, hasta contar con fotografía real. */
export function ProductArt({
  product,
  swatch,
  className,
}: {
  product: Product;
  swatch?: string;
  className?: string;
}) {
  const label = `${product.name}, ${product.tagline}`;
  const tone = product.theme;
  switch (product.art) {
    case "watch":
      return <WatchArt className={className} label={label} />;
    case "lamp-table":
      return <LampArt kind="table" tone={tone} className={className} label={label} />;
    case "lamp-floor":
      return <LampArt kind="floor" tone={tone} className={className} label={label} />;
    case "vase":
      return <VaseArt swatch={swatch} tone={tone} className={className} label={label} />;
    case "candles":
      return <CandlesArt swatch={swatch} tone={tone} className={className} label={label} />;
    default:
      return <HeadphonesArt swatch={swatch} className={className} label={label} />;
  }
}
