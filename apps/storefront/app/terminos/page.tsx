import type { Metadata } from "next";
import Link from "next/link";
import { formatCOP } from "@nitro/shared";
import { DraftNotice, InfoPage, InfoSection, List } from "@/components/info-page";
import { BUSINESS, biz } from "@/lib/business";
import { GAFAS_TIERS } from "@/lib/gafas-promo";
import { FREE_SHIPPING_FROM_CENTS, SHIPPING_FLAT_CENTS } from "@/lib/pricing";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
  return (
    <InfoPage title="Términos y condiciones" intro="Última actualización: 24 de octubre de 2026.">
      <DraftNotice />

      <InfoSection title="1. Quién vende">
        <p>
          {BUSINESS.tradeName} ({BUSINESS.site}) es una tienda en línea operada por {biz("legalName")}, identificada con NIT {biz("nit")}, Colombia.
        </p>
        <p>
          Contacto: {BUSINESS.email} · WhatsApp {biz("whatsapp")}. Al comprar en este sitio aceptas estos términos y la{" "}
          <Link href="/privacidad" className="text-link hover:underline">política de privacidad</Link>.
        </p>
      </InfoSection>

      <InfoSection title="2. Productos y precios">
        <p>
          Los precios están en pesos colombianos (COP) con impuestos incluidos. Las fotos son de referencia: el tono de un color puede variar
          ligeramente según la pantalla. La disponibilidad depende del inventario; si un producto se agota mientras pagas, te avisaremos y
          devolveremos tu dinero.
        </p>
        <p>
          Si un precio publicado tiene un error evidente, nos reservamos el derecho de cancelar el pedido y reembolsar lo pagado, avisándote.
        </p>
      </InfoSection>

      <InfoSection title="3. Descuentos por cantidad">
        <p>
          En las gafas, el descuento se aplica automáticamente al pagar según las unidades del carrito:{" "}
          {GAFAS_TIERS.map((t, i) => `${t.min}${i === GAFAS_TIERS.length - 1 ? " o más" : ""} unidades ${t.pct}%`).join(", ")}. No es acumulable con
          otras promociones, salvo que se indique lo contrario.
        </p>
      </InfoSection>

      <InfoSection title="4. Pago">
        <p>
          Los pagos se procesan en el sitio seguro de Wompi (tarjetas, PSE, Nequi y los demás medios que Wompi tenga habilitados). {BUSINESS.tradeName}{" "}
          no recibe ni guarda los datos de tu tarjeta o cuenta.
        </p>
        <p>
          El pedido se confirma cuando Wompi aprueba el pago; recibirás un correo con el resumen. Si el pago es rechazado, no se genera ningún cobro
          ni pedido.
        </p>
      </InfoSection>

      <InfoSection title="5. Envíos">
        <List>
          <li>Enviamos a todo el territorio colombiano a la dirección que indiques; revísala bien antes de pagar.</li>
          <li>
            Costo de envío: {formatCOP(SHIPPING_FLAT_CENTS)}. <b>Envío gratis</b> en compras desde {formatCOP(FREE_SHIPPING_FROM_CENTS)} (valor ya con
            descuentos).
          </li>
          <li>Tiempo estimado de entrega: {biz("deliveryTime")}, contados desde la confirmación del pago. Es una estimación, no una garantía: puede variar por la transportadora o la zona.</li>
          <li>Si la transportadora no logra entregar por datos errados o ausencia, podremos cobrar un nuevo envío.</li>
        </List>
      </InfoSection>

      <InfoSection title="6. Derecho de retracto">
        <p>
          Por ser una compra a distancia, puedes devolver el producto y recibir tu dinero dentro de los <b>cinco (5) días hábiles</b> siguientes a la
          entrega (Ley 1480 de 2011, art. 47), sin tener que dar explicaciones.
        </p>
        <List>
          <li>Escríbenos a {BUSINESS.email} con tu número de pedido (NC-…) indicando que ejerces el retracto.</li>
          <li>El producto debe estar sin uso, en su empaque y con todos sus accesorios.</li>
          <li>Los costos de transporte de la devolución corren por tu cuenta.</li>
          <li>Te devolvemos el dinero por el mismo medio de pago, dentro de los 30 días calendario siguientes a que ejerces el retracto.</li>
          <li>No aplica a las excepciones que prevé la ley, como bienes hechos a la medida o personalizados.</li>
        </List>
      </InfoSection>

      <InfoSection title="7. Garantía">
        <p>
          Todos los productos tienen la garantía legal por calidad e idoneidad (Ley 1480 de 2011). El término es el que informa el fabricante o
          proveedor de cada producto. Si el producto sale defectuoso, lo reparamos, lo cambiamos o te devolvemos el dinero, según corresponda.
        </p>
        <p>
          Para solicitarla escríbenos a {BUSINESS.email} con tu número de pedido y fotos o video del problema. La garantía no cubre daños por mal uso,
          golpes, humedad, modificaciones ni el desgaste normal.
        </p>
      </InfoSection>

      <InfoSection title="8. Reseñas">
        <p>
          Solo pueden dejar reseñas quienes compraron el producto (con su número de pedido y correo). Mostramos tu nombre y la inicial de tu apellido.
          Podemos ocultar reseñas ofensivas, falsas o que incluyan datos personales.
        </p>
      </InfoSection>

      <InfoSection title="9. Propiedad intelectual">
        <p>
          Las marcas, textos, fotos y diseños del sitio pertenecen a {BUSINESS.tradeName} o a sus titulares y no pueden usarse sin autorización.
        </p>
      </InfoSection>

      <InfoSection title="10. Peticiones, quejas y reclamos">
        <p>
          Escríbenos a {BUSINESS.email} y te responderemos lo antes posible. Si no estás conforme con la respuesta, puedes acudir a la
          Superintendencia de Industria y Comercio (www.sic.gov.co), autoridad de protección al consumidor.
        </p>
      </InfoSection>

      <InfoSection title="11. Ley aplicable y cambios">
        <p>
          Estos términos se rigen por las leyes de Colombia. Podemos actualizarlos; aplican a las compras hechas después de la fecha de
          actualización indicada arriba.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
