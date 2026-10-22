import type { CSSProperties, ReactNode } from "react";

/**
 * Follaje inmersivo: ramas con hojas en tres planos de profundidad (fondo difuso, plano medio nítido,
 * primer plano muy desenfocado), más manchas de sombra de hojas sobre la página. Todo es decorativo.
 * Se dibuja con semilla fija, así que servidor y cliente generan exactamente lo mismo.
 */

type Tone = "light" | "night";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

/** Una hoja apuntada, ligeramente asimétrica, con nervadura central y nervios laterales. */
function Leaf({ r, x, y, rot, size, fill }: { r: () => number; x: number; y: number; rot: number; size: number; fill: string }) {
  const w = size * (0.3 + r() * 0.12);
  const skew = (r() - 0.5) * size * 0.1;
  const d = `M0 0 C ${f(size * 0.2)} ${f(-w * 1.1 + skew)}, ${f(size * 0.7)} ${f(-w + skew)}, ${f(size)} 0 C ${f(size * 0.7)} ${f(w * 0.9 - skew)}, ${f(size * 0.2)} ${f(w * 1.05 - skew)}, 0 0 Z`;
  const veins = [0.22, 0.4, 0.58, 0.74].flatMap((t) => {
    const vx = size * t;
    const vy = w * 0.62 * Math.sin(Math.PI * t);
    return [`M${f(vx)} 0 L${f(vx + size * 0.15)} ${f(-vy)}`, `M${f(vx)} 0 L${f(vx + size * 0.15)} ${f(vy)}`];
  });
  return (
    <g transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)})`}>
      <path d={d} fill={fill} />
      <path
        d={`M0 0 L${f(size * 0.96)} 0 ${veins.join(" ")}`}
        className="fol-vein"
        strokeWidth={Math.max(0.5, size * 0.012)}
        fill="none"
      />
    </g>
  );
}

/** Rama: tallo curvo que se afina, con hojas alternas y ramitas secundarias. */
function Branch({
  r,
  x,
  y,
  angle,
  length,
  bend,
  leaf,
  fill,
  depth = 0,
}: {
  r: () => number;
  x: number;
  y: number;
  angle: number;
  length: number;
  bend: number;
  leaf: number;
  fill: string;
  depth?: number;
}) {
  const steps = Math.max(6, Math.round(length / (leaf * 0.5)));
  const pts: [number, number][] = [[x, y]];
  const items: ReactNode[] = [];
  let cx = x;
  let cy = y;
  let a = angle;
  for (let i = 1; i <= steps; i++) {
    a += bend / steps + (r() - 0.5) * 5;
    const seg = length / steps;
    cx += Math.cos((a * Math.PI) / 180) * seg;
    cy += Math.sin((a * Math.PI) / 180) * seg;
    pts.push([cx, cy]);
    const taper = 1 - (i / steps) * 0.55;
    const side = i % 2 ? 1 : -1;
    items.push(
      <Leaf key={`l${i}`} r={r} x={cx} y={cy} rot={a + side * (38 + r() * 30)} size={leaf * taper * (0.8 + r() * 0.5)} fill={fill} />,
    );
    if (depth < 1 && i > 2 && i < steps - 1 && r() < 0.32) {
      items.push(
        <Branch
          key={`b${i}`}
          r={r}
          x={cx}
          y={cy}
          angle={a + side * (35 + r() * 25)}
          length={length * (0.28 + r() * 0.2)}
          bend={side * 25}
          leaf={leaf * 0.8}
          fill={fill}
          depth={depth + 1}
        />,
      );
    }
  }
  items.push(<Leaf key="tip" r={r} x={cx} y={cy} rot={a} size={leaf * 0.7} fill={fill} />);
  const stem = pts.map(([px, py], i) => `${i ? "L" : "M"}${f(px)} ${f(py)}`).join(" ");
  return (
    <g>
      <path d={stem} className="fol-stem" strokeWidth={depth ? 1.3 : 2.4} strokeLinecap="round" fill="none" />
      {items}
    </g>
  );
}

/** Un costado completo: fondo, plano medio y primer plano. Coordenadas para un lienzo de 420×900. */
function Side({ seed, flip, tone }: { seed: number; flip?: boolean; tone: Tone }) {
  const r = rng(seed);
  const id = `${tone}${seed}`;
  // Cada plano es su propio <svg> con el desenfoque como filtro CSS del elemento: el navegador lo compone
  // en la GPU. Un filtro sobre un <g> dentro del SVG se volvería a pintar en cada cuadro y es mucho más lento.
  const plane = (key: string, className: string, style: CSSProperties, children: ReactNode, defs = false) => (
    <svg
      key={key}
      viewBox="0 0 420 900"
      preserveAspectRatio="xMinYMid slice"
      className={`fol-plane absolute inset-0 h-full w-full ${className}`}
      style={style}
    >
      {defs && (
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--fol-a)" />
            <stop offset="1" stopColor="var(--fol-b)" />
          </linearGradient>
          <linearGradient id={`b${id}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--fol-c)" />
            <stop offset="1" stopColor="var(--fol-a)" />
          </linearGradient>
        </defs>
      )}
      {children}
    </svg>
  );
  const svg = (
    <div className="fol-left absolute inset-0">
      {/* Fondo: ramas grandes, tenues y fuera de foco */}
      {plane("back", "", { filter: "blur(3.5px)", opacity: 0.4 }, <>
        <Branch r={r} x={-20} y={940} angle={-68} length={760} bend={26} leaf={92} fill={`url(#b${id})`} />
        <Branch r={r} x={-20} y={-30} angle={64} length={560} bend={-22} leaf={88} fill={`url(#b${id})`} />
      </>, true)}
      {/* Plano medio: nítido */}
      {plane("mid", "fol-mid", { opacity: 0.92 }, <>
        <Branch r={r} x={-14} y={920} angle={-60} length={560} bend={18} leaf={64} fill={`url(#a${id})`} />
        <Branch r={r} x={-14} y={470} angle={-14} length={300} bend={-30} leaf={52} fill={`url(#a${id})`} />
        <Branch r={r} x={-14} y={-10} angle={72} length={400} bend={-16} leaf={58} fill={`url(#a${id})`} />
        <Branch r={r} x={-10} y={700} angle={-30} length={220} bend={22} leaf={44} fill={`url(#a${id})`} />
      </>)}
      {/* Primer plano: hojas enormes y muy desenfocadas, con movimiento propio al desplazarse */}
      {plane("front", "fol-front", { filter: "blur(9px)", opacity: 0.85 }, <>
        <Branch r={r} x={-40} y={980} angle={-52} length={330} bend={14} leaf={170} fill={`url(#a${id})`} />
        <Branch r={r} x={-40} y={-60} angle={50} length={230} bend={-10} leaf={150} fill={`url(#a${id})`} />
      </>)}
    </div>
  );
  // El costado derecho es el izquierdo reflejado.
  return flip ? <div className="absolute inset-0 -scale-x-100">{svg}</div> : svg;
}

/** Manchas de sombra de hojas que se mecen sobre la página, como luz filtrada entre el follaje. */
function Dapple() {
  const r = rng(77);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="fol-dapple absolute inset-0 h-full w-full"
      style={{ filter: "blur(16px)" }}
    >
      <g fill="currentColor">
        <Branch r={r} x={1700} y={-40} angle={150} length={900} bend={22} leaf={150} fill="currentColor" />
        <Branch r={r} x={-100} y={980} angle={-25} length={700} bend={-20} leaf={130} fill="currentColor" />
        <Branch r={r} x={800} y={-120} angle={95} length={500} bend={30} leaf={120} fill="currentColor" />
      </g>
    </svg>
  );
}

/** Rayos de luz diagonales que entran desde arriba y "respiran" despacio. */
function Rays() {
  return (
    <div className="fol-rays absolute inset-0">
      {[8, 24, 47, 66].map((left, i) => (
        <span key={left} style={{ left: `${left}%`, animationDelay: `${-i * 3.5}s`, width: `${7 + (i % 2) * 5}vw` }} />
      ))}
    </div>
  );
}

/** Unas pocas hojas que caen despacio, meciéndose. Distintos tamaños y desenfoques dan profundidad. */
const FALLING = [
  { left: 6, size: 26, dur: 26, delay: -3, blur: 0 },
  { left: 18, size: 44, dur: 34, delay: -19, blur: 4 },
  { left: 33, size: 18, dur: 22, delay: -11, blur: 0 },
  { left: 57, size: 22, dur: 29, delay: -25, blur: 1 },
  { left: 72, size: 52, dur: 38, delay: -7, blur: 6 },
  { left: 86, size: 24, dur: 24, delay: -15, blur: 0 },
  { left: 95, size: 34, dur: 31, delay: -28, blur: 2 },
];

function FallingLeaves() {
  return (
    <div className="fol-fall absolute inset-0">
      {FALLING.map((l) => (
        <span
          key={l.left}
          style={{ left: `${l.left}%`, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s` }}
        >
          <svg
            viewBox="-2 -16 50 32"
            width={l.size}
            height={l.size * 0.64}
            style={{ filter: l.blur ? `blur(${l.blur}px)` : undefined, animationDuration: `${l.dur / 5}s` }}
          >
            <path d="M0 0 C 9 -15, 31 -15, 46 0 C 31 13, 9 14, 0 0 Z" fill="var(--fol-b)" />
            <path d="M1 0 H44" className="fol-vein" strokeWidth="0.8" />
          </svg>
        </span>
      ))}
    </div>
  );
}

/**
 * Capa de follaje fija detrás del contenido. Es "sticky" con altura de pantalla y margen negativo para no
 * empujar el contenido, y queda con z-index negativo: dentro de `isolate` se pinta sobre el fondo de su contenedor.
 */
export function Foliage({ tone = "light" }: { tone?: Tone }) {
  return (
    <div
      aria-hidden="true"
      data-foliage={tone}
      className="pointer-events-none sticky top-0 -z-10 -mb-[100svh] h-[100svh] w-full overflow-hidden"
    >
      <div className="fol-edge fol-edge-l absolute inset-y-0 -left-[8vw] w-[34vw] max-w-[440px] md:-left-[5vw] md:w-[22vw]">
        <Side seed={11} tone={tone} />
      </div>
      <div className="fol-edge fol-edge-r absolute inset-y-0 -right-[8vw] w-[34vw] max-w-[440px] md:-right-[5vw] md:w-[22vw]">
        <Side seed={29} flip tone={tone} />
      </div>
      {/* Claro del bosque: el centro se aclara para que el texto siempre se lea */}
      <div className="fol-clearing absolute inset-0" />
      <Rays />
      <FallingLeaves />
      <Dapple />
    </div>
  );
}

/**
 * Ramas sueltas para usar dentro de otro componente (por ejemplo, detrás del vidrio de la portada).
 * Las coordenadas van en el sistema de `viewBox`.
 */
export function Branches({
  seed,
  viewBox,
  items,
  className = "",
}: {
  seed: number;
  viewBox: string;
  items: { x: number; y: number; angle: number; length: number; bend: number; leaf: number }[];
  className?: string;
}) {
  const r = rng(seed);
  const id = `br${seed}`;
  return (
    <svg aria-hidden="true" viewBox={viewBox} preserveAspectRatio="xMidYMid slice" className={className} data-foliage="light">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--fol-a)" />
          <stop offset="1" stopColor="var(--fol-b)" />
        </linearGradient>
      </defs>
      {items.map((b, i) => (
        <Branch key={i} r={r} {...b} fill={`url(#${id})`} />
      ))}
    </svg>
  );
}
