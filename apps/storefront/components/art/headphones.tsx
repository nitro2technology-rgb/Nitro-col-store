import { useId } from "react";

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
}

/** Audífonos de diadema en vista frontal, con el anillo iridiscente del DESIGN.md. */
export function HeadphonesArt({
  swatch = "#1f2937",
  className,
  label = "Audífonos",
}: {
  swatch?: string;
  className?: string;
  label?: string;
}) {
  const id = useId().replace(/:/g, "");
  const p = isLight(swatch)
    ? { body: "#f7f7f7", band: "#f7f7f7", cushion: "#9ca3af", detail: "#ededed", edge: "#9ca3af" }
    : { body: "#1f2937", band: "#1f2937", cushion: "#111827", detail: "#4b5563", edge: "#111827" };

  return (
    <svg viewBox="0 0 640 560" role="img" aria-label={label} className={className}>
      <defs>
        <linearGradient id={`${id}-iri`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#0894ff" />
          <stop offset="0.4" stopColor="#c959dd" />
          <stop offset="0.67" stopColor="#ff2e54" />
          <stop offset="1" stopColor="#ff9003" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      <g className="ring-spin">
        <circle cx="320" cy="290" r="240" fill="none" stroke={`url(#${id}-iri)`} strokeWidth="26" opacity="0.55" filter={`url(#${id}-glow)`} />
        <circle cx="320" cy="290" r="240" fill="none" stroke={`url(#${id}-iri)`} strokeWidth="5" />
      </g>

      {/* Diadema */}
      <path d="M148 330 C148 104 492 104 492 330" fill="none" stroke={p.edge} strokeWidth="36" strokeLinecap="round" />
      <path d="M148 330 C148 104 492 104 492 330" fill="none" stroke={p.band} strokeWidth="31" strokeLinecap="round" />
      <path d="M178 318 C178 150 462 150 462 318" fill="none" stroke={p.cushion} strokeWidth="12" strokeLinecap="round" />

      {/* Horquillas */}
      <rect x="126" y="296" width="44" height="64" rx="18" fill={p.band} stroke={p.edge} strokeWidth="2" />
      <rect x="470" y="296" width="44" height="64" rx="18" fill={p.band} stroke={p.edge} strokeWidth="2" />

      {/* Almohadillas */}
      <rect x="186" y="314" width="34" height="146" rx="17" fill={p.cushion} />
      <rect x="420" y="314" width="34" height="146" rx="17" fill={p.cushion} />

      {/* Copas */}
      <rect x="94" y="288" width="108" height="194" rx="54" fill={p.body} stroke={p.edge} strokeWidth="2" />
      <rect x="438" y="288" width="108" height="194" rx="54" fill={p.body} stroke={p.edge} strokeWidth="2" />
      <circle cx="148" cy="385" r="31" fill={p.detail} />
      <circle cx="148" cy="385" r="7" fill={p.band} />
      <circle cx="492" cy="385" r="31" fill={p.detail} />
      <circle cx="492" cy="385" r="7" fill={p.band} />
    </svg>
  );
}
