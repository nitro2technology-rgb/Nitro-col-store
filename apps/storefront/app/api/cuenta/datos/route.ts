// Datos guardados de quien tiene sesión (nombre, celular y direcciones) para rellenar el pedido. Sin sesión: signedIn=false.
import { ensureProfile } from "@/lib/profile";
import { currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ signedIn: false }, { headers });
  const profile = await ensureProfile(user);
  if (!profile) return Response.json({ signedIn: true, email: user.email ?? "", name: "", phone: "", addresses: [] }, { headers });
  const { db } = await import("@nitro/db");
  const addresses = await db.address.findMany({ where: { profileId: profile.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], take: 10 });
  return Response.json(
    {
      signedIn: true,
      email: profile.email,
      name: profile.fullName ?? "",
      phone: profile.phone ?? "",
      addresses: addresses.map((a) => ({ id: a.id, fullName: a.fullName, phone: a.phone, department: a.department, city: a.city, line: a.line1, notes: a.notes ?? "", isDefault: a.isDefault })),
    },
    { headers },
  );
}
