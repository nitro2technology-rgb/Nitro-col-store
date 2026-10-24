// Cliente de Supabase Auth para el navegador. Las dos variables son públicas por diseño (la llave "anon" no da acceso a datos:
// las tablas están protegidas con RLS y los pedidos se leen en el servidor). Sin ellas el ingreso se muestra como "pronto".
import { createBrowserClient } from "@supabase/ssr";

export const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const supabaseBrowser = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
