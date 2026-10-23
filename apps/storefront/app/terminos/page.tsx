import type { Metadata } from "next";
import { DraftNotice, InfoPage, InfoSection } from "@/components/info-page";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
  return (
    <InfoPage title="Términos y condiciones">
      <DraftNotice />
      <InfoSection title="Compras">
        <p>Los precios están en pesos colombianos (COP) con IVA incluido. El pedido se confirma cuando el pago es aprobado.</p>
      </InfoSection>
      <InfoSection title="Vendedores">
        <p>Algunos productos son vendidos y despachados por vendedores externos. Se indicará quién vende cada producto.</p>
      </InfoSection>
      <InfoSection title="Retracto y devoluciones">
        <p>Tienes cinco días hábiles después de la entrega para ejercer el derecho de retracto. Envíos, garantías y devoluciones: por definir.</p>
      </InfoSection>
    </InfoPage>
  );
}
