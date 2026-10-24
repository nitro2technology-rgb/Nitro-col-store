// Loader propio de next/image: sirve miniaturas pregeneradas (scripts/miniaturas.py)
// en vez de redimensionar en el servidor, que en Render gratis (512 MB, 1 CPU) no aguanta.
export default function imageLoader({ src, width }: { src: string; width: number }) {
  if (!src.startsWith("/products/") || !src.endsWith(".webp")) return src;
  const base = src.slice(0, -".webp".length);
  if (width <= 480) return `${base}-480.webp`;
  if (width <= 960) return `${base}-960.webp`;
  return src;
}
