import Link from "next/link";
import { categories } from "@/lib/products";

export function SiteFooter() {
  return (
    <footer className="text-muted">
      <div className="mx-auto grid max-w-[1024px] gap-10 px-6 py-16 text-xs sm:grid-cols-4">
        {categories.map((parent) => (
          <div key={parent.slug}>
            <Link href={`/c/${parent.slug}`} className="font-semibold text-ink">
              {parent.name}
            </Link>
            <ul className="mt-3 space-y-2">
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
        <div>
          <p className="font-semibold text-ink">Medios de pago</p>
          <p className="mt-3 leading-relaxed">Tarjetas, PSE, Nequi, Daviplata y efectivo.</p>
        </div>
        <div>
          <p className="font-semibold text-ink">Tu compra</p>
          <p className="mt-3 leading-relaxed">
            Cinco días hábiles para ejercer el derecho de retracto. Factura electrónica en cada pedido.
          </p>
        </div>
      </div>
      <nav aria-label="Información" className="mx-auto flex max-w-[1024px] flex-wrap gap-x-6 gap-y-2 px-6 pb-6 text-xs">
        <Link href="/ayuda" className="hover:text-ink">Ayuda</Link>
        <Link href="/terminos" className="hover:text-ink">Términos y condiciones</Link>
        <Link href="/privacidad" className="hover:text-ink">Privacidad</Link>
        <Link href="/cuenta" className="hover:text-ink">Mi cuenta</Link>
      </nav>
      <p className="mx-auto max-w-[1024px] px-6 pb-12 text-xs">
        © {new Date().getFullYear()} Nitro Col Store. Precios en COP, IVA incluido.
      </p>
    </footer>
  );
}
