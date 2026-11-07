import type { NextConfig } from "next";

// En Render gratis (512 MB) la revisión de tipos y de estilo del build agota la memoria. Allí se omite (RENDER=true);
// se revisa antes en el computador con `npx tsc --noEmit` y `pnpm build`, que sí la hacen.
const enRender = process.env.RENDER === "true";

const config: NextConfig = {
  typescript: { ignoreBuildErrors: enRender },
  eslint: { ignoreDuringBuilds: enRender },
  transpilePackages: ["@nitro/ui", "@nitro/shared", "@nitro/db"],
  // Las fotos salen de miniaturas pregeneradas (scripts/miniaturas.py), no del optimizador de Next:
  // en Render gratis (512 MB, 1 CPU) redimensionar al vuelo tumbaba el servicio y tardaba segundos.
  images: { loader: "custom", loaderFile: "./lib/image-loader.ts" },
  // El panel sube fotos por una acción de servidor (hasta 3 fotos de 8 MB por envío).
  experimental: { serverActions: { bodySizeLimit: "150mb" } },
  serverExternalPackages: ["@prisma/client", ".prisma/client", "sharp"],
  // Fotos, portadas y video de public/ cambian solo al renombrarse: que el navegador las guarde un año
  // (por defecto Next las sirve con max-age=0 y se vuelven a pedir en cada visita).
  async headers() {
    const largo = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return ["/products/:path*", "/moda/:path*", "/brand/:path*"].map((source) => ({ source, headers: largo }));
  },
};

export default config;
