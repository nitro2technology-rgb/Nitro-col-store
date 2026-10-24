// Correos de pedidos con Resend (API REST, sin dependencias). Variables de entorno:
//   RESEND_API_KEY       llave de Resend (obligatoria; sin ella no se envía nada)
//   MAIL_FROM            remitente, ej. "Nitro Col Store <pedidos@nitro2tech.com>" (el dominio debe estar verificado en Resend)
//   ORDER_NOTIFY_EMAIL   quien recibe el aviso de cada pedido pagado (puede ser una lista separada por comas)
// Un fallo al enviar se registra pero nunca rompe el pago ni el webhook.
import { formatCOP } from "@nitro/shared";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type MailOrder = {
  number: number;
  email: string;
  phone: string;
  subtotalCents: bigint;
  discountCents: bigint;
  shippingCents: bigint;
  totalCents: bigint;
  shippingAddress: unknown;
  items: { name: string; sku: string; quantity: number; totalCents: bigint }[];
};

const cop = (cents: bigint) => esc(formatCOP(Number(cents)));

function table(order: MailOrder) {
  const row = (a: string, b: string, bold = false) =>
    `<tr><td style="padding:6px 0;${bold ? "font-weight:700;border-top:1px solid #ddd;" : ""}">${a}</td><td style="padding:6px 0;text-align:right;${bold ? "font-weight:700;border-top:1px solid #ddd;" : ""}">${b}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:15px">
    ${order.items.map((i) => row(`${i.quantity} × ${esc(i.name)} <span style="color:#888">(${esc(i.sku)})</span>`, cop(i.totalCents))).join("")}
    ${row("Subtotal", cop(order.subtotalCents))}
    ${order.discountCents > 0n ? row("Descuento", `−${cop(order.discountCents)}`) : ""}
    ${row("Envío", order.shippingCents > 0n ? cop(order.shippingCents) : "Gratis")}
    ${row("Total", cop(order.totalCents), true)}
  </table>`;
}

const shell = (title: string, body: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:22px;margin:0 0 16px">${title}</h1>${body}
    <p style="margin-top:32px;color:#888;font-size:12px">Nitro Col Store · nitrocol.nitro2tech.com</p>
  </div>`;

/** Aviso para el dueño: qué se vendió y a dónde enviarlo. */
export function ownerEmail(order: MailOrder) {
  const a = (order.shippingAddress ?? {}) as Record<string, string>;
  return {
    subject: `Pedido pagado NC-${order.number} · ${formatCOP(Number(order.totalCents))}`,
    html: shell(
      `Nuevo pedido pagado NC-${order.number}`,
      `${table(order)}
       <h2 style="font-size:16px;margin:24px 0 8px">Enviar a</h2>
       <p style="margin:0;line-height:1.5">${esc(a.name)}<br>${esc(a.line)}<br>${esc(a.city)}, ${esc(a.department)}${a.notes ? `<br><i>${esc(a.notes)}</i>` : ""}</p>
       <h2 style="font-size:16px;margin:24px 0 8px">Contacto</h2>
       <p style="margin:0;line-height:1.5">${esc(order.email)}<br>${esc(order.phone)}</p>`,
    ),
  };
}

/** Confirmación para el cliente. */
export function customerEmail(order: MailOrder) {
  const a = (order.shippingAddress ?? {}) as Record<string, string>;
  return {
    subject: `Recibimos tu pedido NC-${order.number}`,
    html: shell(
      `¡Gracias por tu compra, ${esc(String(a.name ?? "").split(" ")[0])}!`,
      `<p style="line-height:1.5">Tu pago fue aprobado. Pedido <b>NC-${order.number}</b>. Te escribiremos para coordinar el envío.</p>
       ${table(order)}
       <h2 style="font-size:16px;margin:24px 0 8px">Dirección de envío</h2>
       <p style="margin:0;line-height:1.5">${esc(a.line)}<br>${esc(a.city)}, ${esc(a.department)}</p>`,
    ),
  };
}

async function send(to: string[], subject: string, html: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM ?? "Nitro Col Store <onboarding@resend.dev>",
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

/** Envía el aviso al dueño y la confirmación al cliente. Nunca lanza error. */
export async function sendOrderEmails(order: MailOrder) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[mail] Sin RESEND_API_KEY: no se enviaron correos del pedido NC-${order.number}`);
    return;
  }
  const notify = (process.env.ORDER_NOTIFY_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const owner = ownerEmail(order);
  const customer = customerEmail(order);
  const results = await Promise.allSettled([
    notify.length > 0 ? send(notify, owner.subject, owner.html, order.email) : Promise.resolve(),
    send([order.email], customer.subject, customer.html),
  ]);
  for (const r of results) if (r.status === "rejected") console.error(`[mail] Pedido NC-${order.number}:`, r.reason);
}
