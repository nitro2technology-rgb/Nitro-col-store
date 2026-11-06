// Origen público de la petición. Detrás del proxy de Render `req.url` llega como http://localhost:10000,
// así que se usa el dominio que vio el visitante (x-forwarded-host / host).
export function requestOrigin(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return new URL(req.url).origin;
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
