// Preguntas comunes a todos los productos. Los montos salen de lib/pricing.ts para no quedar desactualizados.
import { formatCOP } from "@nitro/shared";
import { BUSINESS, biz } from "./business";
import { FREE_SHIPPING_FROM_CENTS, SHIPPING_FLAT_CENTS } from "./pricing";

export const commonFaq = [
  {
    q: "¿Cuánto cuesta el envío y cuánto demora?",
    a: `El envío cuesta ${formatCOP(SHIPPING_FLAT_CENTS)} a todo el país y es gratis desde ${formatCOP(FREE_SHIPPING_FROM_CENTS)}. Tiempo estimado de entrega: ${biz("deliveryTime")}.`,
  },
  {
    q: "¿Puedo devolver el producto?",
    a: `Sí. Tienes cinco días hábiles después de la entrega para ejercer el derecho de retracto. Escríbenos a ${BUSINESS.email} con tu número de pedido.`,
  },
  {
    q: "¿Qué medios de pago aceptan?",
    a: "Pagas en el sitio seguro de Wompi: tarjetas de crédito y débito, PSE, Nequi y los demás medios que Wompi tenga habilitados.",
  },
  {
    q: "¿Cómo sé que mi pedido quedó confirmado?",
    a: "Apenas se aprueba el pago te llega un correo con el resumen y el número de pedido (NC-…). Revisa también la carpeta de spam.",
  },
  {
    q: "¿Entregan factura?",
    a: `Si necesitas factura, escríbenos a ${BUSINESS.email} con tu número de pedido y tus datos de facturación.`,
  },
  {
    q: "¿Cómo dejo una reseña?",
    a: "En la página del producto que compraste, usa el botón \"Escribir una reseña\" con tu número de pedido y el correo de la compra.",
  },
];
