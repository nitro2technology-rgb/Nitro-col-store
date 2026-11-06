// Acceso al panel de administración (/admin). Es administrador quien tiene sesión con correo confirmado y:
//   - su correo está en ADMIN_EMAILS (lista separada por comas, variable de entorno), o
//   - su perfil tiene rol admin o super_admin en la base.
// Cada página y cada acción del panel llama a requireAdmin(): no basta con ocultar enlaces.
import { notFound, redirect } from "next/navigation";
import { ensureProfile } from "./profile";
import { currentUser } from "./supabase/server";

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

type AuthUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** true si el usuario es administrador. Sin correo confirmado nunca lo es. */
export async function isAdmin(user: AuthUser | null) {
  if (!user?.email || !user.email_confirmed_at) return false;
  if (adminEmails().includes(user.email.toLowerCase())) return true;
  const profile = await ensureProfile(user);
  return profile?.role === "admin" || profile?.role === "super_admin";
}

/**
 * Exige un administrador: sin sesión lleva a ingresar; con sesión pero sin permiso responde 404,
 * para no revelar que el panel existe. Devuelve el usuario (su id queda como autor en historial y auditoría).
 */
export async function requireAdmin(next = "/admin") {
  const user = await currentUser();
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(next)}`);
  if (!(await isAdmin(user))) notFound();
  return user;
}
