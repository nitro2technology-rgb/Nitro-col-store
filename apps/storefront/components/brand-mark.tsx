/** Logo de Nitro Col. Hereda el color del texto; `write` anima su escritura. */
export function BrandMark({ className = "", write = false }: { className?: string; write?: boolean }) {
  return (
    <div
      role="img"
      aria-label="Nitro Col, desde 2020"
      className={`brand-mark ${write ? "brand-write" : ""} ${className}`}
    />
  );
}
