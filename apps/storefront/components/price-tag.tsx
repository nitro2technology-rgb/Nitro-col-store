import { formatPrice } from "@nitro/shared";

/**
 * Precio de venta y, si el producto está en oferta, el precio original tachado con el porcentaje de descuento.
 * Es el único lugar que pinta un precio de producto: así la oferta se ve igual en todas las fichas, tarjetas y el carrito.
 * Toma el color del texto que la rodea (también funciona en las fichas oscuras).
 */
export function PriceTag({
  priceCents,
  compareAtCents,
  className = "",
  badge = true,
}: {
  priceCents: number;
  compareAtCents?: number | null;
  className?: string;
  badge?: boolean;
}) {
  const sale = !!compareAtCents && priceCents > 0 && compareAtCents > priceCents;
  const pct = sale ? Math.round((1 - priceCents / compareAtCents!) * 100) : 0;
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <span>{formatPrice(priceCents)}</span>
      {sale && (
        <>
          <s className="text-[0.78em] font-normal opacity-60" aria-label={`Precio original ${formatPrice(compareAtCents!)}`}>
            {formatPrice(compareAtCents!)}
          </s>
          {badge && pct > 0 && (
            <span className="rounded-full border border-current px-2 py-px text-[0.62em] font-semibold normal-case tracking-normal opacity-80">-{pct}%</span>
          )}
        </>
      )}
    </span>
  );
}
