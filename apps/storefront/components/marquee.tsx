import type { ReactNode } from "react";

/**
 * Cinta de textos que se desplaza de derecha a izquierda sin parar (se pausa al pasar el mouse y se detiene con
 * "reducir movimiento"). El contenido se repite dos veces y se mueve la mitad, así el bucle no se nota.
 */
export function Marquee({
  items,
  speed = 38,
  className = "",
  itemClass = "",
  separator = "✦",
}: {
  items: ReactNode[];
  speed?: number;
  className?: string;
  itemClass?: string;
  separator?: ReactNode;
}) {
  const group = (copy: number) =>
    items.map((it, i) => (
      <span key={`${copy}-${i}`} className={`flex shrink-0 items-center gap-8 pr-8 ${itemClass}`}>
        {it}
        <span aria-hidden="true" className="opacity-60">
          {separator}
        </span>
      </span>
    ));
  return (
    <div className={`marquee ${className}`} style={{ ["--marquee-speed" as string]: `${speed}s` }}>
      <div className="marquee-track">
        <div className="flex shrink-0">{group(0)}</div>
        {/* La segunda copia es decorativa: los lectores de pantalla leen solo la primera. */}
        <div className="flex shrink-0" aria-hidden="true">
          {group(1)}
        </div>
      </div>
    </div>
  );
}
