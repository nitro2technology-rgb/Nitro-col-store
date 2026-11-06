/** Nombre de cada estado del pedido, como lo ve la gente (Mi cuenta y panel). */
export const ORDER_STATUS: Record<string, string> = {
  pending_payment: "Pago pendiente",
  paid: "Pagado",
  processing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  return_requested: "Devolución solicitada",
  returned: "Devuelto",
};

export const dateFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });
export const dateTimeFmt = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});
