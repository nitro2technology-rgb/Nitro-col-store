"use client";

const FIELDS = ["price", "offer", "cost"];

/** Copia precio normal, oferta y costo del primer color a todos los demás colores del producto (no guarda: luego «Guardar todo»). */
export function CopyPrices({ skus }: { skus: string[] }) {
  function copy() {
    const [first, ...rest] = skus;
    if (!first) return;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    for (const f of FIELDS) {
      const src = document.querySelector<HTMLInputElement>(`input[name="v__${first}__${f}"]`);
      if (!src) continue;
      for (const sku of rest) {
        const dst = document.querySelector<HTMLInputElement>(`input[name="v__${sku}__${f}"]`);
        if (!dst) continue;
        set.call(dst, src.value);
        dst.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  }
  if (skus.length < 2) return null;
  return (
    <button type="button" onClick={copy} className="mt-3 rounded-[10px] border border-[#5b4fe0] px-4 py-2 text-[14px] font-semibold text-[#5b4fe0] hover:bg-[#5b4fe0] hover:text-white">
      Copiar precio, oferta y costo del primer color a todos los colores
    </button>
  );
}
