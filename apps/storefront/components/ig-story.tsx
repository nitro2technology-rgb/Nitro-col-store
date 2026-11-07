"use client";

import { useEffect, useRef, useState } from "react";

/** Video de una historia: vertical, sin sonido al empezar, en bucle y solo se reproduce mientras se ve. Botón de sonido arriba. */
export function IgStoryVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

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

  return (
    <>
      <video ref={ref} src={`${src}#t=0.1`} muted={muted} loop playsInline preload="metadata" className="absolute inset-0 size-full object-cover" />
      <button
        type="button"
        aria-label={muted ? "Activar el sonido" : "Silenciar"}
        aria-pressed={!muted}
        onClick={() => setMuted((m) => !m)}
        className="absolute right-3 top-9 z-10 grid size-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" />
          {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M16 9a4.5 4.5 0 0 1 0 6m2.5-8.5a8 8 0 0 1 0 11" />}
        </svg>
      </button>
    </>
  );
}
