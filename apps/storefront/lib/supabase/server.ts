// Supabase Auth en el servidor: lee la sesión de las cookies. Úsalo solo en páginas/rutas que ya son dinámicas
// (cuenta, checkout, API): leer cookies en el layout volvería dinámicas todas las páginas y se perdería el caché.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const authEnabled = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          /* En un Server Component no se pueden escribir cookies: el middleware ya refresca la sesión. */
        }
      },
    },
  });
}

/** Usuario con sesión válida (verificada con Supabase, no solo leída de la cookie), o null. */
export async function currentUser() {
  if (!authEnabled()) return null;
  const { data } = await (await supabaseServer()).auth.getUser();
  return data.user;
}
