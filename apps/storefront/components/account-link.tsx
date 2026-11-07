"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authConfigured, supabaseBrowser } from "@/lib/supabase/client";

/** "Ingresar" o "Mi cuenta" en la cabecera. Se resuelve en el navegador para que las páginas sigan siendo estáticas. */
export function AccountLink({ icon = false }: { icon?: boolean }) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!authConfigured) return;
    const supabase = supabaseBrowser();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!authConfigured) return null;
  return (
    <Link
      href={signedIn ? "/cuenta" : "/ingresar"}
      aria-label={signedIn ? "Mi cuenta" : "Ingresar"}
      className={icon ? "nav-fx grid size-10 place-items-center" : "nav-fx nav-link"}
    >
      {icon ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </svg>
      ) : signedIn ? (
        "Mi cuenta"
      ) : (
        "Ingresar"
      )}
    </Link>
  );
}
