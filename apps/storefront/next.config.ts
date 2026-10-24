import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@nitro/ui", "@nitro/shared", "@nitro/db"],
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // Las fotos se sirven redimensionadas en WebP según el ancho real en pantalla.
  // Sin AVIF: codificarlo agota los 512 MB del plan gratis de Render y tumba el servicio.
  images: { formats: ["image/webp"],
    qualities: [75, 90], minimumCacheTTL: 60 * 60 * 24 * 30 },
};

export default config;
