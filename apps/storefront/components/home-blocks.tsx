import Link from "next/link";
import { buttonClasses } from "@nitro/ui";
import { formatCOP } from "@nitro/shared";
import { BUSINESS } from "@/lib/business";
import { FREE_SHIPPING_FROM_CENTS, SHIPPING_FLAT_CENTS } from "@/lib/pricing";
import type { ShopReview } from "@/lib/reviews";
import { Marquee } from "@/components/marquee";

const check = (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** Botones bajo la portada y franja gris con tres promesas, como en la referencia. */
export function HomeAfterHero({ hasReviews }: { hasReviews: boolean }) {
  return (
    <>
      <div className="mx-auto mt-6 flex max-w-[1440px] flex-wrap items-center justify-center gap-4 px-4">
        <Link href="#coleccion" className={buttonClasses("buy", "cta-pulse !px-8 !py-3.5 !text-[15px] font-bold uppercase tracking-[0.06em]")}>
          Ver colección
        </Link>
        {hasReviews && (
          <Link href="#resenas" className="text-[15px] underline underline-offset-4">
            Nuestras reseñas
          </Link>
        )}
      </div>
      <div data-theme="dark" className="mt-6 bg-[#4b5563]/90 text-[13px] text-white backdrop-blur-md">
        <ul className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-10 gap-y-1 px-4 py-2.5 md:justify-between md:px-8">
          <li className="flex items-center gap-2">{check} Envío a toda Colombia</li>
          <li className="flex items-center gap-2">{check} Pago seguro con Wompi</li>
          <li className="flex items-center gap-2">{check} Garantía y devoluciones</li>
        </ul>
      </div>
    </>
  );
}

/** Cinta oscura en movimiento entre secciones. */
export function HomeMarquee() {
  return (
    <div data-theme="dark" className="bg-[#111827] text-ink">
      <Marquee
        items={["ENVÍOS A TODO EL PAÍS", "PAGO SEGURO CON WOMPI", "GARANTÍA Y DEVOLUCIONES", "ATENCIÓN POR WHATSAPP", "COMPRA ASEGURADA"]}
        speed={42}
        itemClass="py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em]"
        separator="✓"
      />
    </div>
  );
}

export type Promo = { title: string; text: string; cta: string; href: string; image?: string };

/** Dos pancartas grandes hacia Tecnología y Moda. */
export function HomePromos({ promos }: { promos: Promo[] }) {
  return (
    <section className="mx-auto grid max-w-[1440px] gap-4 px-4 py-16 md:grid-cols-2 md:px-8 md:py-24">
      {promos.map((p) => (
        <Link
          key={p.title}
          href={p.href}
          className="group relative isolate flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[20px] bg-[#111827] p-7 md:min-h-[560px] md:p-10"
        >
          {p.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image} alt="" className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          )}
          <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />
          <span className="text-[clamp(32px,4vw,52px)] font-semibold leading-[1.02] text-white">{p.title}</span>
          <span>
            <span className="block max-w-[34ch] text-[16px] text-white/90">{p.text}</span>
            <span className="mt-4 inline-block rounded-button border border-white px-5 py-2 text-[15px] text-white transition-colors group-hover:bg-white group-hover:text-black">
              {p.cta}
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}

const iconCls = "size-9";
const benefits = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className={iconCls} aria-hidden="true">
        <path d="M2 7h12v9H2zM14 10h4l3 3v3h-7z" />
        <circle cx="6.5" cy="17.5" r="1.8" />
        <circle cx="17.5" cy="17.5" r="1.8" />
      </svg>
    ),
    text: (
      <>
        Envíos a toda Colombia en <b>{BUSINESS.deliveryTime}</b>
      </>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className={iconCls} aria-hidden="true">
        <path d="M12 3 3 8v8l9 5 9-5V8z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
    ),
    text: (
      <>
        Envío <b>gratis</b> desde {formatCOP(FREE_SHIPPING_FROM_CENTS)}; antes, {formatCOP(SHIPPING_FLAT_CENTS)}
      </>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={iconCls} aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </svg>
    ),
    text: (
      <>
        Pago seguro con <b>Wompi</b>: tarjeta, PSE y Nequi
      </>
    ),
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className={iconCls} aria-hidden="true">
        <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />
        <path d="m8.5 12 2.5 2.5L15.5 10" />
      </svg>
    ),
    text: (
      <>
        <b>5 días hábiles</b> de retracto y garantía legal
      </>
    ),
  },
];

/** Cuatro beneficios con icono. */
export function HomeBenefits() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-6 md:px-8">
      <ul className="grid grid-cols-2 gap-y-10 py-10 text-center md:grid-cols-4">
        {benefits.map((b, i) => (
          <li key={i} className="flex flex-col items-center gap-4 px-4">
            <span className="grid size-[68px] place-items-center rounded-full border border-ink/70">{b.icon}</span>
            <p className="max-w-[24ch] text-[15px] leading-snug">{b.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Reseñas reales y publicadas (nunca de ejemplo). Si aún no hay ninguna, no se muestra la sección. */
export function HomeReviews({ reviews }: { reviews: ShopReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <section id="resenas" className="mx-auto max-w-[1440px] scroll-mt-20 px-4 py-16 md:px-8 md:py-24">
      <div className="text-right">
        <h2 className="text-[clamp(32px,4.4vw,52px)]">Ellos ya lo tienen</h2>
        <p className="mt-1 text-muted">Reseñas de compradores verificados</p>
      </div>
      <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {reviews.map((r) => (
          <article
            key={`${r.author}-${r.date}`}
            data-theme="dark"
            className="flex w-[300px] shrink-0 snap-start flex-col justify-between rounded-[20px] bg-[#111827] p-6 text-ink md:w-[340px]"
          >
            <div>
              <p className="tracking-[0.2em] text-[#c9a24d]" role="img" aria-label={`${r.stars} de 5 estrellas`}>
                {"★".repeat(r.stars)}
              </p>
              <p className="mt-4 text-[17px] leading-[1.5]">“{r.text}”</p>
            </div>
            <div className="mt-6 text-[14px]">
              <p className="font-semibold">{r.author}</p>
              <Link href={`/p/${r.productSlug}`} className="text-muted underline-offset-4 hover:underline">
                {r.product}
              </Link>
              <p className="mt-1 text-[#c9a24d]">✓ Compra verificada</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Banda oscura con quiénes somos, solo con datos reales del negocio. */
export function HomeStory() {
  const facts = [
    { big: "Desde 2020", small: "Tecnología y estilo para tu día a día" },
    { big: "Toda Colombia", small: "Envíos a cualquier ciudad del país" },
    { big: "Pago seguro", small: "Wompi: tarjeta, PSE, Nequi y más" },
    { big: "Garantía", small: "Retracto de cinco días hábiles" },
  ];
  return (
    <section data-theme="dark" className="bg-[#1b1b1b] text-ink">
      <div className="mx-auto grid max-w-[1100px] gap-10 px-6 py-14 md:grid-cols-[1fr_1.4fr] md:py-20">
        <div className="text-center md:text-left">
          <p className="text-[13px] font-bold uppercase tracking-[0.1em]">Conoce nuestra historia</p>
          <p className="mt-3 text-muted">
            {BUSINESS.legalName} · {BUSINESS.tradeName}
          </p>
          <p className="mt-4 leading-[1.55]">
            Nitro Col nació para que comprar tecnología y accesorios con estilo sea fácil, seguro y sin vueltas: pagas en un sitio protegido, te lo enviamos a donde estés y te
            acompañamos por WhatsApp si necesitas algo.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 text-center">
          {facts.map((f) => (
            <div key={f.big}>
              <dt className="text-[clamp(20px,2.4vw,28px)] font-semibold">{f.big}</dt>
              <dd className="mt-1 text-[14px] text-muted">{f.small}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Preguntas frecuentes en dos columnas y botón de WhatsApp. */
export function HomeFaq({ items }: { items: { q: string; a: string }[] }) {
  const wa = `https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, "")}`;
  return (
    <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 md:grid-cols-[1fr_1.5fr] md:px-8 md:py-24">
      <div>
        <h2 className="text-[clamp(28px,3.4vw,40px)]">Preguntas frecuentes</h2>
        <p className="mt-4 max-w-[44ch] leading-[1.55] text-muted">
          Reunimos las dudas más comunes para ayudarte a decidir. Si no encuentras lo que buscas, escríbenos y te acompañamos.
        </p>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-[15px] font-semibold text-on-action hover:opacity-90"
        >
          Escríbenos por WhatsApp
        </a>
      </div>
      <div>
        {items.map((it) => (
          <details key={it.q} className="group border-b border-ink/20">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] [&::-webkit-details-marker]:hidden">
              {it.q}
              <span aria-hidden="true" className="text-[22px] font-light transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-5 leading-[1.55] text-muted">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
