import Link from "next/link";
import { formatPrice } from "@nitro/shared";
import { BUSINESS } from "@/lib/business";
import { FREE_SHIPPING_FROM_CENTS, SHIPPING_FLAT_CENTS } from "@/lib/pricing";

/** Tarjeta blanca al final de las fichas de tecnología (en el tono oscuro es un contraste deliberado): envío, garantía y atención. */
export function ShowcaseInfo() {
  const blocks = [
    {
      title: "Envío",
      body: `Gratis desde ${formatPrice(FREE_SHIPPING_FROM_CENTS)}; por debajo, ${formatPrice(SHIPPING_FLAT_CENTS)} a todo el país. Entrega en ${BUSINESS.deliveryTime}.`,
    },
    { title: "Garantía y retracto", body: "Garantía legal y derecho de retracto según el Estatuto del Consumidor (Ley 1480 de 2011)." },
    { title: "Atención", body: `¿Dudas antes de comprar? Escríbenos por WhatsApp al ${BUSINESS.whatsapp}.` },
  ];
  return (
    <section className="mx-auto max-w-[1024px] px-6 pb-24">
      <div className="grid gap-8 rounded-[28px] bg-white p-8 text-[#1d1d1f] md:grid-cols-3 md:p-12">
        {blocks.map((b) => (
          <div key={b.title}>
            <h3 className="text-[19px] font-semibold tracking-[0.228px]">{b.title}</h3>
            <p className="mt-2 text-[15px] leading-[1.47] text-[#1d1d1f]/80">{b.body}</p>
          </div>
        ))}
        <p className="text-[14px] md:col-span-3">
          <Link href="/ayuda" className="font-semibold underline underline-offset-4 hover:no-underline">
            Ver preguntas frecuentes
          </Link>
        </p>
      </div>
    </section>
  );
}
