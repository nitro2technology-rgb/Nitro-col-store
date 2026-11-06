import { NextResponse } from "next/server";
import { requestOrigin } from "@/lib/site";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await (await supabaseServer()).auth.signOut();
  return NextResponse.redirect(`${requestOrigin(req)}/`, 303);
}
