// Piezas comunes del panel.
import { ORDER_STATUS } from "@/lib/order-status";

export const field = "w-full rounded-[12px] border border-ink/25 bg-white/70 px-3 py-2 text-[15px] text-ink";
export const card = "rounded-[20px] border border-ink/10 bg-white/80 p-5 backdrop-blur-md";

/** Mensaje tras una acción (?ok= / ?error= en la dirección). */
export function Notice({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div className="mt-6 space-y-2" role="status">
      {ok && <p className="rounded-[12px] bg-emerald-50 px-4 py-3 text-[15px] text-emerald-900">{ok}</p>}
      {error && <p className="rounded-[12px] bg-red-50 px-4 py-3 text-[15px] text-red-800">{error}</p>}
    </div>
  );
}

const tone: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  paid: "bg-sky-100 text-sky-900",
  processing: "bg-violet-100 text-violet-900",
  shipped: "bg-indigo-100 text-indigo-900",
  delivered: "bg-emerald-100 text-emerald-900",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[13px] font-semibold ${tone[status] ?? "bg-ink/10 text-ink"}`}>
      {ORDER_STATUS[status] ?? status}
    </span>
  );
}
