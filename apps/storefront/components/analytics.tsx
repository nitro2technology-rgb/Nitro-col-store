"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ADS_ID, CONSENT_KEY, GA_ID, hasConsent, META_ID, track, trackingEnabled } from "@/lib/track";

type Choice = "granted" | "denied" | null;
type W = Window & { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void };

/**
 * Banner de cookies + carga de los scripts de publicidad. Nada de seguimiento se carga hasta que la persona acepta
 * (Ley 1581 de 2012). Sin ningún ID configurado no muestra nada. «Preferencias de cookies» del pie reabre el banner.
 */
export function Analytics() {
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let saved: Choice = null;
    try {
      const v = localStorage.getItem(CONSENT_KEY);
      saved = v === "granted" || v === "denied" ? v : null;
    } catch {}
    setChoice(saved);
    setOpen(saved === null);
    setReady(true);
    const reopen = () => setOpen(true);
    window.addEventListener("nitro:cookies", reopen);
    return () => window.removeEventListener("nitro:cookies", reopen);
  }, []);

  // Cada cambio de página cuenta como visita (la tienda navega sin recargar).
  useEffect(() => {
    if (choice !== "granted") return;
    const w = window as W;
    w.fbq?.("track", "PageView");
    if (GA_ID) w.gtag?.("event", "page_view", { page_path: pathname, send_to: GA_ID });
  }, [pathname, choice]);

  function decide(c: "granted" | "denied") {
    try {
      localStorage.setItem(CONSENT_KEY, c);
    } catch {}
    const wasGranted = choice === "granted";
    setChoice(c);
    setOpen(false);
    // Si había aceptado y ahora rechaza, se recarga para que los scripts ya cargados dejen de actuar.
    if (c === "denied" && wasGranted) location.reload();
  }

  if (!trackingEnabled || !ready) return null;
  const gId = GA_ID || ADS_ID;
  return (
    <>
      {choice === "granted" && (
        <>
          {META_ID && (
            <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_ID}');`}</Script>
          )}
          {gId && (
            <>
              <Script src={`https://www.googletagmanager.com/gtag/js?id=${gId}`} strategy="afterInteractive" />
              <Script id="gtag-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());${GA_ID ? `gtag('config','${GA_ID}',{send_page_view:false});` : ""}${ADS_ID ? `gtag('config','${ADS_ID}');` : ""}`}</Script>
            </>
          )}
        </>
      )}
      {open && (
        <div role="dialog" aria-label="Cookies" data-theme="light" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-[620px] rounded-[22px] bg-canvas p-5 text-ink shadow-2xl ring-1 ring-ink/15 sm:inset-x-6 sm:bottom-6">
          <p className="text-[15px] font-semibold">Tu privacidad</p>
          <p className="mt-1.5 text-[14px] leading-[1.5] text-muted">
            Con tu permiso usamos cookies de Meta y Google para medir nuestra publicidad y mostrarte anuncios más útiles. Sin tu permiso no cargamos nada de eso y la tienda funciona igual.{" "}
            <a href="/privacidad" className="underline">Más información</a>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => decide("granted")} className="rounded-button bg-action px-5 py-2.5 text-[14px] font-semibold text-on-action hover:opacity-90">Aceptar</button>
            <button type="button" onClick={() => decide("denied")} className="rounded-button border border-ink/40 px-5 py-2.5 text-[14px] font-semibold hover:bg-ink hover:text-canvas">Rechazar</button>
          </div>
        </div>
      )}
    </>
  );
}

/** Botón del pie de página para volver a elegir. Solo aparece si hay seguimiento configurado. */
export function CookiePrefs({ className = "" }: { className?: string }) {
  if (!trackingEnabled) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("nitro:cookies"))} className={className}>
      Preferencias de cookies
    </button>
  );
}

/** Evento de compra (una sola vez por pedido, aunque la persona recargue la página). */
export function TrackPurchase({ orderRef, value, items }: { orderRef: string; value: number; items: { sku: string; name: string; price: number; qty: number }[] }) {
  useEffect(() => {
    if (!trackingEnabled) return;
    const key = `nitro-purchase-${orderRef}`;
    let tries = 0;
    // Espera a que carguen los scripts (o a que la persona acepte) hasta ~20 s; solo se marca como enviado si se envió.
    const id = setInterval(() => {
      tries++;
      const w = window as W;
      try {
        if (localStorage.getItem(key)) return clearInterval(id);
        if (hasConsent() && (w.fbq || w.gtag)) {
          track("purchase", { items, value, transactionId: orderRef });
          localStorage.setItem(key, "1");
          clearInterval(id);
        }
      } catch {}
      if (tries > 40) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderRef, value]);
  return null;
}
