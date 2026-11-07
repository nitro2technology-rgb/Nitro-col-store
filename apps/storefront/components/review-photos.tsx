"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fotos de una reseña, grandes dentro de la tarjeta. Al tocar una se abre en una ventana flotante sobre la misma
 * página (sin cambiar de página), con flechas para ver las demás, y se cierra con la X, con Esc o tocando el fondo.
 */
export function ReviewPhotos({ images, author, className = "" }: { images: string[]; author: string; className?: string }) {
  const list = images.slice(0, 3);
  const [open, setOpen] = useState<number | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + list.length) % list.length)), [list.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, step]);

  if (list.length === 0) return null;
  const cell = (i: number, tall: string) => (
    <button
      key={list[i]}
      type="button"
      onClick={() => setOpen(i)}
      aria-label={`Ampliar la foto ${i + 1} de ${author}`}
      className={`relative block w-full cursor-zoom-in overflow-hidden rounded-[14px] bg-black/20 ${tall}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={list[i]} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 hover:scale-[1.03]" />
    </button>
  );

  return (
    <>
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        {list.length === 1 && <div className="col-span-2">{cell(0, "aspect-[4/3]")}</div>}
        {list.length === 2 && (
          <>
            {cell(0, "aspect-square")}
            {cell(1, "aspect-square")}
          </>
        )}
        {list.length === 3 && (
          <>
            <div className="col-span-2">{cell(0, "aspect-[16/10]")}</div>
            {cell(1, "aspect-square")}
            {cell(2, "aspect-square")}
          </>
        )}
      </div>

      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label={`Foto de ${author}`} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={list[open]} alt={`Foto ${open + 1} de ${author}`} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] max-w-[94vw] rounded-[16px] object-contain shadow-2xl" />
          <button
            ref={closeBtn}
            type="button"
            aria-label="Cerrar"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(null);
            }}
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/90 text-[20px] leading-none text-black"
          >
            ✕
          </button>
          {list.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[24px] leading-none text-black"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Foto siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[24px] leading-none text-black"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
