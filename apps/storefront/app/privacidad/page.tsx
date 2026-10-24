import type { Metadata } from "next";
import { DraftNotice, InfoPage, InfoSection, List } from "@/components/info-page";
import { BUSINESS, biz } from "@/lib/business";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Política de privacidad"
      intro="Cómo tratamos tus datos personales, conforme a la Ley 1581 de 2012 y sus normas reglamentarias. Última actualización: 24 de octubre de 2026."
    >
      <DraftNotice />

      <InfoSection title="Responsable del tratamiento">
        <p>
          {biz("legalName")}, NIT {biz("nit")}, Colombia. Tienda: {BUSINESS.tradeName} ({BUSINESS.site}).
        </p>
        <p>Correo para consultas y solicitudes sobre tus datos: {BUSINESS.email}.</p>
      </InfoSection>

      <InfoSection title="Qué datos recogemos">
        <List>
          <li>Al comprar: nombre, correo, teléfono, dirección de envío e indicaciones de entrega, y los productos del pedido.</li>
          <li>Al reseñar: tu reseña y tu nombre con la inicial del apellido.</li>
          <li>Datos de pago: <b>no los recibimos ni los guardamos</b>. Los captura Wompi en su sitio seguro; a nosotros solo nos informa si el pago fue aprobado.</li>
          <li>Tu carrito se guarda en el almacenamiento de tu navegador. No usamos cookies de publicidad ni de seguimiento.</li>
        </List>
      </InfoSection>

      <InfoSection title="Para qué los usamos">
        <List>
          <li>Procesar, despachar y entregar tu pedido, y avisarte su estado por correo o WhatsApp.</li>
          <li>Atender garantías, devoluciones, peticiones, quejas y reclamos.</li>
          <li>Cumplir obligaciones comerciales, contables y tributarias (por ejemplo, la factura).</li>
          <li>Prevenir fraudes y mantener la seguridad del sitio.</li>
        </List>
        <p>No vendemos tus datos. No te enviamos publicidad sin tu autorización.</p>
      </InfoSection>

      <InfoSection title="Con quién los compartimos">
        <p>Solo con quienes los necesitan para prestar el servicio, bajo sus propias políticas de seguridad:</p>
        <List>
          <li>Wompi (procesamiento del pago).</li>
          <li>La transportadora (nombre, teléfono y dirección, para entregarte el pedido).</li>
          <li>Proveedores técnicos: Supabase (base de datos), Render (alojamiento del sitio) y Resend (envío de correos). Algunos tienen servidores fuera de Colombia, por lo que tus datos pueden ser tratados en otros países.</li>
          <li>Autoridades, cuando la ley lo exija.</li>
        </List>
      </InfoSection>

      <InfoSection title="Tus derechos">
        <p>Como titular puedes, en cualquier momento y sin costo:</p>
        <List>
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Pedir prueba de la autorización que nos diste y saber cómo usamos tus datos.</li>
          <li>Revocar la autorización y pedir que eliminemos tus datos, salvo los que debamos conservar por ley.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio (www.sic.gov.co).</li>
        </List>
        <p>
          Escríbenos a {BUSINESS.email} con tu nombre y número de pedido. Respondemos las consultas en máximo 10 días hábiles y los reclamos en
          máximo 15 días hábiles, prorrogables conforme a la ley.
        </p>
      </InfoSection>

      <InfoSection title="Cuánto tiempo los conservamos">
        <p>
          Mientras sean necesarios para las finalidades anteriores y durante el tiempo que exijan las normas comerciales y tributarias para los
          registros de venta. Después se eliminan o se anonimizan.
        </p>
      </InfoSection>

      <InfoSection title="Menores de edad y cambios">
        <p>
          El sitio no está dirigido a menores de 18 años. Si cambiamos esta política, publicaremos la nueva versión aquí con su fecha de actualización.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
