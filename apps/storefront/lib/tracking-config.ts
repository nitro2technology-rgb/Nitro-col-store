// IDs de seguimiento (públicos). Archivo sin "use client" para poder leerlo también desde páginas del servidor.
export const META_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ""; // ej. AW-123456789
export const ADS_PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || ""; // etiqueta de la conversión «Compra»
export const trackingEnabled = Boolean(META_ID || GA_ID || ADS_ID);

