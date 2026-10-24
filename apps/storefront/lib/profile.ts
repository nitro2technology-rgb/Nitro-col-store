// Perfil de la tienda ligado a la cuenta de Supabase (mismo id). Se crea la primera vez que la persona entra.
type AuthUser = { id: string; email?: string; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> };

export async function ensureProfile(user: AuthUser) {
  const email = user.email?.toLowerCase();
  if (!email) return null;
  const meta = user.user_metadata ?? {};
  const fullName = String(meta.full_name ?? meta.name ?? "").trim() || null;
  try {
    const { db } = await import("@nitro/db");
    const profile = await db.profile.upsert({ where: { id: user.id }, update: {}, create: { id: user.id, email, fullName } });
    // Solo con correo confirmado: así nadie reclama los pedidos de otro escribiendo su correo al registrarse.
    if (user.email_confirmed_at) {
      await db.order.updateMany({ where: { profileId: null, email: { equals: email, mode: "insensitive" } }, data: { profileId: user.id } });
    }
    return profile;
  } catch (error) {
    console.error("[auth] No se pudo crear o actualizar el perfil:", error);
    return null;
  }
}
