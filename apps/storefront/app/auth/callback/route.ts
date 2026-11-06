// Destino de Google/Apple y de los enlaces del correo (confirmar cuenta, recuperar contraseña): canjea el código por sesión.
import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/profile";
import { requestOrigin } from "@/lib/site";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const origin = requestOrigin(req);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cuenta";
  // Solo rutas internas: evita usar este enlace para redirigir a otro sitio.
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/cuenta";
  if (!code) return NextResponse.redirect(`${origin}/ingresar?error=1`);

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/ingresar?error=1`);
  await ensureProfile(data.user);
  return NextResponse.redirect(`${origin}${dest}`);
}
