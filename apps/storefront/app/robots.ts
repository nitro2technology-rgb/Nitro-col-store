import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Lo privado (panel, cuenta, pago, API) no debe aparecer en Google.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/cuenta", "/checkout", "/pedido", "/api", "/auth", "/ingresar", "/carrito"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
