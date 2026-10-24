import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@nitro/ui", "@nitro/shared", "@nitro/db"],
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // Las fotos salen de miniaturas pregeneradas (scripts/miniaturas.py), no del optimizador de Next:
  // en Render gratis (512 MB, 1 CPU) redimensionar al vuelo tumbaba el servicio y tardaba segundos.
  images: { loader: "custom", loaderFile: "./lib/image-loader.ts" },
  // Fotos, portadas y video de public/ cambian solo al renombrarse: que el navegador las guarde un año
  // (por defecto Next las sirve con max-age=0 y se vuelven a pedir en cada visita).
  async headers() {
    const largo = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return ["/products/:path*", "/moda/:path*", "/brand/:path*"].map((source) => ({ source, headers: largo }));
  },
};

export default config;
