import { useId } from "react";

type Tone = "light" | "dark";

/** Lámpara de mesa (kind="table") o de pie (kind="floor") con su cono de luz. */
export function LampArt({
  kind,
  tone,
  className,
  label = "Lámpara",
}: {
  kind: "table" | "floor";
  tone: Tone;
  className?: string;
  label?: string;
}) {
  const dark = tone === "dark";
  const metal = dark ? "#9ca3af" : "#4b5563";
  const shade = dark ? "#f2e6d0" : "#ffffff";
  const edge = dark ? "#d9c9a8" : "#9ca3af";
  const glow = "#f5c46b";

  return (
    <svg viewBox="0 0 480 560" role="img" aria-label={label} className={className}>
      {kind === "table" ? (
        <>
          <circle cx="240" cy="190" r="190" fill={glow} opacity={dark ? 0.07 : 0.12} />
          <circle cx="240" cy="190" r="125" fill={glow} opacity={dark ? 0.1 : 0.16} />
          <path d="M120 262 L360 262 L440 520 L40 520 Z" fill={glow} opacity={dark ? 0.1 : 0.14} />
          <rect x="231" y="258" width="18" height="214" rx="9" fill={metal} />
          <rect x="150" y="466" width="180" height="30" rx="15" fill={metal} />
          <path d="M156 118 L324 118 L368 262 L112 262 Z" fill={shade} stroke={edge} strokeWidth="2" />
          <ellipse cx="240" cy="262" rx="128" ry="9" fill={glow} opacity="0.9" />
        </>
      ) : (
        <>
          <circle cx="240" cy="130" r="128" fill={glow} opacity={dark ? 0.07 : 0.12} />
          <circle cx="240" cy="130" r="80" fill={glow} opacity={dark ? 0.1 : 0.16} />
          <path d="M156 150 L324 150 L440 530 L40 530 Z" fill={glow} opacity={dark ? 0.1 : 0.14} />
          <rect x="233" y="140" width="14" height="340" rx="7" fill={metal} />
          <rect x="170" y="478" width="140" height="22" rx="11" fill={metal} />
          <path d="M146 150 C146 56 334 56 334 150 Z" fill={shade} stroke={edge} strokeWidth="2" />
          <ellipse cx="240" cy="150" rx="94" ry="8" fill={glow} opacity="0.9" />
        </>
      )}
    </svg>
  );
}

/** Jarrón de cerámica con ramas secas. */
export function VaseArt({
  swatch = "#b9785a",
  tone,
  className,
  label = "Jarrón",
}: {
  swatch?: string;
  tone: Tone;
  className?: string;
  label?: string;
}) {
  const id = useId().replace(/:/g, "");
  const stem = tone === "dark" ? "#9ca3af" : "#4b5563";
  return (
    <svg viewBox="0 0 480 560" role="img" aria-label={label} className={className}>
      <ellipse cx="240" cy="498" rx="120" ry="12" fill={tone === "dark" ? "#1f2937" : "#9ca3af"} opacity={tone === "dark" ? 1 : 0.35} />
      <g fill="none" stroke={stem} strokeWidth="4" strokeLinecap="round">
        <path d="M240 170 C 230 110 200 70 170 40" />
        <path d="M240 170 C 250 100 290 70 330 36" />
        <path d="M240 170 C 240 120 246 80 244 30" />
      </g>
      <g fill={stem}>
        <ellipse cx="190" cy="76" rx="9" ry="17" transform="rotate(-30 190 76)" />
        <ellipse cx="312" cy="72" rx="9" ry="17" transform="rotate(30 312 72)" />
        <ellipse cx="244" cy="56" rx="8" ry="16" />
      </g>
      <defs>
        <clipPath id={`${id}-body`}>
          <path d="M205 170 C205 140 275 140 275 170 C275 215 352 245 352 345 C352 440 300 484 240 484 C180 484 128 440 128 345 C128 245 205 215 205 170 Z" />
        </clipPath>
      </defs>
      <path
        d="M205 170 C205 140 275 140 275 170 C275 215 352 245 352 345 C352 440 300 484 240 484 C180 484 128 440 128 345 C128 245 205 215 205 170 Z"
        fill={swatch}
      />
      <g clipPath={`url(#${id}-body)`}>
        <rect x="120" y="330" width="240" height="10" fill="#000" opacity="0.12" />
        <rect x="120" y="356" width="240" height="4" fill="#000" opacity="0.1" />
      </g>
      <ellipse cx="240" cy="160" rx="36" ry="9" fill="#000" opacity="0.35" />
    </svg>
  );
}

/** Tres velas de distinta altura sobre una bandeja. */
export function CandlesArt({
  swatch = "#ededed",
  tone,
  className,
  label = "Velas",
}: {
  swatch?: string;
  tone: Tone;
  className?: string;
  label?: string;
}) {
  const tray = tone === "dark" ? "#9ca3af" : "#4b5563";
  const wick = tone === "dark" ? "#ededed" : "#111827";
  const candles = [
    { x: 120, h: 170 },
    { x: 210, h: 250 },
    { x: 300, h: 130 },
  ];
  return (
    <svg viewBox="0 0 480 560" role="img" aria-label={label} className={className}>
      <rect x="80" y="450" width="320" height="26" rx="13" fill={tray} />
      {candles.map(({ x, h }) => (
        <g key={x}>
          <rect x={x} y={450 - h} width="60" height={h} rx="8" fill={swatch} stroke={tone === "dark" ? "none" : "#9ca3af"} strokeWidth="2" />
          <rect x={x + 28} y={450 - h - 20} width="4" height="20" rx="2" fill={wick} />
          <ellipse cx={x + 30} cy={450 - h - 40} rx="11" ry="22" fill="#f56900" />
          <ellipse cx={x + 30} cy={450 - h - 36} rx="5" ry="12" fill="#ffd58a" />
          <circle cx={x + 30} cy={450 - h - 40} r="44" fill="#f5c46b" opacity={tone === "dark" ? 0.1 : 0.16} />
        </g>
      ))}
    </svg>
  );
}
