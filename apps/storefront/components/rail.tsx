"use client";

import { useRef } from "react";

/** Fila horizontal que se desliza con el dedo o con flechas (carrusel). */
export function Rail({ children, label }: { children: React.ReactNode; label: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const move = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * Math.max(280, (rail.current?.clientWidth ?? 600) * 0.8), behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={rail} role="region" aria-label={label} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => move(-1)} aria-label="Anterior" className="grid size-10 place-items-center rounded-full bg-ink/20 text-ink hover:bg-ink/30">
          ‹
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Siguiente" className="grid size-10 place-items-center rounded-full bg-ink text-canvas hover:opacity-90">
          ›
        </button>
      </div>
    </div>
  );
}
