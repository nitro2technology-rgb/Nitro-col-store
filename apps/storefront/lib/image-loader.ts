// Loader propio de next/image: sirve miniaturas pregeneradas (scripts/miniaturas.py, o las que sube el panel
// a Supabase Storage) en vez de redimensionar en el servidor, que en Render gratis (512 MB, 1 CPU) no aguanta.
const STORAGE = "/storage/v1/object/public/productos/";

export default function imageLoader({ src, width }: { src: string; width: number }) {
  if (!src.endsWith(".webp") || !(src.startsWith("/products/") || src.includes(STORAGE))) return src;
  const base = src.slice(0, -".webp".length);
  if (width <= 480) return `${base}-480.webp`;
  if (width <= 960) return `${base}-960.webp`;
  return src;
}
