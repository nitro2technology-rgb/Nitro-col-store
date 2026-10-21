import type { ButtonHTMLAttributes } from "react";

type Variant = "buy" | "ghost";

const base =
  "inline-flex items-center justify-center rounded-button px-5 py-2.5 text-[17px] font-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  // La acción principal invierte los colores del tema: claro sobre oscuro y viceversa.
  buy: "bg-action text-on-action hover:opacity-90",
  ghost: "border border-ink text-ink backdrop-blur-md hover:bg-ink hover:text-canvas",
};

/** Clases del botón, para aplicarlas también a enlaces. */
export function buttonClasses(variant: Variant = "buy", className = "") {
  return `${base} ${variants[variant]} ${className}`;
}

export function Button({
  variant = "buy",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={buttonClasses(variant, className)} {...props} />;
}
