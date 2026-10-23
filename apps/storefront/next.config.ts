import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@nitro/ui", "@nitro/shared", "@nitro/db"],
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // Las fotos se sirven redimensionadas y en AVIF/WebP según el ancho real en pantalla.
  images: { formats: ["image/avif", "image/webp"],
    qualities: [75, 90], minimumCacheTTL: 60 * 60 * 24 * 30 },
};

export default config;
