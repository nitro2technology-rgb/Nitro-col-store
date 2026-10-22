"use client";

import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";

/**
 * Animación de entrada (solo la primera visita, ~3,5 s): el logo sobre un vidrio esmerilado; detrás, un león
 * real (video) camina hacia él. Siempre detrás del vidrio empañado, la cámara se acerca hasta dejar sus dos
 * ojos centrados, y la tienda se abre desde ellos.
 *
 * El HTML del servidor ya trae la capa, así la tienda no se asoma antes de tiempo. Si la persona ya la vio
 * (localStorage) o prefiere menos movimiento, `INTRO_SCRIPT` la oculta antes del primer pintado.
 * La línea de tiempo (CSS) arranca cuando el video empieza a reproducirse; si no carga a tiempo, la intro
 * se cierra sola.
 */

export const INTRO_KEY = "nitro-intro-v7";

/** Se ejecuta en <head>, antes de pintar: marca <html> para que el CSS oculte la intro si no corresponde. */
export const INTRO_SCRIPT = `try{if(!/[?&]intro/.test(location.search)&&(localStorage.getItem("${INTRO_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches))document.documentElement.dataset.introSeen="1"}catch(e){document.documentElement.dataset.introSeen="1"}`;

/** Duración desde que arranca el video hasta que la intro desaparece (coincide con globals.css). */
const RUN_MS = 3650;
/** Si el video no arranca en este tiempo (conexión lenta), se cierra la intro sin esperar más. */
const LOAD_TIMEOUT_MS = 2500;
/** Pupilas del león al final de public/brand/intro-leon.mp4, en fracción del cuadro (izquierda y derecha en pantalla). */
const EYES = { left: 0.43, right: 0.538, y: 0.257 };
/** Al terminar el zoom, la distancia entre los ojos ocupa esta fracción del ancho de la pantalla. */
const EYES_SPAN = 0.42;
/** Proporción del video (1600×678). */
const VIDEO_RATIO = 1600 / 678;

/**
 * Acople final: si la página tiene un logo de Nitro marcado con `data-intro-dock` (vacío: el elemento mismo;
 * "x y ancho": una zona dentro de una imagen, en fracciones), el logo de la intro viaja hasta encajar sobre
 * él y se funde con él.
 * Si no hay (otras páginas), el logo simplemente se disuelve.
 */
function dock(el: HTMLElement) {
  const mark = el.querySelector<HTMLElement>(".intro-mark .brand-mark");
  const target = document.querySelector<HTMLElement>("[data-intro-dock]");
  const box = target?.getBoundingClientRect();
  if (!mark || !target || !box || box.width === 0 || box.bottom < 0 || box.top > innerHeight) {
    delete el.dataset.dock;
    return;
  }
  // Sin valor, el destino es el propio elemento; con "x y ancho", una zona dentro de una imagen.
  const [fx = 0, fy = 0, fw = 1] = (target.dataset.introDock || "0 0 1").split(" ").map(Number);
  // Posición natural del logo (centrado en pantalla), sin las transformaciones de su animación.
  const w = mark.offsetWidth;
  const h = mark.offsetHeight;
  const cx = innerWidth / 2;
  const cy = innerHeight / 2;
  const tw = box.width * fw;
  const scale = tw / w;
  const tcx = box.left + box.width * fx + tw / 2;
  const tcy = box.top + box.height * fy + (h * scale) / 2;
  el.dataset.dock = "";
  el.style.setProperty("--dock-x", `${tcx - cx}px`);
  el.style.setProperty("--dock-y", `${tcy - cy}px`);
  el.style.setProperty("--dock-s", `${scale}`);
}

export function Intro() {
  const [show, setShow] = useState(true);
  const [running, setRunning] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (document.documentElement.dataset.introSeen) {
      setShow(false);
      return;
    }
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {}

    // El escenario cubre la pantalla con la proporción del video; así el ojo cae en un punto conocido y la
    // tienda se abre exactamente desde ahí (el punto de origen del zoom no se mueve en pantalla).
    const place = () => {
      const el = root.current;
      if (!el) return;
      dock(el);
      const w = Math.max(innerWidth, innerHeight * VIDEO_RATIO);
      const h = w / VIDEO_RATIO;
      const left = (innerWidth - w) / 2;
      const top = (innerHeight - h) / 2;
      el.style.setProperty("--stage-w", `${w}px`);
      el.style.setProperty("--stage-h", `${h}px`);
      // Zoom: el punto medio entre los ojos queda fijo (origen) y luego se lleva al centro de la pantalla.
      const midX = (EYES.left + EYES.right) / 2;
      const span = (EYES.right - EYES.left) * w;
      const zoom = Math.max(1.3, (EYES_SPAN * innerWidth) / span);
      const set = (k: string, v: string) => el.style.setProperty(k, v);
      set("--zoom-origin", `${midX * 100}% ${EYES.y * 100}%`);
      set("--zoom", `${zoom}`);
      set("--zoom-x", `${innerWidth / 2 - (left + w * midX)}px`);
      set("--zoom-y", `${innerHeight / 2 - (top + h * EYES.y)}px`);
      // Al final del zoom los ojos quedan centrados; desde ahí se abre la tienda.
      set("--eye-l", `${innerWidth / 2 - (span * zoom) / 2}px`);
      set("--eye-r", `${innerWidth / 2 + (span * zoom) / 2}px`);
      set("--eye-y", `${innerHeight / 2}px`);
    };
    place();
    addEventListener("resize", place);

    const skip = (e: KeyboardEvent) => e.key === "Escape" && setShow(false);
    addEventListener("keydown", skip);

    // En desarrollo, `?intro=1700` congela la animación en ese milisegundo para revisarla cuadro a cuadro.
    const freeze = Number(new URLSearchParams(location.search).get("intro"));
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setRunning(true);
      if (process.env.NODE_ENV !== "production" && freeze > 0) {
        timers.forEach(clearTimeout);
        requestAnimationFrame(() => {
          const v = video.current;
          if (v) {
            v.pause();
            v.currentTime = Math.min(freeze / 1000, v.duration || 0);
          }
          for (const a of root.current?.getAnimations({ subtree: true }) ?? []) {
            a.pause();
            a.currentTime = freeze;
          }
        });
        return;
      }
      timers.push(setTimeout(() => setShow(false), RUN_MS));
    };

    const v = video.current;
    if (v) {
      v.addEventListener("playing", run, { once: true });
      // React no siempre refleja `muted` al hidratar, y sin él el navegador bloquea la reproducción automática.
      v.muted = true;
      v.play().catch(() => setShow(false));
    }
    timers.push(setTimeout(() => (!v || v.paused || v.currentTime === 0 ? setShow(false) : undefined), LOAD_TIMEOUT_MS));

    return () => {
      timers.forEach(clearTimeout);
      v?.removeEventListener("playing", run);
      removeEventListener("resize", place);
      removeEventListener("keydown", skip);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      ref={root}
      className="intro"
      data-run={running || undefined}
      role="presentation"
      aria-hidden="true"
      onClick={() => setShow(false)}
    >
      {/* Escena: león en video + vidrio empañado. Es la capa que se abre desde los ojos al final. */}
      <div className="intro-scene">
        <div className="intro-stage">
          <video
            ref={video}
            className="intro-lion"
            src="/brand/intro-leon.mp4"
            poster="/brand/intro-leon.webp"
            muted
            playsInline
            preload="auto"
          />
        </div>
        <div className="intro-glass" />
      </div>

      {/* El logo va aparte, encima de la escena: no lo afecta la apertura y se queda hasta el final */}
      <div className="intro-mark">
        <BrandMark className="w-[min(72vw,460px)] text-ink" />
      </div>
    </div>
  );
}
