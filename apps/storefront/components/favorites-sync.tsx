"use client";

import { useEffect } from "react";
import { useFavorites } from "@/lib/favorites";
import { authConfigured, supabaseBrowser } from "@/lib/supabase/client";

/**
 * Liga los favoritos a la cuenta. Con sesión: al entrar se unen los favoritos del navegador con los guardados en la
 * cuenta (metadata `favorites` de Supabase Auth, sin tabla nueva) y, desde ahí, cada cambio se guarda en la cuenta.
 * Sin sesión no hace nada (siguen en el navegador). No consulta la red si no hay sesión guardada.
 */
export function FavoritesSync() {
  useEffect(() => {
    if (!authConfigured) return;
    let stop = () => {};
    let cancelled = false;
    (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data } = await supabase.auth.getSession();
        if (cancelled || !data.session) return;
        const remote = data.session.user.user_metadata?.favorites;
        const saved = Array.isArray(remote) ? remote.filter((x): x is string => typeof x === "string") : [];
        const local = useFavorites.getState().items;
        const merged = [...new Set([...local, ...saved])].slice(0, 60);
        if (merged.join() !== local.join()) useFavorites.getState().set(merged);

        let last = merged.join();
        let timer: ReturnType<typeof setTimeout> | undefined;
        const save = (slugs: string[]) => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            last = slugs.join();
            supabase.auth.updateUser({ data: { favorites: slugs } }).catch(() => {});
          }, 1200);
        };
        if (merged.join() !== saved.join()) save(merged);
        const unsub = useFavorites.subscribe((s) => {
          if (s.items.join() !== last) save(s.items);
        });
        stop = () => {
          unsub();
          clearTimeout(timer);
        };
      } catch {
        /* sin red o sin sesión: los favoritos siguen en el navegador */
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, []);
  return null;
}
