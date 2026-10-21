/** Reloj en titanio con carátula de rutas, sobre fondo oscuro. */
export function WatchArt({
  className,
  label = "Reloj inteligente",
}: {
  className?: string;
  label?: string;
}) {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg viewBox="0 0 400 600" role="img" aria-label={label} className={className}>
      {/* Correas */}
      <rect x="125" y="-10" width="150" height="200" rx="34" fill="#4b5563" />
      <rect x="125" y="410" width="150" height="200" rx="34" fill="#4b5563" />
      {[30, 60, 90, 120, 150].map((y) => (
        <rect key={`t${y}`} x="143" y={y} width="114" height="3" rx="1.5" fill="#374151" />
      ))}
      {[450, 480, 510, 540, 570].map((y) => (
        <rect key={`b${y}`} x="143" y={y} width="114" height="3" rx="1.5" fill="#374151" />
      ))}

      {/* Botones laterales */}
      <rect x="312" y="246" width="20" height="58" rx="9" fill="#d1d5db" />
      <rect x="312" y="326" width="12" height="44" rx="6" fill="#6b7280" />
      <rect x="68" y="262" width="16" height="76" rx="7" fill="#f56900" />

      {/* Caja de titanio */}
      <rect x="80" y="166" width="240" height="268" rx="68" fill="#9ca3af" />
      <rect x="90" y="176" width="220" height="248" rx="60" fill="#d1d5db" />
      <rect x="102" y="188" width="196" height="224" rx="50" fill="#111827" />
      <rect x="110" y="196" width="180" height="208" rx="43" fill="#000" />

      {/* Carátula */}
      <g transform="translate(200 300)">
        {ticks.map((i) => (
          <line
            key={i}
            x1="0"
            y1={i % 5 === 0 ? -86 : -84}
            x2="0"
            y2="-79"
            stroke={i % 5 === 0 ? "#a3e635" : "#4b5563"}
            strokeWidth={i % 5 === 0 ? 2.5 : 1.2}
            transform={`rotate(${i * 6})`}
          />
        ))}
        <circle r="66" fill="none" stroke="#1f2a10" strokeWidth="7" />
        <circle
          r="66"
          fill="none"
          stroke="#a3e635"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="250 415"
          transform="rotate(-90)"
        />
        <text y="-24" textAnchor="middle" fontSize="12" fontWeight="600" fill="#a3e635" fontFamily="Inter, system-ui, sans-serif">
          LUN 21
        </text>
        <text y="22" textAnchor="middle" fontSize="46" fontWeight="600" fill="#ededed" fontFamily="Inter Tight, Inter, system-ui, sans-serif" letterSpacing="-1">
          10:09
        </text>
        <text y="46" textAnchor="middle" fontSize="11" fill="#9ca3af" fontFamily="Inter, system-ui, sans-serif">
          12 km · 1 h 04 min
        </text>
      </g>
    </svg>
  );
}
