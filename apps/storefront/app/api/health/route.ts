// Para el monitor externo (UptimeRobot / cron-job.org): mantiene despierto el servicio de Render y,
// con CATALOG_SOURCE=db, también la base de Supabase (el plan gratis la pausa tras 7 días sin actividad).
export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  if (process.env.CATALOG_SOURCE !== "db") return Response.json({ ok: true, db: "omitida" }, { headers });
  try {
    const { db } = await import("@nitro/db");
    await db.$queryRaw`select 1`;
    return Response.json({ ok: true, db: "ok" }, { headers });
  } catch (error) {
    console.error("[health] la base no responde:", error);
    return Response.json({ ok: false, db: "error" }, { status: 503, headers });
  }
}
