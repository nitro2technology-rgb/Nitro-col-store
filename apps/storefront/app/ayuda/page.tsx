import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info-page";
import { BUSINESS, biz } from "@/lib/business";
import { commonFaq } from "@/lib/faq";

export const metadata: Metadata = { title: "Ayuda" };

export default function HelpPage() {
  return (
    <InfoPage title="Ayuda" intro="Resolvemos las dudas más comunes sobre tu compra.">
      {commonFaq.map((f) => (
        <InfoSection key={f.q} title={f.q}>
          <p>{f.a}</p>
        </InfoSection>
      ))}
      <InfoSection title="¿Necesitas hablar con nosotros?">
        <p>
          Escríbenos a {BUSINESS.email} o por WhatsApp al {biz("whatsapp")}.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
