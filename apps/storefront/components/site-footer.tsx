import Link from "next/link";
import { categories } from "@/lib/products";
import { BUSINESS } from "@/lib/business";

/** Pie de página: bloque oscuro a todo el ancho, para distinguirlo del resto. Compacto en celular. */
export function SiteFooter() {
  return (
    <footer data-theme="dark" className="mt-10 bg-[#0b0b0b] text-ink/70">
      <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-x-6 gap-y-6 px-6 py-8 text-[13px] md:grid-cols-4 md:gap-10 md:py-12 md:text-sm">
        {categories.map((parent) => (
          <div key={parent.slug}>
            <Link href={`/c/${parent.slug}`} className="font-semibold text-ink">
              {parent.name}
            </Link>
            <ul className="mt-2 space-y-1.5 md:mt-3 md:space-y-2">
              {parent.children.map((c) => (
                <li key={c.slug}>
                  <Link href={`/c/${c.slug}`} className="hover:text-ink">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-2 md:col-span-1">
          <p className="font-semibold text-ink">Tu compra</p>
          <p className="mt-2 leading-relaxed md:mt-3">Pago con tarjeta, PSE y Nequi. Cinco días hábiles para ejercer el derecho de retracto.</p>
          <p className="mt-2">
            WhatsApp:{" "}
            <a href={`https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, "")}`} className="text-ink underline underline-offset-4">
              {BUSINESS.whatsapp}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-ink/15">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-3 px-6 py-5 text-[12px] md:flex-row md:items-center md:justify-between">
          <nav aria-label="Información" className="flex flex-wrap gap-x-5 gap-y-1.5">
            <Link href="/ayuda" className="hover:text-ink">Ayuda</Link>
            <Link href="/terminos" className="hover:text-ink">Términos y condiciones</Link>
            <Link href="/privacidad" className="hover:text-ink">Privacidad</Link>
            <Link href="/cuenta" className="hover:text-ink">Mi cuenta</Link>
          </nav>
          <p>© {new Date().getFullYear()} Nitro Col Store. Precios en COP, IVA incluido.</p>
        </div>
      </div>
    </footer>
  );
}
