import type { Metadata } from "next";
import { DraftNotice, InfoPage, InfoSection } from "@/components/info-page";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <InfoPage title="Política de privacidad">
      <DraftNotice />
      <InfoSection title="Qué datos guardamos">
        <p>Nombre, correo, teléfono y dirección de envío, solo para gestionar tus pedidos y la factura electrónica.</p>
      </InfoSection>
      <InfoSection title="Tus derechos">
        <p>Puedes consultar, corregir o eliminar tus datos (Ley 1581 de 2012). El canal para solicitarlo se publicará aquí.</p>
      </InfoSection>
    </InfoPage>
  );
}
