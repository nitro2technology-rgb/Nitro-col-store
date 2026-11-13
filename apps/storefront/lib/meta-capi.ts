// API de conversiones de Meta (servidor): reporta la compra aunque el navegador tenga bloqueadores.
// Solo se envía si (1) hay ID de píxel y META_CAPI_TOKEN y (2) la persona aceptó las cookies al pagar (Ley 1581):
// el consentimiento se guardó en Order.attribution.capi durante el checkout. El event_id es el mismo que usa el
// navegador (NC-<número>), así Meta no cuenta la compra dos veces.
import { createHash } from "node:crypto";
import { META_ID } from "./tracking-config";

export type CapiContext = { consent: true; fbp?: string; fbc?: string; ip?: string; ua?: string; url?: string };

const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const clean = (v: unknown, max: number) => (typeof v === "string" && v.length > 0 && v.length <= max ? v : undefined);

/** Arma lo que se guarda con el pedido. Devuelve null si no hay consentimiento o el envío no está configurado. */
export function buildCapiContext(body: unknown, req: Request): CapiContext | null {
  if (!META_ID || !process.env.META_CAPI_TOKEN) return null;
  const t = (body as { consent?: unknown; fbp?: unknown; fbc?: unknown } | null) ?? {};
  if (t.consent !== true) return null;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;
  return {
    consent: true,
    fbp: clean(t.fbp, 200),
    fbc: clean(t.fbc, 300),
    ip: clean(ip, 64),
    ua: clean(req.headers.get("user-agent"), 400),
    url: process.env.SITE_URL ? `${process.env.SITE_URL.replace(/\/$/, "")}/checkout` : undefined,
  };
}

type PaidOrder = {
  number: number;
  email: string;
  phone: string | null;
  totalCents: bigint;
  attribution: unknown;
  shippingAddress: unknown;
  items: { sku: string; quantity: number; unitCents: number }[];
};

/** Envía `Purchase` a Meta. Nunca lanza: un fallo aquí no debe afectar el pedido. */
export async function sendMetaPurchase(order: PaidOrder) {
  try {
    const token = process.env.META_CAPI_TOKEN;
    const capi = (order.attribution as { capi?: CapiContext } | null)?.capi;
    if (!META_ID || !token || !capi?.consent) return;

    const digits = (order.phone ?? "").replace(/\D/g, "");
    const phone = digits.length === 10 ? `57${digits}` : digits; // celular colombiano sin indicativo
    const fullName = String((order.shippingAddress as { name?: string } | null)?.name ?? "").trim().toLowerCase();
    const [first, ...rest] = fullName.split(/\s+/);
    const userData: Record<string, unknown> = {
      em: [sha(order.email.trim().toLowerCase())],
      country: [sha("co")],
      ...(phone && { ph: [sha(phone)] }),
      ...(first && { fn: [sha(first)] }),
      ...(rest.length && { ln: [sha(rest.at(-1) ?? "")] }),
      ...(capi.fbp && { fbp: capi.fbp }),
      ...(capi.fbc && { fbc: capi.fbc }),
      ...(capi.ip && { client_ip_address: capi.ip }),
      ...(capi.ua && { client_user_agent: capi.ua }),
    };
    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: `NC-${order.number}`,
          action_source: "website",
          ...(capi.url && { event_source_url: capi.url }),
          user_data: userData,
          custom_data: {
            currency: "COP",
            value: Number(order.totalCents) / 100,
            content_ids: order.items.map((i) => i.sku),
            content_type: "product",
            num_items: order.items.reduce((s, i) => s + i.quantity, 0),
            contents: order.items.map((i) => ({ id: i.sku, quantity: i.quantity, item_price: i.unitCents / 100 })),
          },
        },
      ],
      ...(process.env.META_CAPI_TEST_CODE && { test_event_code: process.env.META_CAPI_TEST_CODE }),
    };
    const res = await fetch(`https://graph.facebook.com/v21.0/${META_ID}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`[meta] La API de conversiones rechazó NC-${order.number}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  } catch (error) {
    console.error(`[meta] No se pudo enviar la compra NC-${order.number}:`, error);
  }
}
