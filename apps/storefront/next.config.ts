import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@nitro/ui", "@nitro/shared", "@nitro/db"],
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // Las fotos salen de miniaturas pregeneradas (scripts/miniaturas.py), no del optimizador de Next:
  // en Render gratis (512 MB, 1 CPU) redimensionar al vuelo tumbaba el servicio y tardaba segundos.
  images: { loader: "custom", loaderFile: "./lib/image-loader.ts" },
};

export default config;
