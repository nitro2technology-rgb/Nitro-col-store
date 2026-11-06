// Piezas comunes del panel. Estilo: tarjetas blancas con borde fino y un solo acento violeta.
import { formatCOP } from "@nitro/shared";
import { ORDER_STATUS } from "@/lib/order-status";

export const field =
  "w-full rounded-[10px] border border-[#dcdce6] bg-white px-3 py-2 text-[15px] text-ink outline-none focus:border-[#5b4fe0] focus:ring-2 focus:ring-[#5b4fe0]/20";
export const card = "rounded-[14px] border border-[#e6e6ee] bg-white p-5";
export const label = "block text-[13px] font-medium text-[#5c5c70]";
export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#5b4fe0] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#4a3fd0] disabled:opacity-50";
export const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#dcdce6] bg-white px-4 py-2 text-[14px] font-semibold text-ink hover:border-[#5b4fe0] hover:text-[#5b4fe0]";

export const cop = (cents: bigint | number | null | undefined) => formatCOP(Number(cents ?? 0));
export const pct = (n: number) => `${n.toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`;

/** Miniatura pregenerada (ver lib/image-loader.ts) para no bajar la foto grande en las listas. */
export const thumb = (src: string | undefined) =>
  src && src.startsWith("/products/") && src.endsWith(".webp") ? `${src.slice(0, -5)}-480.webp` : src;

/** Mensaje tras una acción (?ok= / ?error= en la dirección). */
export function Notice({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div className="mt-6 space-y-2" role="status">
      {ok && <p className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] text-emerald-900">{ok}</p>}
      {error && <p className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-800">{error}</p>}
    </div>
  );
}

const tone: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  paid: "bg-sky-100 text-sky-900",
  processing: "bg-violet-100 text-violet-900",
  shipped: "bg-indigo-100 text-indigo-900",
  delivered: "bg-emerald-100 text-emerald-900",
  return_requested: "bg-orange-100 text-orange-900",
  returned: "bg-orange-100 text-orange-900",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-semibold ${tone[status] ?? "bg-[#ececf2] text-ink"}`}>
      {ORDER_STATUS[status] ?? status}
    </span>
  );
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.02em] text-[#1d1b3a]">{children}</h1>
      {sub && <p className="mt-1 text-[15px] text-[#6b6b80]">{sub}</p>}
    </div>
  );
}

/** Encabezado de tarjeta al estilo de la referencia: título, subtítulo y una acción a la derecha. */
export function CardHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[19px] font-semibold text-[#1d1b3a]">{title}</h2>
        {sub && <p className="text-[14px] text-[#6b6b80]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** Número grande con icono, como la columna de cifras de la referencia. */
export function Stat({ icon, value, label: text, hint }: { icon: IconName; value: string; label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-[#f3f3f8] text-[#3d3d55]">
        <Icon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[22px] font-bold tracking-[-0.01em] text-[#1d1b3a]">{value}</p>
        <p className="text-[13px] text-[#6b6b80]" title={hint}>
          {text}
          {hint && <span className="ml-1 text-[#a0a0b2]">ⓘ</span>}
        </p>
      </div>
    </div>
  );
}

const PATHS = {
  home: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  orders: "M5 7h14l-1.5 12h-11zM9 7V5a3 3 0 0 1 6 0v2",
  box: "M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10",
  returns: "M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  truck: "M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  cash: "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 10v4M18 10v4",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  coins: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  tag: "M3 12V3h9l9 9-9 9zM8 8h.01",
  alert: "M12 3l10 18H2zM12 10v4M12 17h.01",
  store: "M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16M9 20v-6h6v6",
  out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
} as const;
export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-[20px]" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
