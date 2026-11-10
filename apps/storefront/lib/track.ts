"use client";
// Seguimiento de publicidad (Meta Pixel, Google Analytics y Google Ads). Solo funciona si hay ID configurado en las
// variables NEXT_PUBLIC_* Y la persona aceptó las cookies (components/analytics.tsx). Sin eso, `track` no hace nada.

import { ADS_ID, ADS_PURCHASE_LABEL, GA_ID, META_ID, trackingEnabled } from "./tracking-config";
export { ADS_ID, GA_ID, META_ID, trackingEnabled };

export const CONSENT_KEY = "nitro-consent";
export const hasConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
};

export type TrackItem = { sku: string; name: string; price: number; qty: number };
type W = Window & { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void };

/** `price` y `value` en pesos (COP), no en centavos. */
export function track(event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase", d: { items: TrackItem[]; value: number; transactionId?: string }) {
  if (!trackingEnabled || typeof window === "undefined" || !hasConsent()) return;
  const w = window as W;
  const ids = d.items.map((i) => i.sku);
  const ga = d.items.map((i) => ({ item_id: i.sku, item_name: i.name, price: i.price, quantity: i.qty }));
  const num = d.items.reduce((s, i) => s + i.qty, 0);
  try {
    if (META_ID && w.fbq) {
      const name = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase" }[event];
      const meta = { content_ids: ids, content_type: "product", value: d.value, currency: "COP", num_items: num };
      // eventID = pedido: si más adelante se suma la API de conversiones, Meta no cuenta la compra dos veces
      if (d.transactionId) w.fbq("track", name, meta, { eventID: d.transactionId });
      else w.fbq("track", name, meta);
    }
    if ((GA_ID || ADS_ID) && w.gtag) {
      w.gtag("event", event, { currency: "COP", value: d.value, items: ga, ...(d.transactionId && { transaction_id: d.transactionId }) });
      if (event === "purchase" && ADS_ID && ADS_PURCHASE_LABEL) {
        w.gtag("event", "conversion", { send_to: `${ADS_ID}/${ADS_PURCHASE_LABEL}`, value: d.value, currency: "COP", transaction_id: d.transactionId });
      }
    }
  } catch {
    /* el seguimiento nunca debe romper la tienda */
  }
}
