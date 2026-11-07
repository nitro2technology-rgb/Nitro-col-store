"use client";

import { useEffect, useRef, useState } from "react";
import { isVideoUrl } from "@/lib/site-settings";

/** Video de una publicación: sin sonido, en bucle, y solo se reproduce mientras se ve (ahorra datos y batería). */
function IgVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={`${src}#t=0.1`} muted loop playsInline preload="metadata" className="size-full shrink-0 basis-full snap-center object-cover" />;
}

/** Fotos y videos de una publicación de Instagram: se deslizan con el dedo, con flechas y puntos como en Instagram. */
export function IgSlides({ images, alt }: { images: string[]; alt: string }) {
  const row = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const go = (i: number) => {
    const el = row.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  const many = images.length > 1;
  return (
    <div className="relative">
      <div
        ref={row}
        onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth || 1)))}
        className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) =>
          isVideoUrl(src) ? (
            <IgVideo key={src} src={src} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={i === 0 ? alt : ""} loading="lazy" draggable={false} className="size-full shrink-0 basis-full snap-center object-cover" />
          ),
        )}
      </div>
      {many && idx < images.length - 1 && (
        <button
          type="button"
          aria-label="Siguiente"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            go(idx + 1);
          }}
          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[18px] leading-none text-black"
        >
          ›
        </button>
      )}
      {many && idx > 0 && (
        <button
          type="button"
          aria-label="Anterior"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            go(idx - 1);
          }}
          className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[18px] leading-none text-black"
        >
          ‹
        </button>
      )}
      {many && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5" aria-hidden="true">
          {images.map((_, i) => (
            <span key={i} className={`size-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/45"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
