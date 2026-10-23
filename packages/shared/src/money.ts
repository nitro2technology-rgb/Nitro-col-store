/** El dinero se guarda como entero en la unidad mínima (centavos). Nunca float. */
export function formatCOP(cents: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Precio para mostrar; 0 significa que el dueño aún no lo define. */
export function formatPrice(cents: number): string {
  return cents > 0 ? formatCOP(cents) : "Precio por definir";
}
