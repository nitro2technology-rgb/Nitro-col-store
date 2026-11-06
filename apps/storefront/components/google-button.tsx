"use client";

// Botón oficial de Google (Google Identity Services) en nuestro propio dominio. Google entrega un token de identidad
// y Supabase lo canjea por sesión (signInWithIdToken), así la ventana de Google no muestra el dominio de Supabase.
// Si el script de Google no carga, se usa el ingreso por redirección de Supabase.
import { useEffect, useRef, useState } from "react";
import { Button } from "@nitro/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

// El Client ID de OAuth es público (viaja en cada solicitud a Google). El secreto solo está en Supabase.
const clientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "359746856659-u2qbk0dfu0576j6jur5f8ealic34roko.apps.googleusercontent.com";
const scriptSrc = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: any;
  }
}

function loadScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    let s = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = scriptSrc;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject(new Error("gsi")));
  });
}

// Supabase recibe el nonce original y Google su SHA-256 (hex); así el token no se puede reutilizar.
async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

export function GoogleButton({ next, callback, onError }: { next: string; callback: () => string; onError: (msg: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [nonce] = await Promise.all([makeNonce(), loadScript()]);
        if (cancelled || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          nonce: nonce.hashed,
          ux_mode: "popup",
          use_fedcm_for_button: true,
          callback: async ({ credential }: { credential: string }) => {
            const { error } = await supabaseBrowser().auth.signInWithIdToken({ provider: "google", token: credential, nonce: nonce.raw });
            if (error) onError("No se pudo iniciar con Google. Intenta de nuevo.");
            else window.location.href = next; // recarga completa: el servidor lee la sesión recién creada
          },
        });
        window.google.accounts.id.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          locale: "es",
          width: Math.min(400, Math.max(200, Math.round(box.current.clientWidth))),
        });
      } catch {
        if (!cancelled) setFallback(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [next, onError]);

  async function redirect() {
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
    if (error) onError("No se pudo iniciar con Google.");
  }

  if (fallback)
    return (
      <Button type="button" variant="ghost" className="w-full" onClick={redirect}>
        Continuar con Google
      </Button>
    );
  return <div ref={box} className="flex min-h-[44px] w-full justify-center" />;
}
