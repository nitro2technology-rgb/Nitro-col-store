// Datos del negocio que usan los textos legales (términos, privacidad, ayuda). El dueño debe completar los vacíos:
// mientras falte alguno, las páginas muestran un aviso con lo que falta y el dato como "[por completar]".
export const BUSINESS = {
  tradeName: "Nitro Col Store",
  site: "nitrocol.nitro2tech.com",
  /** Correo de atención y de solicitudes de datos personales (debe recibir correo: reenvío en Namecheap). */
  email: "pedidos@nitro2tech.com",
  /** Nombre o razón social de quien vende (persona natural o empresa). */
  legalName: "NITRO 2TECH S.A.S",
  /** NIT o cédula con la que se factura. */
  nit: "902096772-1",
  /** Dirección para notificaciones. Opcional: el dueño decidió no publicarla por ahora. */
  address: "",
  /** WhatsApp de atención, con indicativo (ej. +57 300 000 0000). */
  whatsapp: "+57 314 203 0967",
  /** Tiempo de entrega prometido, ej. "2 a 5 días hábiles". */
  deliveryTime: "2 a 5 días hábiles",
};

export const PENDING = "[por completar]";

const labels: Record<string, string> = {
  legalName: "nombre o razón social",
  nit: "NIT o cédula",
  whatsapp: "WhatsApp",
  deliveryTime: "tiempo de entrega",
};

/** Datos del negocio que aún faltan (en lenguaje del dueño). */
export const missingBusinessData = () =>
  Object.entries(labels)
    .filter(([key]) => !BUSINESS[key as keyof typeof BUSINESS])
    .map(([, label]) => label);

/** Valor del dato, o "[por completar]" si el dueño aún no lo definió. */
export const biz = (key: keyof typeof BUSINESS) => BUSINESS[key] || PENDING;
