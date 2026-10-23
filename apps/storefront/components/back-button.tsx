"use client";

import { usePathname, useRouter } from "next/navigation";

/** Páginas "de segundo nivel" donde tiene sentido volver. En Inicio y en las categorías (Moda, Gafas...) no sale. */
const showOn = (path: string) => path.startsWith("/p/") || ["/carrito", "/cuenta", "/ingresar", "/ayuda", "/terminos", "/privacidad"].includes(path);

/** Botón flotante arriba a la izquierda para volver a la pantalla anterior (o a Inicio si se entró directo). */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  if (!showOn(pathname)) return null;

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <button
      type="button"
      onClick={back}
      aria-label="Volver a la pantalla anterior"
      className="fixed left-4 top-[68px] z-40 grid size-11 place-items-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-x-0.5 hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5" />
        <path d="m11 6-6 6 6 6" />
      </svg>
    </button>
  );
}
