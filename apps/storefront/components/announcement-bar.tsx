import { formatCOP } from "@nitro/shared";
import { FREE_SHIPPING_FROM_CENTS } from "@/lib/pricing";
import { Marquee } from "@/components/marquee";

/** Cinta negra sobre el menú, con las promesas de la tienda desplazándose. Solo afirma lo que la tienda cumple. */
export function AnnouncementBar() {
  const items = [
    "ENVÍO A TODA COLOMBIA",
    `ENVÍO GRATIS DESDE ${formatCOP(FREE_SHIPPING_FROM_CENTS)}`,
    "PAGO SEGURO CON WOMPI",
    "GARANTÍAS Y DEVOLUCIONES",
  ];
  return (
    <div data-theme="dark" className="relative z-40 bg-[#0b0b0b] text-ink" role="region" aria-label="Avisos de la tienda">
      <Marquee items={items} speed={34} itemClass="py-3 text-[12px] font-semibold tracking-[0.1em] md:text-[13px]" separator="•" />
    </div>
  );
}
