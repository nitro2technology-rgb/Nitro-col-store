import { formatCOP, type Product } from "@nitro/shared";
import { BUSINESS } from "@/lib/business";
import { FREE_SHIPPING_FROM_CENTS, SHIPPING_FLAT_CENTS } from "@/lib/pricing";
import { Marquee } from "@/components/marquee";

/** Cinta de beneficios del producto: lo principal que ofrece y las promesas de la tienda, en movimiento. */
export function BenefitsMarquee({ product }: { product: Product }) {
  const items = [
    ...product.highlights.map((h) => h.title.toUpperCase()),
    "ENVÍO A TODA COLOMBIA",
    "PAGO SEGURO CON WOMPI",
    "GARANTÍA Y DEVOLUCIONES",
  ];
  return (
    <div className="border-y border-ink/10">
      <Marquee items={items} speed={46} itemClass="py-4 text-[14px] font-bold uppercase tracking-[0.06em]" />
    </div>
  );
}

/** Preguntas que frenan una compra, resueltas en acordeones: material, envíos, garantía y qué hacer si algo falla. */
export function ProductAccordion({ product }: { product: Product }) {
  const specs = Object.entries(product.specs);
  const items: { q: string; a: React.ReactNode }[] = [
    ...(specs.length > 0
      ? [
          {
            q: "Especificaciones",
            a: (
              <ul className="space-y-1.5">
                {specs.map(([k, v]) => (
                  <li key={k}>
                    <b className="font-semibold">{k}:</b> {String(v)}
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
    {
      q: "Envíos",
      a: `Enviamos a toda Colombia en ${BUSINESS.deliveryTime}. El envío cuesta ${formatCOP(SHIPPING_FLAT_CENTS)} y es gratis desde ${formatCOP(FREE_SHIPPING_FROM_CENTS)}.`,
    },
    {
      q: "Garantía y devoluciones",
      a: `Tienes cinco días hábiles después de recibirlo para ejercer el derecho de retracto, y la garantía legal por defectos de fábrica. Escríbenos a ${BUSINESS.email} o por WhatsApp con tu número de pedido.`,
    },
    {
      q: "¿Qué pasa si llega dañado o con una falla?",
      a: `Escríbenos por WhatsApp (${BUSINESS.whatsapp}) o a ${BUSINESS.email} con tu número de pedido y unas fotos. Revisamos tu caso y te damos solución: cambio, reparación o reembolso, según corresponda.`,
    },
  ];
  return (
    <div className="mx-auto max-w-[720px] px-6 py-10">
      {items.map((it) => (
        <details key={it.q} className="group border-b border-ink/15">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
            {it.q}
            <span aria-hidden="true" className="text-[22px] font-light transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="pb-5 text-[16px] leading-[1.55] text-muted">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

const icon = "mx-auto size-9";
function IconCard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={icon} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={icon} aria-hidden="true">
      <path d="M2 7h12v9H2zM14 10h4l3 3v3h-7z" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={icon} aria-hidden="true">
      <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />
      <path d="m8.5 12 2.5 2.5L15.5 10" />
    </svg>
  );
}

/** Tres promesas con icono, como la franja gris de las páginas de producto de referencia. */
export function TrustStrip() {
  const items = [
    { icon: <IconCard />, text: "Pago seguro\ncon Wompi" },
    { icon: <IconTruck />, text: "Envío a toda\nColombia" },
    { icon: <IconShield />, text: "Garantía y\ndevoluciones" },
  ];
  return (
    <div className="mx-auto max-w-[1024px] px-3">
      <ul className="grid grid-cols-3 gap-2 rounded-[20px] bg-soft/25 px-2 py-6 text-center">
        {items.map((it) => (
          <li key={it.text}>
            {it.icon}
            <p className="mt-2 whitespace-pre-line text-[11px] font-bold uppercase leading-tight tracking-[0.06em] md:text-[12px]">{it.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Cierre de la ficha: ola negra y cinta con las garantías. */
export function QualityMarquee() {
  return (
    <div data-theme="dark" className="mt-10">
      <div className="wave-top" aria-hidden="true" />
      <div className="bg-[#111827] pb-2 text-ink">
        <Marquee
          items={["LA MEJOR CALIDAD", "GARANTÍA Y DEVOLUCIONES", "COMPRA ASEGURADA", "ENVÍO A TODA COLOMBIA"]}
          speed={40}
          itemClass="py-5 text-[18px] font-medium uppercase tracking-[0.04em] md:text-[22px]"
          separator=""
        />
      </div>
    </div>
  );
}
