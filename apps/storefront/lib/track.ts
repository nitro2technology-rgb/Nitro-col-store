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

const cookie = (name: string) => {
  try {
    return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) || undefined;
  } catch {
    return undefined;
  }
};

/**
 * Datos para la API de conversiones de Meta (servidor), que se envían con el pedido. Solo con consentimiento: sin él
 * devuelve `{ consent: false }` y el servidor no manda nada a Meta.
 */
export function trackingContext(): { consent: boolean; fbp?: string; fbc?: string } {
  if (!META_ID || !hasConsent()) return { consent: false };
  let fbc = cookie("_fbc");
  if (!fbc) {
    // Si llegó desde un anuncio, Meta pone ?fbclid=… en la URL; la cookie _fbc puede no existir aún.
    const id = new URLSearchParams(window.location.search).get("fbclid");
    if (id) fbc = `fb.1.${Date.now()}.${id}`;
  }
  return { consent: true, fbp: cookie("_fbp"), fbc };
}

export type TrackItem = { sku: string; name: string; price: number; qty: number };
type W = Window & { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void };

/**
 * Deja listos Meta Pixel y gtag, UNA sola vez y solo con consentimiento. Crea `fbq`/`gtag` al instante: lo que se envíe antes de
 * que terminen de descargarse los scripts queda en cola y sale apenas cargan (si no, el primer PageView y ViewContent se perdían).
 */
export function ensureTracking() {
  if (!trackingEnabled || typeof window === "undefined" || !hasConsent()) return;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const w = window as any;
  if (META_ID && !w.fbq) {
    const n: any = function () {
      // eslint-disable-next-line prefer-rest-params
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    w.fbq = n;
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    n("init", META_ID);
  }
  const gId = GA_ID || ADS_ID;
  if (gId && !w.gtag) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer.push(arguments);
    };
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gId}`;
    document.head.appendChild(s);
    w.gtag("js", new Date());
    if (GA_ID) w.gtag("config", GA_ID, { send_page_view: false });
    if (ADS_ID) w.gtag("config", ADS_ID);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/** `price` y `value` en pesos (COP), no en centavos. */
export function track(event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase", d: { items: TrackItem[]; value: number; transactionId?: string }) {
  if (!trackingEnabled || typeof window === "undefined" || !hasConsent()) return;
  ensureTracking();
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
