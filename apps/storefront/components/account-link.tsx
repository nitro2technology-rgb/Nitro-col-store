"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authConfigured, supabaseBrowser } from "@/lib/supabase/client";

/** "Ingresar" o "Mi cuenta" en la cabecera. Se resuelve en el navegador para que las páginas sigan siendo estáticas. */
export function AccountLink() {
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
    <Link href={signedIn ? "/cuenta" : "/ingresar"} className="nav-fx nav-link">
      {signedIn ? "Mi cuenta" : "Ingresar"}
    </Link>
  );
}
